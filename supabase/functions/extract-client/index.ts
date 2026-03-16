import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are a data extraction assistant for a B2B sales CRM. Extract structured data from meeting transcripts and return ONLY valid JSON (no markdown, no explanation):

{
  "clientName": "string - company name",
  "projectName": "string or null - internal nickname if mentioned",
  "meetingDate": "string or null - date of meeting in YYYY-MM-DD format if mentioned",
  "businessModel": "string or null - business model inferred from context, e.g. 'Marketplace White Label B2B', 'Fintech PDV', 'SaaS B2B'",
  "contactName": "string or null - main contact person name",
  "contactRole": "string or null - role/title if mentioned, e.g. 'CEO', 'CTO', 'Head de Produto'",
  "contactEmail": null,
  "contactPhone": null,
  "companyGroup": "string or null - holding or parent company if mentioned",
  "executiveSummary": "string or null - 2-3 sentence executive summary of the meeting",
  "painPointsAndChallenges": ["array of strings - main problems and challenges the client has"],
  "goalsAndExpectations": ["array of strings - what the client wants to achieve and their expectations"],
  "clientDifferentials": ["array of strings - competitive advantages or strengths the client mentioned about themselves"],
  "dealValue": "string or null - estimated contract value or GMV if mentioned",
  "revenueModel": "string or null - revenue/pricing model discussed, e.g. 'Setup R$75k + 2.5% GMV', 'Mensalidade + variável'",
  "clientTimeline": "string or null - timeline or urgency mentioned, e.g. 'MVP em 60 dias', 'Q2 2026'",
  "budgetMentioned": "string or null - any budget constraints or approvals mentioned",
  "techStack": "string or null - APIs, systems, platforms, integrations mentioned (e.g. 'JWT, APIs REST, integração iFood')",
  "implementationComplexity": "string or null - one of: Baixa | Média | Alta - infer from technical requirements discussed",
  "nextSteps": ["array of strings - agreed next steps and action items"],
  "responsibleParties": "string or null - who owns each action, which side is responsible",
  "nextContactDate": "string or null - follow-up date or deadline in YYYY-MM-DD if mentioned",
  "suggestedStage": "string - one of: Prospecção | Qualificação | Proposta Enviada | Negociação | Fechado - Ganho | Fechado - Perdido",
  "confidenceLevel": "number or null - 0-100 confidence percentage of deal closing based on signals",
  "urgency": "string or null - one of: Baixa | Média | Alta - inferred from timeline and client tone",
  "risk": "string or null - one of: Baixa | Média | Alta - inferred from blockers and concerns",
  "expansionPotential": "string or null - one of: Baixo | Médio | Alto - inferred from client size and future plans",
  "priceSensitivity": "string or null - one of: Baixa | Média | Alta - inferred from negotiation signals and budget discussion"
}

Rules:
- contactEmail and contactPhone should ALWAYS be null (filled manually by user after meeting)
- If a field is not mentioned, use null or empty array
- Infer the deal stage from context clues about where the relationship is in the sales process
- For confidenceLevel, estimate based on buyer signals, engagement level, and deal maturity
- Always return valid JSON only`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { transcript } = await req.json();
    if (!transcript) {
      return new Response(JSON.stringify({ error: "Transcript is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: `Extract client data from this meeting transcript:\n\n${transcript}` },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Tente novamente em alguns instantes." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes. Adicione créditos ao workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content in AI response");
    }

    let jsonStr = content.trim();
    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    const parsed = JSON.parse(jsonStr);

    // Map suggestedStage to dealStage for frontend compatibility
    const result = {
      ...parsed,
      dealStage: parsed.suggestedStage || parsed.dealStage || "Prospecção",
    };
    delete result.suggestedStage;

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("extract-client error:", e);
    const message = e instanceof Error ? e.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
