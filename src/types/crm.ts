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

export interface Client {
  id: string;
  clientName: string;
  projectName: string | null;
  contactPerson: string | null;
  meetingDate: string | null;
  dealStage: DealStage;
  dealValue: string | null;
  painPoints: string[];
  goals: string[];
  expectations: string[];
  nextActions: string[];
  differentials: string[];
  technicalNotes: string | null;
  otherRelevantInfo: string | null;
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
  contactPerson: string | null;
  meetingDate: string | null;
  dealStage: DealStage;
  dealValue: string | null;
  painPoints: string[];
  goals: string[];
  expectations: string[];
  nextActions: string[];
  differentials: string[];
  technicalNotes: string | null;
  otherRelevantInfo: string | null;
}

export const STAGE_BADGE_STYLES: Record<DealStage, { bg: string; text: string; dot: string }> = {
  "Prospecção": { bg: "bg-gray-100", text: "text-gray-600", dot: "bg-gray-400" },
  "Qualificação": { bg: "bg-blue-50", text: "text-blue-600", dot: "bg-blue-400" },
  "Proposta Enviada": { bg: "bg-violet-50", text: "text-violet-600", dot: "bg-violet-400" },
  "Negociação": { bg: "bg-amber-50", text: "text-amber-600", dot: "bg-amber-400" },
  "Fechado - Ganho": { bg: "bg-emerald-50", text: "text-emerald-600", dot: "bg-emerald-400" },
  "Fechado - Perdido": { bg: "bg-red-50", text: "text-red-600", dot: "bg-red-400" },
};
