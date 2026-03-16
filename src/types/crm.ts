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

export const STAGE_COLORS: Record<DealStage, string> = {
  "Prospecção": "text-muted-foreground",
  "Qualificação": "text-primary",
  "Proposta Enviada": "text-blue-400",
  "Negociação": "text-warning",
  "Fechado - Ganho": "text-emerald-400",
  "Fechado - Perdido": "text-destructive",
};

export const STAGE_DOT_COLORS: Record<DealStage, string> = {
  "Prospecção": "bg-muted-foreground",
  "Qualificação": "bg-primary",
  "Proposta Enviada": "bg-blue-400",
  "Negociação": "bg-warning",
  "Fechado - Ganho": "bg-emerald-400",
  "Fechado - Perdido": "bg-destructive",
};
