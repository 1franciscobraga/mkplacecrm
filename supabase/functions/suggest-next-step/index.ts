import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { clientName, dealStage, nextSteps, executiveSummary, meetingDate, notes } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const today = new Date().toISOString().slice(0, 10);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are a B2B sales operations assistant for Mkplace. Given a client's current context, suggest the single most impactful next step and a realistic deadline.

Return ONLY valid JSON with no markdown:
{
  "nextStep": "string — one concrete, actionable next step",
  "deadline": "string — YYYY-MM-DD format, realistic deadline considering today is ${today}"
}

Rules:
- The next step must be specific and actionable (e.g., "Enviar proposta comercial com detalhamento de custos" not "Fazer follow-up")
- Deadline should be 3-10 business days from today depending on urgency
- Consider the deal stage to suggest stage-appropriate actions
- If the client already has next steps, suggest a complementary or follow-up action
- Always respond in Portuguese (Brazil)`
          },
          {
            role: "user",
            content: `Client: ${clientName}
Deal Stage: ${dealStage}
Current Next Steps: ${JSON.stringify(nextSteps || [])}
Executive Summary: ${executiveSummary || "N/A"}
Last Meeting Date: ${meetingDate || "N/A"}
Notes: ${notes || "N/A"}`
          }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Credits exhausted" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content?.trim() || "";
    if (content.startsWith("```")) content = content.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");

    const parsed = JSON.parse(content);

    return new Response(JSON.stringify(parsed), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("suggest-next-step error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
