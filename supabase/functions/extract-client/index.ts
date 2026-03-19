import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are a senior B2B sales analyst for Mkplace, a marketplace technology company. Your job is to extract structured CRM data from meeting transcripts and classify the deal stage with precision.

Return ONLY valid JSON with no markdown, no explanation, no code blocks.

## FUNNEL STAGES (in order of progression):
1. "Lead demonstrou interesse"  — Client showed initial interest, requested contact or demo, no meeting held yet.
2. "Reunião Introdução"         — First introductory meeting occurred; Mkplace was presented; client shared context.
3. "Escopo do projeto"          — Technical/business scope was discussed; requirements, integrations, complexity defined.
4. "Proposta comercial"         — A commercial proposal or pricing was sent or discussed explicitly.
5. "Contrato"                   — Contract terms are being reviewed, negotiated, or are pending signature.
6. "Assinatura"                 — Contract was signed; deal is confirmed; onboarding not yet started.
7. "Go-Live e Implantação"      — Implementation is underway or completed; project is live.

## CLASSIFICATION RULES (strict):
- Always classify to the MOST ADVANCED stage clearly evidenced in the transcript.
- Never downgrade a stage without explicit evidence of regression.
- If multiple stages are discussed in retrospect, classify by the CURRENT status, not past events.
- Stage must be one of the exact 7 strings above.

## Stage signal keywords (use as guidance, not as sole criteria):
- "Lead demonstrou interesse": "entrou em contato", "quero saber mais", "me mandaram indicação", "vi no linkedin".
- "Reunião Introdução": "primeira reunião", "apresentamos o mkplace", "conhecemos a empresa", "call de intro".
- "Escopo do projeto": "escopo", "requisitos", "integrações", "complexidade técnica", "levantamento", "definição técnica".
- "Proposta comercial": "proposta", "pricing", "valor", "orçamento enviado", "cotação", "apresentamos o preço".
- "Contrato": "contrato", "termos", "jurídico", "revisão contratual", "negociando o contrato".
- "Assinatura": "assinou", "contrato assinado", "deal fechado", "confirmado", "vamos começar".
- "Go-Live e Implantação": "implantação", "go-live", "em produção", "subimos", "onboarding em andamento".

## CONFIDENCE LEVEL RULES:
- 0–20: Very early stage, vague interest, no concrete commitment.
- 21–40: Some engagement but many unknowns; no scope or budget discussed.
- 41–60: Scope or proposal discussed; moderate signals of intent.
- 61–80: Strong intent, budget or timeline confirmed, low blockers.
- 81–100: Contract/signature stage; high certainty of closing.

## JSON SCHEMA:
{
  "clientName": "string — company name",
  "projectName": "string or null — internal project nickname if mentioned",
  "meetingDate": "string or null — YYYY-MM-DD format if date mentioned",
  "businessModel": "string or null — e.g. 'Marketplace White Label B2B', 'Fintech PDV', 'SaaS B2B'",
  "contactName": "string or null — main contact person name",
  "contactRole": "string or null — role/title if mentioned, e.g. 'CEO', 'CTO', 'Head de Produto'",
  "contactEmail": null,
  "contactPhone": null,
  "companyGroup": "string or null — holding or parent company if mentioned",
  "executiveSummary": "string or null — 2-3 sentence executive summary of current deal status and context",
  "painPointsAndChallenges": ["array of strings — specific problems, blockers, and challenges the client faces"],
  "goalsAndExpectations": ["array of strings — what the client wants to achieve, their success criteria"],
  "clientDifferentials": ["array of strings — competitive advantages or market strengths the client mentioned"],
  "dealValue": "string or null — contract value, GMV estimate or setup fee if mentioned (e.g. 'R$ 120k setup + 2% GMV')",
  "revenueModel": "string or null — pricing model discussed (e.g. 'Setup R$75k + 2.5% GMV', 'Mensalidade + variável')",
  "clientTimeline": "string or null — timeline or deadline mentioned (e.g. 'MVP em 60 dias', 'Q2 2026', 'precisa para março')",
  "budgetMentioned": "string or null — budget constraints, approvals, or amounts mentioned",
  "techStack": "string or null — systems, APIs, platforms, integrations mentioned (e.g. 'JWT, APIs REST, integração iFood')",
  "implementationComplexity": "string or null — one of: Baixa | Média | Alta — infer from technical scope discussed",
  "nextSteps": ["array of strings — concrete agreed action items and follow-ups from the meeting"],
  "responsibleParties": "string or null — who owns each next step (Mkplace side vs client side)",
  "nextContactDate": "string or null — follow-up date in YYYY-MM-DD if mentioned",
  "suggestedStage": "string — one of the 7 exact stage names defined above, based on the classification rules",
  "confidenceLevel": "number or null — 0 to 100 integer, estimated probability of deal closing based on signals",
  "urgency": "string or null — one of: Baixa | Média | Alta — inferred from client's timeline and tone",
  "risk": "string or null — one of: Baixa | Média | Alta — inferred from blockers, concerns, competition, or indecision",
  "expansionPotential": "string or null — one of: Baixo | Médio | Alto — based on client size, market, and future plans",
  "priceSensitivity": "string or null — one of: Baixa | Média | Alta — inferred from negotiation behavior and budget signals"
}

## MANDATORY RULES:
- contactEmail and contactPhone must ALWAYS be null (filled manually by users).
- If a field is not evidenced in the transcript, use null or empty array [].
- Infer fields from context when clearly implied — do not hallucinate details.
- Return ONLY the JSON object. No extra text, no markdown fences.`;

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
          {
            role: "user",
            content: `Analyze the following meeting transcript and extract all CRM data according to the schema and classification rules. Classify the deal stage precisely based on the evidence in the transcript.\n\nTRANSCRIPT:\n${transcript}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Tente novamente em alguns instantes." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos insuficientes. Adicione créditos ao workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
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

    // Strip markdown code fences if present
    let jsonStr = content.trim();
    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    const parsed = JSON.parse(jsonStr);

    // Map suggestedStage → dealStage for frontend compatibility
    const validStages = [
      "Lead demonstrou interesse",
      "Reunião Introdução",
      "Escopo do projeto",
      "Proposta comercial",
      "Contrato",
      "Assinatura",
      "Go-Live e Implantação",
    ];

    const suggestedStage = parsed.suggestedStage ?? parsed.dealStage ?? "";
    const dealStage = validStages.includes(suggestedStage)
      ? suggestedStage
      : "Lead demonstrou interesse";

    const result = { ...parsed, dealStage };
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
