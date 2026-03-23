import {
  ComplexityLevel,
  DEAL_STAGES,
  DealStage,
  ExtractedData,
  PotentialLevel,
  SensitivityLevel,
} from "@/types/crm";
import { stageLabel } from "@/lib/i18n";

interface ClientFormFieldsProps {
  data: ExtractedData;
  onChange: (data: ExtractedData) => void;
  showSidebar?: boolean;
  clientNameError?: string | null;
}

const parseLines = (value: string) =>
  value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

const ClientFormFields = ({
  data,
  onChange,
  showSidebar = false,
  clientNameError = null,
}: ClientFormFieldsProps) => {
  const set = (field: keyof ExtractedData, value: any) => onChange({ ...data, [field]: value });

  return (
    <div className="flex gap-6">
      <div className="flex-1 space-y-6">
        <SectionHeader label="Identification" />
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Field
              id="clientName"
              label="Client Name *"
              value={data.clientName}
              onChange={(v) => set("clientName", v)}
              hasError={!!clientNameError}
            />
            {clientNameError && <p className="text-xs text-destructive mt-1">{clientNameError}</p>}
          </div>
          <Field
            id="projectName"
            label="Project / Internal Name"
            value={data.projectName || ""}
            onChange={(v) => set("projectName", v || null)}
          />
          <Field
            id="meetingDate"
            label="Meeting Date"
            value={data.meetingDate || ""}
            onChange={(v) => set("meetingDate", v || null)}
            type="date"
          />
          <Field
            id="businessModel"
            label="Business Model"
            value={data.businessModel || ""}
            onChange={(v) => set("businessModel", v || null)}
            placeholder="E.g.: White Label B2B Marketplace"
          />
        </div>

        <SectionHeader label="Primary Contact" />
        <div className="grid grid-cols-2 gap-4">
          <Field
            id="contactName"
            label="Contact Name"
            value={data.contactName || ""}
            onChange={(v) => set("contactName", v || null)}
          />
          <Field
            id="contactRole"
            label="Role / Position"
            value={data.contactRole || ""}
            onChange={(v) => set("contactRole", v || null)}
            placeholder="E.g.: CEO, CTO"
          />
          <Field
            id="contactEmail"
            label="Email"
            value={data.contactEmail || ""}
            onChange={(v) => set("contactEmail", v || null)}
            type="email"
            placeholder="Fill in manually"
          />
          <Field
            id="contactPhone"
            label="Phone"
            value={data.contactPhone || ""}
            onChange={(v) => set("contactPhone", v || null)}
            type="tel"
            placeholder="Fill in manually"
          />
          <Field
            id="companyGroup"
            label="Company / Economic Group"
            value={data.companyGroup || ""}
            onChange={(v) => set("companyGroup", v || null)}
            placeholder="Holding or parent company"
          />
          <Field
            id="leadSource"
            label="Lead Source"
            value={data.leadSource || ""}
            onChange={(v) => set("leadSource", v || null)}
            placeholder="E.g.: referral, inbound, event"
          />
        </div>

        <SectionHeader label="Commercial Analysis" />
        <TextareaField
          id="executiveSummary"
          label="Executive Summary"
          value={data.executiveSummary || ""}
          onChange={(v) => set("executiveSummary", v || null)}
          placeholder="General meeting summary"
          rows={3}
        />
        <TextareaField
          id="painPoints"
          label="Pain Points & Challenges"
          value={(data.painPointsAndChallenges || []).join("\n")}
          onChange={(v) => set("painPointsAndChallenges", parseLines(v))}
          placeholder="One per line"
        />
        <TextareaField
          id="goals"
          label="Goals & Expectations"
          value={(data.goalsAndExpectations || []).join("\n")}
          onChange={(v) => set("goalsAndExpectations", parseLines(v))}
          placeholder="One per line"
        />
        <TextareaField
          id="differentials"
          label="Client Differentials"
          value={(data.clientDifferentials || []).join("\n")}
          onChange={(v) => set("clientDifferentials", parseLines(v))}
          placeholder="Competitive advantages mentioned, one per line"
        />

        <SectionHeader label="Financial & Business" />
        <div className="grid grid-cols-2 gap-4">
          <Field
            id="dealValue"
            label="Deal / Proposal Value"
            value={data.dealValue || ""}
            onChange={(v) => set("dealValue", v || null)}
            placeholder="E.g.: R$ 75,000 + 2.5% GMV"
          />
          <Field
            id="revenueModel"
            label="Revenue Model"
            value={data.revenueModel || ""}
            onChange={(v) => set("revenueModel", v || null)}
            placeholder="E.g.: Setup + variable"
          />
          <Field
            id="clientTimeline"
            label="Client Timeline / Urgency"
            value={data.clientTimeline || ""}
            onChange={(v) => set("clientTimeline", v || null)}
            placeholder="E.g.: MVP in 60 days"
          />
          <Field
            id="budgetMentioned"
            label="Budget Mentioned"
            value={data.budgetMentioned || ""}
            onChange={(v) => set("budgetMentioned", v || null)}
            placeholder="Constraints or approvals"
          />
        </div>

        <SectionHeader label="Technical Context" />
        <TextareaField
          id="techStack"
          label="Tech Stack / Relevant Integrations"
          value={data.techStack || ""}
          onChange={(v) => set("techStack", v || null)}
          placeholder="APIs, systems, platforms mentioned"
        />
        <div>
          <label htmlFor="implementationComplexity" className="block text-xs font-medium text-muted-foreground mb-1.5">
            Implementation Complexity
          </label>
          <select
            id="implementationComplexity"
            value={data.implementationComplexity || ""}
            onChange={(e) => set("implementationComplexity", (e.target.value || null) as ComplexityLevel | null)}
            className="w-full h-9 px-3 bg-card border border-border rounded-lg text-sm focus:outline-none focus:border-primary focus:shadow-input-focus transition-all"
          >
            <option value="">Not defined</option>
            <option value="Baixa">Low</option>
            <option value="Média">Medium</option>
            <option value="Alta">High</option>
          </select>
        </div>

        <SectionHeader label="Action Plan" />
        <TextareaField
          id="nextSteps"
          label="Next Steps"
          value={(data.nextSteps || []).join("\n")}
          onChange={(v) => set("nextSteps", parseLines(v))}
          placeholder="One per line"
        />
        <TextareaField
          id="responsibleParties"
          label="Responsible Parties"
          value={data.responsibleParties || ""}
          onChange={(v) => set("responsibleParties", v || null)}
          placeholder="Who is responsible for each action"
          rows={2}
        />
        <div className="grid grid-cols-2 gap-4">
          <Field
            id="nextContactDate"
            label="Next Contact Date"
            value={data.nextContactDate || ""}
            onChange={(v) => set("nextContactDate", v || null)}
            type="date"
          />
        </div>
      </div>

      {showSidebar && (
        <div className="w-56 flex-shrink-0 space-y-4">
          <SectionHeader label="AI Analysis" />
          <div>
            <label htmlFor="dealStage" className="block text-xs font-medium text-muted-foreground mb-1.5">
              Suggested Stage *
            </label>
            <select
              id="dealStage"
              value={data.dealStage}
              onChange={(e) => set("dealStage", e.target.value as DealStage)}
              className="w-full h-9 px-3 bg-card border border-border rounded-lg text-sm focus:outline-none focus:border-primary focus:shadow-input-focus transition-all"
            >
              {DEAL_STAGES.map((stage) => (
                <option key={stage} value={stage}>
                  {stageLabel(stage)}
                </option>
              ))}
            </select>
          </div>
          <SidebarField label="Confidence" value={data.confidenceLevel != null ? `${data.confidenceLevel}%` : "—"} />
          <SelectField
            id="urgency"
            label="Urgency"
            value={data.urgency || ""}
            onChange={(v) => set("urgency", (v || null) as ComplexityLevel | null)}
            options={[{ value: "Baixa", label: "Low" }, { value: "Média", label: "Medium" }, { value: "Alta", label: "High" }]}
          />
          <SelectField
            id="risk"
            label="Risk"
            value={data.risk || ""}
            onChange={(v) => set("risk", (v || null) as ComplexityLevel | null)}
            options={[{ value: "Baixa", label: "Low" }, { value: "Média", label: "Medium" }, { value: "Alta", label: "High" }]}
          />
          <SelectField
            id="expansionPotential"
            label="Expansion Potential"
            value={data.expansionPotential || ""}
            onChange={(v) => set("expansionPotential", (v || null) as PotentialLevel | null)}
            options={[{ value: "Baixo", label: "Low" }, { value: "Médio", label: "Medium" }, { value: "Alto", label: "High" }]}
          />
          <SelectField
            id="priceSensitivity"
            label="Price Sensitivity"
            value={data.priceSensitivity || ""}
            onChange={(v) => set("priceSensitivity", (v || null) as SensitivityLevel | null)}
            options={[{ value: "Baixa", label: "Low" }, { value: "Média", label: "Medium" }, { value: "Alta", label: "High" }]}
          />
        </div>
      )}
    </div>
  );
};

