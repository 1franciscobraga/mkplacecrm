import { Client, DealStage } from "@/types/crm";

export interface ProbabilityBreakdown {
  overall: number;
  mkplace: number;
  client: number;
  transcript: number;
}

/**
 * Base probability for each funnel stage (reflects deal momentum).
 * Stages: Lead demonstrou interesse → Reunião Introdução → Escopo do projeto
 *         → Proposta comercial → Contrato → Assinatura → Go-Live e Implantação
 */
const STAGE_BASE: Record<DealStage, number> = {
  "Lead demonstrou interesse": 8,
  "Reunião Introdução":        20,
  "Escopo do projeto":         35,
  "Proposta comercial":        52,
  "Contrato":                  70,
  "Assinatura":                88,
  "Go-Live e Implantação":     100,
};

/**
 * Computes deal closing probability from three angles:
 * - mkplace  : how well the deal fits Mkplace's capabilities
 * - client   : how motivated/ready the client is
 * - transcript: signals extracted from the meeting transcript/AI
 *
 * Weighted average:
 *   stage momentum (30%) + mkplace fit (25%) + client readiness (25%) + transcript signals (20%)
 */
export function computeDealProbability(client: Client): ProbabilityBreakdown {
  if (client.dealStage === "Go-Live e Implantação") {
    return { overall: 100, mkplace: 100, client: 100, transcript: 100 };
  }

  // Manual override: if set, use it as the overall probability
  if (client.manualProbability != null) {
    const manual = Math.max(0, Math.min(100, client.manualProbability));
    return { overall: manual, mkplace: manual, client: manual, transcript: manual };
  }

  const stageBase = STAGE_BASE[client.dealStage];

  // --- Mkplace score: complexity fit, expansion potential, model clarity ---
  let mkplace = 50;
  if (client.implementationComplexity === "Baixa")  mkplace += 20;
  else if (client.implementationComplexity === "Média") mkplace += 5;
  else if (client.implementationComplexity === "Alta")  mkplace -= 15;

  if (client.expansionPotential === "Alto")  mkplace += 15;
  else if (client.expansionPotential === "Médio") mkplace += 5;
  else if (client.expansionPotential === "Baixo") mkplace -= 5;

  if (client.businessModel) mkplace += 10;
  if (client.techStack)     mkplace += 5;
  mkplace = Math.max(0, Math.min(100, mkplace));

  // --- Client score: urgency, price sensitivity, budget, timeline, risk ---
  let clientScore = 50;
  if (client.urgency === "Alta")  clientScore += 20;
  else if (client.urgency === "Média") clientScore += 5;
  else if (client.urgency === "Baixa") clientScore -= 15;

  if (client.priceSensitivity === "Baixa") clientScore += 15;
  else if (client.priceSensitivity === "Alta")  clientScore -= 15;

  if (client.budgetMentioned)  clientScore += 10;
  if (client.clientTimeline)   clientScore += 5;

  if (client.risk === "Baixa")  clientScore += 10;
  else if (client.risk === "Média") clientScore -= 5;
  else if (client.risk === "Alta")  clientScore -= 15;

  clientScore = Math.max(0, Math.min(100, clientScore));

  // --- Transcript score: AI confidence + meeting completeness ---
  let transcript = client.confidenceLevel ?? stageBase;
  if ((client.nextSteps?.length ?? 0) > 0)            transcript = Math.min(100, transcript + 5);
  if ((client.goalsAndExpectations?.length ?? 0) > 1) transcript = Math.min(100, transcript + 5);
  if (client.executiveSummary)                         transcript = Math.min(100, transcript + 5);
  transcript = Math.max(0, Math.min(100, transcript));

  const overall = Math.round(
    stageBase   * 0.30 +
    mkplace     * 0.25 +
    clientScore * 0.25 +
    transcript  * 0.20
  );

  return {
    overall:    Math.max(0, Math.min(100, overall)),
    mkplace:    Math.round(mkplace),
    client:     Math.round(clientScore),
    transcript: Math.round(transcript),
  };
}

export function probabilityColor(pct: number): string {
  if (pct >= 65) return "text-emerald-600";
  if (pct >= 40) return "text-amber-500";
  return "text-red-500";
}

export function probabilityBg(pct: number): string {
  if (pct >= 65) return "bg-emerald-50 text-emerald-700";
  if (pct >= 40) return "bg-amber-50 text-amber-700";
  return "bg-red-50 text-red-600";
}
