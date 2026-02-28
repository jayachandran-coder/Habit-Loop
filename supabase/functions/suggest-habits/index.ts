import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface PersonalityAnswers {
  mainGoal: string;
  schedule: string;
  productiveTime: string;
  biggestChallenge: string;
  preferredGrowth: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { answers, language = "English" }: { answers: PersonalityAnswers; language?: string } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are a friendly habit coach. Based on a user's quiz answers, suggest 5 simple daily habits that will help them improve their life.

    IMPORTANT: You MUST write ALL habit names and descriptions in ${language}. Use simple, everyday ${language} words.

    Rules for your suggestions:
    - Keep habit names short (2-5 words)
    - Write descriptions like you're talking to a friend - casual and warm
    - No big or fancy words - use everyday language
    - Make habits easy to do, not too hard
    - Each description should be 1 short sentence explaining why it helps
    
    Always use tool calling to return structured habit suggestions.`;

    const userPrompt = `Here are the personality quiz answers:

Main Goal: ${answers.mainGoal}
Schedule Type: ${answers.schedule}  
Peak Productive Time: ${answers.productiveTime}
Biggest Challenge: ${answers.biggestChallenge}
Preferred Growth Style: ${answers.preferredGrowth}

Suggest 5 simple, easy-to-do habits for this person. Use simple English words only.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "suggest_habits",
              description: "Return 5 personalized habit suggestions based on personality assessment.",
              parameters: {
                type: "object",
                properties: {
                  habits: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string", description: "Short habit name in simple English (2-5 words, max 50 chars)" },
                        description: { type: "string", description: "One simple sentence about why this habit helps, using easy everyday words" },
                        icon: { type: "string", description: "Single emoji that represents this habit" },
                        goal: { type: "number", description: "Recommended monthly goal (days, 1-30)" },
                        category: { type: "string", enum: ["health", "learning", "productivity", "mindfulness", "social"] },
                      },
                      required: ["name", "description", "icon", "goal", "category"],
                      additionalProperties: false,
                    },
                    minItems: 5,
                    maxItems: 5,
                  },
                },
                required: ["habits"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "suggest_habits" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits required. Please add credits to your workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      return new Response(JSON.stringify({ error: "Failed to get AI suggestions." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall) {
      throw new Error("No tool call in AI response");
    }

    const habits = JSON.parse(toolCall.function.arguments).habits;

    return new Response(JSON.stringify({ habits }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("suggest-habits error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
