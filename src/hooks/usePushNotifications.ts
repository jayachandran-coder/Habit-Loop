import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const usePushNotifications = (userId: string | undefined) => {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if ("Notification" in window) {
      setPermission(Notification.permission);
    }
  }, []);

  // Check if user already has a subscription
  useEffect(() => {
    if (!userId) return;
    const checkSubscription = async () => {
      const { data } = await supabase
        .from("push_subscriptions")
        .select("id")
        .eq("user_id", userId)
        .limit(1);
      setIsSubscribed(!!data && data.length > 0);
    };
    checkSubscription();
  }, [userId]);

  const getVapidPublicKey = async (): Promise<string> => {
    const { data, error } = await supabase.functions.invoke("get-vapid-key");
    if (error || !data?.publicKey) throw new Error("Failed to get VAPID key");
    return data.publicKey;
  };

  const subscribe = useCallback(async () => {
    if (!userId || !("serviceWorker" in navigator) || !("PushManager" in window)) {
      toast({ title: "Push notifications not supported", description: "Your browser doesn't support push notifications.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== "granted") {
        toast({ title: "Permission denied", description: "Please allow notifications in your browser settings." });
        return;
      }

      const registration = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      const vapidPublicKey = await getVapidPublicKey();
      const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);

      const subscription = await (registration as any).pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });

      const subJson = subscription.toJSON();

      // Upsert subscription
      const { error } = await supabase.from("push_subscriptions").upsert(
        {
          user_id: userId,
          endpoint: subJson.endpoint!,
          p256dh: subJson.keys!.p256dh,
          auth: subJson.keys!.auth,
        },
        { onConflict: "user_id" }
      );

      if (error) throw error;

      setIsSubscribed(true);
      toast({ title: "Notifications enabled! 🔔", description: "You'll receive daily reminders for incomplete habits." });
    } catch (e) {
      console.error("Push subscription error:", e);
      toast({ title: "Failed to enable notifications", description: String(e), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [userId, toast]);

  const unsubscribe = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        const subscription = await (registration as any).pushManager.getSubscription();
        if (subscription) await subscription.unsubscribe();
      }

      await supabase.from("push_subscriptions").delete().eq("user_id", userId);

      setIsSubscribed(false);
      toast({ title: "Notifications disabled", description: "You won't receive habit reminders anymore." });
    } catch (e) {
      console.error("Push unsubscribe error:", e);
      toast({ title: "Error", description: "Failed to disable notifications.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [userId, toast]);

  return { permission, isSubscribed, loading, subscribe, unsubscribe };
};

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
