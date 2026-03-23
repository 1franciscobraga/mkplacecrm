import { DealStage, ComplexityLevel, PotentialLevel, SensitivityLevel } from "@/types/crm";

// Stage display names (data stays in Portuguese in DB)
export const STAGE_LABELS: Record<DealStage, string> = {
  "Lead demonstrou interesse": "Lead Showed Interest",
  "Reunião Introdução": "Intro Meeting",
  "Escopo do projeto": "Project Scope",
  "Proposta comercial": "Commercial Proposal",
  "Contrato": "Contract",
  "Assinatura": "Signing",
  "Go-Live e Implantação": "Go-Live & Implementation",
};

// Short labels for funnel bands
export const STAGE_SHORT: string[] = [
  "Lead", "Intro", "Scope", "Proposal", "Contract", "Signing", "Go-Live",
];

export const COMPLEXITY_LABELS: Record<ComplexityLevel, string> = {
  "Baixa": "Low",
  "Média": "Medium",
  "Alta": "High",
};

export const POTENTIAL_LABELS: Record<PotentialLevel, string> = {
  "Baixo": "Low",
  "Médio": "Medium",
  "Alto": "High",
};

export const SENSITIVITY_LABELS: Record<SensitivityLevel, string> = {
  "Baixa": "Low",
  "Média": "Medium",
  "Alta": "High",
};

export function stageLabel(stage: DealStage): string {
  return STAGE_LABELS[stage] || stage;
}

export function complexityLabel(val: string | null | undefined): string {
  if (!val) return "—";
  return COMPLEXITY_LABELS[val as ComplexityLevel] || val;
}

export function potentialLabel(val: string | null | undefined): string {
  if (!val) return "—";
  return POTENTIAL_LABELS[val as PotentialLevel] || val;
}

export function sensitivityLabel(val: string | null | undefined): string {
  if (!val) return "—";
  return SENSITIVITY_LABELS[val as SensitivityLevel] || val;
}
