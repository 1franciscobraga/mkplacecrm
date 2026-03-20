import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { transcript, existingClients } = await req.json();
    if (!transcript) {
      return new Response(JSON.stringify({ error: "Transcript is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const clientNames = (existingClients || []).map((c: any) => c.clientName).join(", ");
    const today = new Date().toISOString().slice(0, 10);

    const systemPrompt = `You are a B2B sales operations assistant for Mkplace, a marketplace technology company.
You receive transcripts or summaries of internal commercial meetings. Your job is to extract:
1. Companies mentioned and whether they already exist in the CRM
2. Next steps for each company
3. Stage changes if evidenced

EXISTING CLIENTS IN CRM: [${clientNames}]

IMPORTANT RULES:
- Match company names flexibly (e.g., "Pic Pay" = "PicPay", "B3" = "B3 - Brasil Bolsa Balcão")
- If a company is already in the CRM, set isExisting: true and provide the matched name exactly as it appears in the list above
- If a company is NOT in the list, set isExisting: false
- Do NOT create duplicates of existing companies
- Extract concrete, actionable next steps (not vague)
- If a deadline or date is mentioned, include it in YYYY-MM-DD format
- Infer urgency from context (e.g., "urgente", "precisa ser essa semana", "até sexta")
- Today's date is ${today}

Return ONLY valid JSON with no markdown:
{
  "insights": [
    {
      "companyName": "string — company name as mentioned",
      "matchedName": "string or null — exact name from CRM if existing",
      "isExisting": true/false,
      "nextSteps": ["array of concrete next steps mentioned"],
      "deadline": "string or null — YYYY-MM-DD if a date/deadline was mentioned or implied",
      "suggestedStage": "string or null — one of the 7 stage names if a stage change is evidenced",
      "urgency": "Baixa | Média | Alta — inferred from context",
      "responsible": "string or null — who should do it if mentioned",
      "context": "string — brief summary of what was discussed about this company (1-2 sentences)"
    }
  ],
  "generalNotes": "string or null — any general observations not tied to a specific company"
}

FUNNEL STAGES (exact names):
1. "Lead demonstrou interesse"
2. "Reunião Introdução"
3. "Escopo do projeto"
4. "Proposta comercial"
5. "Contrato"
6. "Assinatura"
7. "Go-Live e Implantação"

Always respond with company-related content in Portuguese (Brazil).`;

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
          { role: "user", content: `Analyze the following internal meeting transcript/summary and extract all company mentions, next steps, and relevant updates:\n\n${transcript}` },
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
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
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
    console.error("process-meeting error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
