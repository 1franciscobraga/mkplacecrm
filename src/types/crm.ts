export type DealStage =
  | "Lead demonstrou interesse"
  | "Reunião Introdução"
  | "Escopo do projeto"
  | "Proposta comercial"
  | "Contrato"
  | "Assinatura"
  | "Go-Live e Implantação";

export const DEAL_STAGES: DealStage[] = [
  "Lead demonstrou interesse",
  "Reunião Introdução",
  "Escopo do projeto",
  "Proposta comercial",
  "Contrato",
  "Assinatura",
  "Go-Live e Implantação",
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
  leadSource: string | null;
  logoUrl: string | null;
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
  leadSource: string | null;
  dealStage: DealStage;
  confidenceLevel: number | null;
  urgency: ComplexityLevel | null;
  risk: ComplexityLevel | null;
  expansionPotential: PotentialLevel | null;
  priceSensitivity: SensitivityLevel | null;
}

export const STAGE_BADGE_STYLES: Record<DealStage, { bg: string; text: string; dot: string }> = {
  "Lead demonstrou interesse": { bg: "bg-gray-100",    text: "text-gray-600",    dot: "bg-gray-400"    },
  "Reunião Introdução":        { bg: "bg-blue-50",     text: "text-blue-600",    dot: "bg-blue-400"    },
  "Escopo do projeto":         { bg: "bg-cyan-50",     text: "text-cyan-700",    dot: "bg-cyan-400"    },
  "Proposta comercial":        { bg: "bg-violet-50",   text: "text-violet-600",  dot: "bg-violet-400"  },
  "Contrato":                  { bg: "bg-amber-50",    text: "text-amber-600",   dot: "bg-amber-400"   },
  "Assinatura":                { bg: "bg-orange-50",   text: "text-orange-600",  dot: "bg-orange-400"  },
  "Go-Live e Implantação":     { bg: "bg-emerald-50",  text: "text-emerald-600", dot: "bg-emerald-400" },
};
