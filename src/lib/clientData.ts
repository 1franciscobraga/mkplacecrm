import {
  Client,
  ComplexityLevel,
  DEAL_STAGES,
  DealStage,
  ExtractedData,
  Meeting,
  PotentialLevel,
  SensitivityLevel,
} from "@/types/crm";

const COMPLEXITY_OPTIONS: ComplexityLevel[] = ["Baixa", "Média", "Alta"];
const POTENTIAL_OPTIONS: PotentialLevel[] = ["Baixo", "Médio", "Alto"];
const SENSITIVITY_OPTIONS: SensitivityLevel[] = ["Baixa", "Média", "Alta"];

const toNullableString = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
};

const toRequiredString = (value: unknown): string => {
  if (typeof value !== "string") return "";
  return value.trim();
};

const toStringArray = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === "string" ? item.trim() : String(item ?? "").trim()))
      .filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
  }

  return [];
};

const toConfidence = (value: unknown): number | null => {
  const numeric = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  if (!Number.isFinite(numeric)) return null;
  return Math.max(0, Math.min(100, Math.round(numeric)));
};

const toEnum = <T extends string>(value: unknown, allowed: T[]): T | null => {
  return typeof value === "string" && allowed.includes(value as T) ? (value as T) : null;
};

const toDealStage = (value: unknown): DealStage => {
  return typeof value === "string" && DEAL_STAGES.includes(value as DealStage)
    ? (value as DealStage)
    : "Prospecção";
};

const normalizeMeetings = (value: unknown): Meeting[] => {
  if (!Array.isArray(value)) return [];

  return value
    .map((item, index) => {
      if (!item || typeof item !== "object") return null;
      const meeting = item as Partial<Meeting>;
      const date = toNullableString(meeting.date) ?? new Date().toISOString().slice(0, 10);
      const summary = toNullableString(meeting.summary) ?? "Reunião registrada";
      const transcript = toNullableString(meeting.transcript) ?? undefined;

      return {
        id: toNullableString(meeting.id) ?? `m-${Date.now()}-${index}`,
        date,
        summary,
        transcript,
      };
    })
    .filter(Boolean) as Meeting[];
};

const generateClientId = () =>
  typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? `client-${crypto.randomUUID()}`
    : `client-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export const EMPTY_EXTRACTED_DATA: ExtractedData = {
  clientName: "",
  projectName: null,
  meetingDate: null,
  businessModel: null,
  contactName: null,
  contactRole: null,
  contactEmail: null,
  contactPhone: null,
  companyGroup: null,
  executiveSummary: null,
  painPointsAndChallenges: [],
  goalsAndExpectations: [],
  clientDifferentials: [],
  dealValue: null,
  revenueModel: null,
  clientTimeline: null,
  budgetMentioned: null,
  techStack: null,
  implementationComplexity: null,
  nextSteps: [],
  responsibleParties: null,
  nextContactDate: null,
  dealStage: "Prospecção",
  confidenceLevel: null,
  urgency: null,
  risk: null,
  expansionPotential: null,
  priceSensitivity: null,
};

export const normalizeExtractedData = (input?: Partial<ExtractedData> | null): ExtractedData => {
  const source = input ?? {};

  return {
    clientName: toRequiredString(source.clientName),
    projectName: toNullableString(source.projectName),
    meetingDate: toNullableString(source.meetingDate),
    businessModel: toNullableString(source.businessModel),
    contactName: toNullableString(source.contactName),
    contactRole: toNullableString(source.contactRole),
    contactEmail: toNullableString(source.contactEmail),
    contactPhone: toNullableString(source.contactPhone),
    companyGroup: toNullableString(source.companyGroup),
    executiveSummary: toNullableString(source.executiveSummary),
    painPointsAndChallenges: toStringArray(source.painPointsAndChallenges),
    goalsAndExpectations: toStringArray(source.goalsAndExpectations),
    clientDifferentials: toStringArray(source.clientDifferentials),
    dealValue: toNullableString(source.dealValue),
    revenueModel: toNullableString(source.revenueModel),
    clientTimeline: toNullableString(source.clientTimeline),
    budgetMentioned: toNullableString(source.budgetMentioned),
    techStack: toNullableString(source.techStack),
    implementationComplexity: toEnum(source.implementationComplexity, COMPLEXITY_OPTIONS),
    nextSteps: toStringArray(source.nextSteps),
    responsibleParties: toNullableString(source.responsibleParties),
    nextContactDate: toNullableString(source.nextContactDate),
    dealStage: toDealStage(source.dealStage),
    confidenceLevel: toConfidence(source.confidenceLevel),
    urgency: toEnum(source.urgency, COMPLEXITY_OPTIONS),
    risk: toEnum(source.risk, COMPLEXITY_OPTIONS),
    expansionPotential: toEnum(source.expansionPotential, POTENTIAL_OPTIONS),
    priceSensitivity: toEnum(source.priceSensitivity, SENSITIVITY_OPTIONS),
  };
};

export const normalizeClient = (input: Partial<Client>): Client => {
  const normalized = normalizeExtractedData(input);
  const now = new Date().toISOString();
  const createdAt = toNullableString(input.createdAt) ?? now;
  const updatedAt = toNullableString(input.updatedAt) ?? createdAt;

  return {
    id: toNullableString(input.id) ?? generateClientId(),
    ...normalized,
    assignedTo: toNullableString(input.assignedTo) ?? "Você",
    createdAt,
    updatedAt,
    meetings: normalizeMeetings(input.meetings),
    notes: typeof input.notes === "string" ? input.notes : "",
  };
};

interface BuildClientOptions {
  id?: string;
  assignedTo?: string;
  createdAt?: string;
  notes?: string;
  meetings?: Meeting[];
  meetingSummary?: string;
}

export const buildClientFromFormData = (
  formData: ExtractedData,
  options: BuildClientOptions = {},
): Client => {
  const now = new Date().toISOString();
  const normalized = normalizeExtractedData(formData);
  const defaultMeetings = normalized.meetingDate
    ? [
        {
          id: `m-${Date.now()}`,
          date: normalized.meetingDate,
          summary: options.meetingSummary ?? "Reunião registrada",
        },
      ]
    : [];

  return normalizeClient({
    id: options.id ?? generateClientId(),
    ...normalized,
    assignedTo: options.assignedTo ?? "Você",
    createdAt: options.createdAt ?? now,
    updatedAt: now,
    notes: options.notes ?? "",
    meetings: options.meetings ?? defaultMeetings,
  });
};