const SectionHeader = ({ label }: { label: string }) => (
  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border pb-2">
    {label}
  </h3>
);

const Field = ({
  id,
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  className,
  hasError = false,
}: {
  id?: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  className?: string;
  hasError?: boolean;
}) => (
  <div className={className}>
    <label htmlFor={id} className="block text-xs font-medium text-muted-foreground mb-1.5">
      {label}
    </label>
    <input
      id={id}
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full h-9 px-3 bg-card rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none transition-all ${
        hasError
          ? "border border-destructive focus:border-destructive"
          : "border border-border focus:border-primary focus:shadow-input-focus"
      }`}
    />
  </div>
);

const TextareaField = ({
  id,
  label,
  value,
  onChange,
  placeholder,
  rows = 4,
}: {
  id?: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) => (
  <div>
    <label htmlFor={id} className="block text-xs font-medium text-muted-foreground mb-1.5">
      {label}
    </label>
    <textarea
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full px-3 py-2 bg-card border border-border rounded-lg text-sm placeholder:text-muted-foreground resize-none focus:outline-none focus:border-primary focus:shadow-input-focus transition-all"
    />
  </div>
);

const SelectField = ({
  id,
  label,
  value,
  onChange,
  options,
}: {
  id?: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) => (
  <div>
    <label htmlFor={id} className="block text-xs font-medium text-muted-foreground mb-1.5">
      {label}
    </label>
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full h-9 px-3 bg-card border border-border rounded-lg text-sm focus:outline-none focus:border-primary focus:shadow-input-focus transition-all"
    >
      <option value="">—</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  </div>
);

const SidebarField = ({ label, value }: { label: string; value: string }) => (
  <div>
    <label className="block text-xs font-medium text-muted-foreground mb-1">{label}</label>
    <p className="text-sm font-medium text-foreground">{value}</p>
  </div>
);

export default ClientFormFields;
