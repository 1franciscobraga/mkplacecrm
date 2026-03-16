export type DealStage =
  | "Prospecção"
  | "Qualificação"
  | "Proposta Enviada"
  | "Negociação"
  | "Fechado - Ganho"
  | "Fechado - Perdido";

export const DEAL_STAGES: DealStage[] = [
  "Prospecção",
  "Qualificação",
  "Proposta Enviada",
  "Negociação",
  "Fechado - Ganho",
  "Fechado - Perdido",
];

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

export const STAGE_BADGE_STYLES: Record<DealStage, { bg: string; text: string; dot: string }> = {
  "Prospecção": { bg: "bg-gray-100", text: "text-gray-600", dot: "bg-gray-400" },
  "Qualificação": { bg: "bg-blue-50", text: "text-blue-600", dot: "bg-blue-400" },
  "Proposta Enviada": { bg: "bg-violet-50", text: "text-violet-600", dot: "bg-violet-400" },
  "Negociação": { bg: "bg-amber-50", text: "text-amber-600", dot: "bg-amber-400" },
  "Fechado - Ganho": { bg: "bg-emerald-50", text: "text-emerald-600", dot: "bg-emerald-400" },
  "Fechado - Perdido": { bg: "bg-red-50", text: "text-red-600", dot: "bg-red-400" },
};
