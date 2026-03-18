import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are a data extraction assistant for a B2B sales CRM focused on marketplace and fintech deals in Brazil. Extract structured data from meeting transcripts and return ONLY valid JSON (no markdown, no explanation):

{
  "clientName": "string - company name",
  "projectName": "string or null - internal project nickname if mentioned",
  "meetingDate": "string or null - date of meeting in YYYY-MM-DD format if mentioned",
  "businessModel": "string or null - business model inferred from context, e.g. 'Marketplace White Label B2B', 'Fintech PDV', 'SaaS B2B', 'EdTech Marketplace'",
  "contactName": "string or null - main contact person name",
  "contactRole": "string or null - role/title if mentioned, e.g. 'CEO', 'CTO', 'Head de Produto'",
  "contactEmail": null,
  "contactPhone": null,
  "companyGroup": "string or null - holding or parent company if mentioned",
  "executiveSummary": "string or null - 2-3 sentence executive summary of the meeting and current deal status",
  "painPointsAndChallenges": ["array of strings - main problems and challenges the client has"],
  "goalsAndExpectations": ["array of strings - what the client wants to achieve and their expectations"],
  "clientDifferentials": ["array of strings - competitive advantages or strengths the client mentioned about themselves"],
  "dealValue": "string or null - estimated contract value, setup fee, recurring revenue or GMV if mentioned, e.g. 'R$ 75k setup + R$ 1M RR + 2.5% TR'",
  "revenueModel": "string or null - revenue/pricing model discussed, e.g. 'Setup + Recurring Revenue + Take-rate sobre GMV'",
  "clientTimeline": "string or null - timeline or urgency mentioned, e.g. 'MVP em 60 dias', 'Q2 2026', 'Go-live Mai 2026'",
  "budgetMentioned": "string or null - any budget constraints, approvals, or investment capacity mentioned",
  "techStack": "string or null - APIs, systems, platforms, integrations mentioned",
  "implementationComplexity": "string or null - one of: Baixa | Média | Alta - infer from technical requirements, integrations, and scope discussed",
  "nextSteps": ["array of strings - agreed next steps and action items from the conversation"],
  "responsibleParties": "string or null - who owns each action (client side vs our side)",
  "nextContactDate": "string or null - follow-up date or deadline in YYYY-MM-DD if mentioned",
  "suggestedStage": "string - classify into EXACTLY one of these 7 stages based on the deal context:

    'Lead demonstrou interesse' — Use when: initial lead with no qualification. The contact came through a form, responded to outbound, or made a generic request. Little context, pain not yet validated, no meeting held or structured conversation yet. No proposal, no technical discussion.

    'Reunião Introdução' — Use when: a first structured meeting (discovery call) was scheduled or just happened. The goal was to understand pain, validate fit, present the solution broadly. The conversation was broad, no proposal yet. There are clear signals of interest and a defined problem.

    'Escopo projeto' — Use when: there are active technical discussions, briefings, or detailed requirements being defined. Both sides are working to define deliverables, timeline, and budget. High engagement and deep conversation. The scope is being built or has been validated.

    'Proposta comercial' — Use when: a formal commercial proposal was sent or is being discussed. Price and conditions are on the table. There may be active negotiation, objections, or requests for adjustments. The client has reviewed or is reviewing the proposal.

    'Contrato' — Use when: a contract was sent, is under legal review, or terms are being aligned formally. The deal is essentially agreed but the legal/contractual formalization is in progress. Fine adjustments and redlines are typical.

    'Assinatura' — Use when: the contract has been signed by one or both parties. The sale is formally closed. The relationship transitions from commercial to operational.

    'Go-Live e Implantação' — Use when: the project is in execution. A kickoff was held, onboarding is underway, or the product is being actively implemented/delivered. The client is in active operation or the project has been delivered.",

  "confidenceLevel": "number or null - 0-100 confidence the deal will close: 0-20 very uncertain, 21-40 early stage low confidence, 41-60 progressing with risks, 61-80 strong signals and momentum, 81-100 near certain or already signed",
  "urgency": "string or null - one of: Baixa | Média | Alta - inferred from mentioned deadlines, timeline pressure, and client tone",
  "risk": "string or null - one of: Baixa | Média | Alta - inferred from blockers, budget concerns, competition, or lack of decision-maker alignment",
  "expansionPotential": "string or null - one of: Baixo | Médio | Alto - inferred from company size, GMV potential, number of users, and future plans mentioned",
  "priceSensitivity": "string or null - one of: Baixa | Média | Alta - inferred from negotiation signals, budget pushback, or price discussions"
}

Rules:
- contactEmail and contactPhone should ALWAYS be null (these are filled manually by the user)
- If a field is not mentioned, use null or empty array []
- For suggestedStage: read the full context carefully. Look for keywords: 'contrato', 'assinar', 'proposta enviada', 'escopo', 'reunião', 'interesse', 'go-live', 'kickoff', 'implantação'. Use the MOST ADVANCED stage that is clearly evidenced by the transcript.
- For confidenceLevel: base on engagement level, decision-maker involvement, timeline clarity, and deal maturity
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
      dealStage: parsed.suggestedStage || parsed.dealStage || "Lead demonstrou interesse",
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
