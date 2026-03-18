export type DealStage =
  | "Lead demonstrou interesse"
  | "Reunião Introdução"
  | "Escopo projeto"
  | "Proposta comercial"
  | "Contrato"
  | "Assinatura"
  | "Go-Live e Implantação";

export const DEAL_STAGES: DealStage[] = [
  "Lead demonstrou interesse",
  "Reunião Introdução",
  "Escopo projeto",
  "Proposta comercial",
  "Contrato",
  "Assinatura",
  "Go-Live e Implantação",
];

export const FINAL_STAGE: DealStage = "Go-Live e Implantação";

// How many days without update before a deal is considered stale
export const STALE_DEAL_DAYS = 14;

export type ComplexityLevel = "Baixa" | "Média" | "Alta";
export type SensitivityLevel = "Baixa" | "Média" | "Alta";
export type PotentialLevel = "Baixo" | "Médio" | "Alto";

export interface Client {
  id: string;
  // Identificação
  clientName: string;
  projectName: string | null;
  meetingDate: string | null;
  businessModel: string | null;
  // Contato Principal
  contactName: string | null;
  contactRole: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  companyGroup: string | null;
  // Análise Comercial
  executiveSummary: string | null;
  painPointsAndChallenges: string[];
  goalsAndExpectations: string[];
  clientDifferentials: string[];
  // Financeiro & Negócio
  dealValue: string | null;
  revenueModel: string | null;
  clientTimeline: string | null;
  budgetMentioned: string | null;
  // Contexto Técnico
  techStack: string | null;
  implementationComplexity: ComplexityLevel | null;
  // Plano de Ação
  nextSteps: string[];
  responsibleParties: string | null;
  nextContactDate: string | null;
  // Sidebar / Meta
  dealStage: DealStage;
  confidenceLevel: number | null;
  urgency: ComplexityLevel | null;
  risk: ComplexityLevel | null;
  expansionPotential: PotentialLevel | null;
  priceSensitivity: SensitivityLevel | null;
  // System
  assignedTo: string;
  createdAt: string;
  updatedAt: string;
  meetings: Meeting[];
  notes: string;
}

export interface Meeting {
  id: string;
  date: string;
  summary: string;
  transcript?: string;
}

export interface ExtractedData {
  clientName: string;
  projectName: string | null;
  meetingDate: string | null;
  businessModel: string | null;
  contactName: string | null;
  contactRole: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  companyGroup: string | null;
  executiveSummary: string | null;
  painPointsAndChallenges: string[];
  goalsAndExpectations: string[];
  clientDifferentials: string[];
  dealValue: string | null;
  revenueModel: string | null;
  clientTimeline: string | null;
  budgetMentioned: string | null;
  techStack: string | null;
  implementationComplexity: ComplexityLevel | null;
  nextSteps: string[];
  responsibleParties: string | null;
  nextContactDate: string | null;
  dealStage: DealStage;
  confidenceLevel: number | null;
  urgency: ComplexityLevel | null;
  risk: ComplexityLevel | null;
  expansionPotential: PotentialLevel | null;
  priceSensitivity: SensitivityLevel | null;
}

export const STAGE_BADGE_STYLES: Record<DealStage, { bg: string; text: string; dot: string; color: string }> = {
  "Lead demonstrou interesse": { bg: "bg-slate-100", text: "text-slate-600", dot: "bg-slate-400", color: "#94a3b8" },
  "Reunião Introdução":        { bg: "bg-blue-50",   text: "text-blue-600",  dot: "bg-blue-400",  color: "#60a5fa" },
  "Escopo projeto":            { bg: "bg-indigo-50", text: "text-indigo-600", dot: "bg-indigo-400", color: "#818cf8" },
  "Proposta comercial":        { bg: "bg-violet-50", text: "text-violet-600", dot: "bg-violet-400", color: "#a78bfa" },
  "Contrato":                  { bg: "bg-amber-50",  text: "text-amber-600",  dot: "bg-amber-400",  color: "#fbbf24" },
  "Assinatura":                { bg: "bg-orange-50", text: "text-orange-600", dot: "bg-orange-400", color: "#fb923c" },
  "Go-Live e Implantação":     { bg: "bg-emerald-50",text: "text-emerald-600",dot: "bg-emerald-400",color: "#34d399" },
};
