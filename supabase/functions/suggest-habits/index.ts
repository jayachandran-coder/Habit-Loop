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
    const { answers }: { answers: PersonalityAnswers } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are a habit coach and behavioral psychologist. Based on a user's personality quiz answers, suggest 5 highly personalized daily habits that will genuinely help them improve their life. 
    
    Each habit should:
    - Be specific and actionable
    - Match their schedule and lifestyle
    - Address their goals and challenges
    - Be realistic (not overly ambitious)
    - Have a motivational description
    
    Always use tool calling to return structured habit suggestions.`;

    const userPrompt = `Here are the personality quiz answers:

Main Goal: ${answers.mainGoal}
Schedule Type: ${answers.schedule}  
Peak Productive Time: ${answers.productiveTime}
Biggest Challenge: ${answers.biggestChallenge}
Preferred Growth Style: ${answers.preferredGrowth}

Suggest 5 personalized habits tailored to this person's personality and goals.`;

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
                        name: { type: "string", description: "Short habit name (max 50 chars)" },
                        description: { type: "string", description: "Why this habit suits them (1-2 sentences)" },
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
