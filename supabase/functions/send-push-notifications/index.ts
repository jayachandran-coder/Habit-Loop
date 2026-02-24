import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Web Push encryption helpers
function base64UrlToBytes(base64url: string): Uint8Array {
  const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  const pad = base64.length % 4 === 0 ? "" : "=".repeat(4 - (base64.length % 4));
  const binary = atob(base64 + pad);
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}

function bytesToBase64Url(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

async function createJWT(privateKeyJwk: JsonWebKey, audience: string, subject: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "jwk",
    privateKeyJwk,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"]
  );

  const header = { typ: "JWT", alg: "ES256" };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    aud: audience,
    exp: now + 86400,
    sub: subject,
  };

  const encodedHeader = bytesToBase64Url(new TextEncoder().encode(JSON.stringify(header)));
  const encodedPayload = bytesToBase64Url(new TextEncoder().encode(JSON.stringify(payload)));
  const signingInput = `${encodedHeader}.${encodedPayload}`;

  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    key,
    new TextEncoder().encode(signingInput)
  );

  // Convert DER signature to raw r||s format if needed
  const sigBytes = new Uint8Array(signature);
  let rawSig: Uint8Array;
  if (sigBytes.length === 64) {
    rawSig = sigBytes;
  } else {
    // DER encoded - parse it
    rawSig = derToRaw(sigBytes);
  }

  const encodedSignature = bytesToBase64Url(rawSig);
  return `${signingInput}.${encodedSignature}`;
}

function derToRaw(der: Uint8Array): Uint8Array {
  const raw = new Uint8Array(64);
  // DER: 0x30 <len> 0x02 <rlen> <r> 0x02 <slen> <s>
  let offset = 2; // skip 0x30 and length
  offset += 1; // skip 0x02
  const rLen = der[offset++];
  const rStart = offset + (rLen > 32 ? rLen - 32 : 0);
  raw.set(der.slice(rStart, offset + rLen), 32 - Math.min(rLen, 32));
  offset += rLen;
  offset += 1; // skip 0x02
  const sLen = der[offset++];
  const sStart = offset + (sLen > 32 ? sLen - 32 : 0);
  raw.set(der.slice(sStart, offset + sLen), 64 - Math.min(sLen, 32));
  return raw;
}

async function encryptPayload(
  payload: string,
  p256dhKey: string,
  authSecret: string
): Promise<{ ciphertext: Uint8Array; salt: Uint8Array; localPublicKey: Uint8Array }> {
  const salt = crypto.getRandomValues(new Uint8Array(16));

  // Generate local ECDH key pair
  const localKeyPair = await crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveBits"]
  );

  const localPublicKeyRaw = new Uint8Array(
    await crypto.subtle.exportKey("raw", localKeyPair.publicKey)
  );

  // Import subscriber's public key
  const subscriberPublicKey = await crypto.subtle.importKey(
    "raw",
    base64UrlToBytes(p256dhKey).buffer as ArrayBuffer,
    { name: "ECDH", namedCurve: "P-256" },
    false,
    []
  );

  // Derive shared secret
  const sharedSecret = new Uint8Array(
    await crypto.subtle.deriveBits(
      { name: "ECDH", public: subscriberPublicKey },
      localKeyPair.privateKey,
      256
    )
  );

  const authBytes = base64UrlToBytes(authSecret);
  const subscriberPublicKeyBytes = base64UrlToBytes(p256dhKey);

  // HKDF to derive PRK
  const authInfo = new TextEncoder().encode("Content-Encoding: auth\0");
  const prk = await hkdf(authBytes, sharedSecret, authInfo, 32);

  // Key info and nonce info (RFC 8291)
  const keyInfo = createInfo("aesgcm", subscriberPublicKeyBytes, localPublicKeyRaw);
  const nonceInfo = createInfo("nonce", subscriberPublicKeyBytes, localPublicKeyRaw);

  const contentKey = await hkdf(salt, prk, keyInfo, 16);
  const nonce = await hkdf(salt, prk, nonceInfo, 12);

  // Encrypt with AES-GCM
  const aesKey = await crypto.subtle.importKey("raw", contentKey.buffer as ArrayBuffer, "AES-GCM", false, ["encrypt"]);
  const paddedPayload = new Uint8Array(2 + new TextEncoder().encode(payload).length);
  paddedPayload.set([0, 0]); // 2-byte padding length (0)
  paddedPayload.set(new TextEncoder().encode(payload), 2);

  const encrypted = new Uint8Array(
    await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonce.buffer as ArrayBuffer }, aesKey, paddedPayload.buffer as ArrayBuffer)
  );

  return { ciphertext: encrypted, salt, localPublicKey: localPublicKeyRaw };
}

