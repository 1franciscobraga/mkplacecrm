import {
  ComplexityLevel,
  DEAL_STAGES,
  DealStage,
  ExtractedData,
  PotentialLevel,
  SensitivityLevel,
} from "@/types/crm";

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
        <SectionHeader label="Identificação" />
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Field
              id="clientName"
              label="Nome do Cliente *"
              value={data.clientName}
              onChange={(v) => set("clientName", v)}
              hasError={!!clientNameError}
            />
            {clientNameError && <p className="text-xs text-destructive mt-1">{clientNameError}</p>}
          </div>
          <Field
            id="projectName"
            label="Projeto / Nome Interno"
            value={data.projectName || ""}
            onChange={(v) => set("projectName", v || null)}
          />
          <Field
            id="meetingDate"
            label="Data da Reunião"
            value={data.meetingDate || ""}
            onChange={(v) => set("meetingDate", v || null)}
            type="date"
          />
          <Field
            id="businessModel"
            label="Modelo de Negócio"
            value={data.businessModel || ""}
            onChange={(v) => set("businessModel", v || null)}
            placeholder="Ex: Marketplace White Label B2B"
          />
        </div>

        <SectionHeader label="Contato Principal" />
        <div className="grid grid-cols-2 gap-4">
          <Field
            id="contactName"
            label="Nome do Contato"
            value={data.contactName || ""}
            onChange={(v) => set("contactName", v || null)}
          />
          <Field
            id="contactRole"
            label="Cargo / Função"
            value={data.contactRole || ""}
            onChange={(v) => set("contactRole", v || null)}
            placeholder="Ex: CEO, CTO"
          />
          <Field
            id="contactEmail"
            label="Email"
            value={data.contactEmail || ""}
            onChange={(v) => set("contactEmail", v || null)}
            type="email"
            placeholder="Preencher manualmente"
          />
          <Field
            id="contactPhone"
            label="Telefone"
            value={data.contactPhone || ""}
            onChange={(v) => set("contactPhone", v || null)}
            type="tel"
            placeholder="Preencher manualmente"
          />
          <Field
            id="companyGroup"
            label="Empresa / Grupo Econômico"
            value={data.companyGroup || ""}
            onChange={(v) => set("companyGroup", v || null)}
            placeholder="Holding ou empresa-mãe"
          />
          <Field
            id="leadSource"
            label="Origem do Cliente"
            value={data.leadSource || ""}
            onChange={(v) => set("leadSource", v || null)}
            placeholder="Ex: indicação do João, inbound, evento"
          />
        </div>

        <SectionHeader label="Análise Comercial" />
        <TextareaField
          id="executiveSummary"
          label="Resumo Executivo"
          value={data.executiveSummary || ""}
          onChange={(v) => set("executiveSummary", v || null)}
          placeholder="Resumo geral da reunião"
          rows={3}
        />
        <TextareaField
          id="painPoints"
          label="Dores & Desafios"
          value={(data.painPointsAndChallenges || []).join("\n")}
          onChange={(v) => set("painPointsAndChallenges", parseLines(v))}
          placeholder="Um por linha"
        />
        <TextareaField
          id="goals"
          label="Objetivos & Expectativas"
          value={(data.goalsAndExpectations || []).join("\n")}
          onChange={(v) => set("goalsAndExpectations", parseLines(v))}
          placeholder="Um por linha"
        />
        <TextareaField
          id="differentials"
          label="Diferenciais do Cliente"
          value={(data.clientDifferentials || []).join("\n")}
          onChange={(v) => set("clientDifferentials", parseLines(v))}
          placeholder="Vantagens competitivas mencionadas, uma por linha"
        />

        <SectionHeader label="Financeiro & Negócio" />
        <div className="grid grid-cols-2 gap-4">
          <Field
            id="dealValue"
            label="Valor do Deal / Proposta"
            value={data.dealValue || ""}
            onChange={(v) => set("dealValue", v || null)}
            placeholder="Ex: R$ 75.000 + 2,5% GMV"
          />
          <Field
            id="revenueModel"
            label="Modelo de Receita"
            value={data.revenueModel || ""}
            onChange={(v) => set("revenueModel", v || null)}
            placeholder="Ex: Setup + variável"
          />
          <Field
            id="clientTimeline"
            label="Prazo / Urgência do Cliente"
            value={data.clientTimeline || ""}
            onChange={(v) => set("clientTimeline", v || null)}
            placeholder="Ex: MVP em 60 dias"
          />
          <Field
            id="budgetMentioned"
            label="Orçamento Mencionado"
            value={data.budgetMentioned || ""}
            onChange={(v) => set("budgetMentioned", v || null)}
            placeholder="Restrições ou aprovações"
          />
        </div>

        <SectionHeader label="Contexto Técnico" />
        <TextareaField
          id="techStack"
          label="Stack / Integrações Relevantes"
          value={data.techStack || ""}
          onChange={(v) => set("techStack", v || null)}
          placeholder="APIs, sistemas, plataformas mencionadas"
        />
        <div>
          <label htmlFor="implementationComplexity" className="block text-xs font-medium text-muted-foreground mb-1.5">
            Complexidade de Implementação
          </label>
          <select
            id="implementationComplexity"
            value={data.implementationComplexity || ""}
            onChange={(e) => set("implementationComplexity", (e.target.value || null) as ComplexityLevel | null)}
            className="w-full h-9 px-3 bg-card border border-border rounded-lg text-sm focus:outline-none focus:border-primary focus:shadow-input-focus transition-all"
          >
            <option value="">Não definida</option>
            <option value="Baixa">Baixa</option>
            <option value="Média">Média</option>
            <option value="Alta">Alta</option>
          </select>
        </div>

        <SectionHeader label="Plano de Ação" />
        <TextareaField
          id="nextSteps"
          label="Próximos Passos"
          value={(data.nextSteps || []).join("\n")}
          onChange={(v) => set("nextSteps", parseLines(v))}
          placeholder="Um por linha"
        />
        <TextareaField
          id="responsibleParties"
          label="Responsáveis"
          value={data.responsibleParties || ""}
          onChange={(v) => set("responsibleParties", v || null)}
          placeholder="Quem é responsável por cada ação"
          rows={2}
        />
        <div className="grid grid-cols-2 gap-4">
          <Field
            id="nextContactDate"
            label="Data do Próximo Contato"
            value={data.nextContactDate || ""}
            onChange={(v) => set("nextContactDate", v || null)}
            type="date"
          />
        </div>
      </div>

      {showSidebar && (
        <div className="w-56 flex-shrink-0 space-y-4">
          <SectionHeader label="Análise IA" />
          <div>
            <label htmlFor="dealStage" className="block text-xs font-medium text-muted-foreground mb-1.5">
              Etapa Sugerida *
            </label>
            <select
              id="dealStage"
              value={data.dealStage}
              onChange={(e) => set("dealStage", e.target.value as DealStage)}
              className="w-full h-9 px-3 bg-card border border-border rounded-lg text-sm focus:outline-none focus:border-primary focus:shadow-input-focus transition-all"
            >
              {DEAL_STAGES.map((stage) => (
                <option key={stage} value={stage}>
                  {stage}
                </option>
              ))}
            </select>
          </div>
          <SidebarField label="Confiança" value={data.confidenceLevel != null ? `${data.confidenceLevel}%` : "—"} />
          <SelectField
            id="urgency"
            label="Urgência"
            value={data.urgency || ""}
            onChange={(v) => set("urgency", (v || null) as ComplexityLevel | null)}
            options={["Baixa", "Média", "Alta"]}
          />
          <SelectField
            id="risk"
            label="Risco"
            value={data.risk || ""}
            onChange={(v) => set("risk", (v || null) as ComplexityLevel | null)}
            options={["Baixa", "Média", "Alta"]}
          />
          <SelectField
            id="expansionPotential"
            label="Potencial de Expansão"
            value={data.expansionPotential || ""}
            onChange={(v) => set("expansionPotential", (v || null) as PotentialLevel | null)}
            options={["Baixo", "Médio", "Alto"]}
          />
          <SelectField
            id="priceSensitivity"
            label="Sensibilidade a Preço"
            value={data.priceSensitivity || ""}
            onChange={(v) => set("priceSensitivity", (v || null) as SensitivityLevel | null)}
            options={["Baixa", "Média", "Alta"]}
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
  options: string[];
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
        <option key={option} value={option}>
          {option}
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