function createInfo(type: string, subscriberPublicKey: Uint8Array, localPublicKey: Uint8Array): Uint8Array {
  const label = new TextEncoder().encode(`Content-Encoding: ${type}\0`);
  const p256dhLabel = new TextEncoder().encode("P-256\0");
  const info = new Uint8Array(
    label.length + 1 + p256dhLabel.length + 2 + subscriberPublicKey.length + 2 + localPublicKey.length
  );
  let offset = 0;
  info.set(label, offset); offset += label.length;
  info[offset++] = 0;
  info.set(p256dhLabel, offset); offset += p256dhLabel.length;
  info[offset++] = 0; info[offset++] = subscriberPublicKey.length;
  info.set(subscriberPublicKey, offset); offset += subscriberPublicKey.length;
  info[offset++] = 0; info[offset++] = localPublicKey.length;
  info.set(localPublicKey, offset);
  return info;
}

async function hkdf(salt: Uint8Array, ikm: Uint8Array, info: Uint8Array, length: number): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey("raw", ikm.buffer as ArrayBuffer, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const prk = new Uint8Array(await crypto.subtle.sign("HMAC", key, salt.buffer as ArrayBuffer));

  const prkKey = await crypto.subtle.importKey("raw", prk, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const infoWithCounter = new Uint8Array(info.length + 1);
  infoWithCounter.set(info);
  infoWithCounter[info.length] = 1;
  const okm = new Uint8Array(await crypto.subtle.sign("HMAC", prkKey, infoWithCounter));
  return okm.slice(0, length);
}

async function sendPushNotification(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: string,
  privateKeyJwk: JsonWebKey,
  vapidPublicKey: string
): Promise<boolean> {
  try {
    const { ciphertext, salt, localPublicKey } = await encryptPayload(
      payload,
      subscription.p256dh,
      subscription.auth
    );

    const endpointUrl = new URL(subscription.endpoint);
    const audience = `${endpointUrl.protocol}//${endpointUrl.host}`;

    const jwt = await createJWT(privateKeyJwk, audience, "mailto:noreply@habit-loop.app");

    const response = await fetch(subscription.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Encoding": "aesgcm",
        "Encryption": `salt=${bytesToBase64Url(salt)}`,
        "Crypto-Key": `dh=${bytesToBase64Url(localPublicKey)};p256ecdsa=${vapidPublicKey}`,
        Authorization: `WebPush ${jwt}`,
        TTL: "86400",
      },
      body: ciphertext.buffer as ArrayBuffer,
    });

    if (!response.ok) {
      const text = await response.text();
      console.error(`Push failed (${response.status}):`, text);
      return false;
    }
    return true;
  } catch (e) {
    console.error("sendPushNotification error:", e);
    return false;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY")!;
    const vapidPrivateKeyJwk = JSON.parse(Deno.env.get("VAPID_PRIVATE_KEY_JWK")!);

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Get all users with push subscriptions
    const { data: subscriptions, error: subError } = await supabase
      .from("push_subscriptions")
      .select("*");

    if (subError) throw subError;
    if (!subscriptions || subscriptions.length === 0) {
      return new Response(JSON.stringify({ message: "No subscriptions found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const day = today.getDate();
    const todayStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

    let sent = 0;
    let failed = 0;

    for (const sub of subscriptions) {
      // Get user's habits
      const { data: habits } = await supabase
        .from("habits")
        .select("id, name, icon")
        .eq("user_id", sub.user_id);

      if (!habits || habits.length === 0) continue;

      // Check completions for today
      const { data: completions } = await supabase
        .from("habit_completions")
        .select("habit_id")
        .eq("user_id", sub.user_id)
        .eq("completed_date", todayStr);

      const completedIds = new Set((completions || []).map((c: { habit_id: string }) => c.habit_id));
      const incomplete = habits.filter((h: { id: string }) => !completedIds.has(h.id));

      if (incomplete.length === 0) continue;

      const habitNames = incomplete
        .slice(0, 3)
        .map((h: { icon: string; name: string }) => `${h.icon} ${h.name}`)
        .join(", ");
      const extra = incomplete.length > 3 ? ` and ${incomplete.length - 3} more` : "";

      const payload = JSON.stringify({
        title: "🔔 Don't break the chain!",
        body: `${incomplete.length} habit${incomplete.length > 1 ? "s" : ""} left today: ${habitNames}${extra}`,
      });

      const success = await sendPushNotification(
        { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
        payload,
        vapidPrivateKeyJwk,
        vapidPublicKey
      );

      if (success) sent++;
      else {
        failed++;
        // Remove invalid subscription
        if (!success) {
          await supabase.from("push_subscriptions").delete().eq("id", sub.id);
        }
      }
    }

    return new Response(JSON.stringify({ sent, failed, total: subscriptions.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("send-push-notifications error:", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
