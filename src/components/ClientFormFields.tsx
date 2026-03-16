import { ExtractedData, DealStage, DEAL_STAGES, ComplexityLevel, PotentialLevel, SensitivityLevel } from "@/types/crm";

interface ClientFormFieldsProps {
  data: ExtractedData;
  onChange: (data: ExtractedData) => void;
  showSidebar?: boolean;
}

const ClientFormFields = ({ data, onChange, showSidebar = false }: ClientFormFieldsProps) => {
  const set = (field: keyof ExtractedData, value: any) => onChange({ ...data, [field]: value });

  return (
    <div className="flex gap-6">
      <div className="flex-1 space-y-6">
        {/* Identificação */}
        <SectionHeader label="Identificação" />
        <div className="grid grid-cols-2 gap-4">
          <Field label="Nome do Cliente *" value={data.clientName} onChange={(v) => set("clientName", v)} />
          <Field label="Projeto / Nome Interno" value={data.projectName || ""} onChange={(v) => set("projectName", v || null)} />
          <Field label="Data da Reunião" value={data.meetingDate || ""} onChange={(v) => set("meetingDate", v || null)} type="date" />
          <Field label="Modelo de Negócio" value={data.businessModel || ""} onChange={(v) => set("businessModel", v || null)} placeholder="Ex: Marketplace White Label B2B" />
        </div>

        {/* Contato Principal */}
        <SectionHeader label="Contato Principal" />
        <div className="grid grid-cols-2 gap-4">
          <Field label="Nome do Contato" value={data.contactName || ""} onChange={(v) => set("contactName", v || null)} />
          <Field label="Cargo / Função" value={data.contactRole || ""} onChange={(v) => set("contactRole", v || null)} placeholder="Ex: CEO, CTO" />
          <Field label="Email" value={data.contactEmail || ""} onChange={(v) => set("contactEmail", v || null)} type="email" placeholder="Preencher manualmente" />
          <Field label="Telefone" value={data.contactPhone || ""} onChange={(v) => set("contactPhone", v || null)} type="tel" placeholder="Preencher manualmente" />
          <Field label="Empresa / Grupo Econômico" value={data.companyGroup || ""} onChange={(v) => set("companyGroup", v || null)} placeholder="Holding ou empresa-mãe" className="col-span-2" />
        </div>

        {/* Análise Comercial */}
        <SectionHeader label="Análise Comercial" />
        <TextareaField label="Resumo Executivo" value={data.executiveSummary || ""} onChange={(v) => set("executiveSummary", v || null)} placeholder="Resumo geral da reunião" rows={3} />
        <TextareaField label="Dores & Desafios" value={(data.painPointsAndChallenges || []).join("\n")} onChange={(v) => set("painPointsAndChallenges", v.split("\n").filter(Boolean))} placeholder="Um por linha" />
        <TextareaField label="Objetivos & Expectativas" value={(data.goalsAndExpectations || []).join("\n")} onChange={(v) => set("goalsAndExpectations", v.split("\n").filter(Boolean))} placeholder="Um por linha" />
        <TextareaField label="Diferenciais do Cliente" value={(data.clientDifferentials || []).join("\n")} onChange={(v) => set("clientDifferentials", v.split("\n").filter(Boolean))} placeholder="Vantagens competitivas mencionadas, um por linha" />

        {/* Financeiro & Negócio */}
        <SectionHeader label="Financeiro & Negócio" />
        <div className="grid grid-cols-2 gap-4">
          <Field label="Valor do Deal / Proposta" value={data.dealValue || ""} onChange={(v) => set("dealValue", v || null)} placeholder="Ex: R$ 75.000 + 2,5% GMV" />
          <Field label="Modelo de Receita" value={data.revenueModel || ""} onChange={(v) => set("revenueModel", v || null)} placeholder="Ex: Setup + variável" />
          <Field label="Prazo / Urgência do Cliente" value={data.clientTimeline || ""} onChange={(v) => set("clientTimeline", v || null)} placeholder="Ex: MVP em 60 dias" />
          <Field label="Orçamento Mencionado" value={data.budgetMentioned || ""} onChange={(v) => set("budgetMentioned", v || null)} placeholder="Restrições ou aprovações" />
        </div>

        {/* Contexto Técnico */}
        <SectionHeader label="Contexto Técnico" />
        <TextareaField label="Stack / Integrações Relevantes" value={data.techStack || ""} onChange={(v) => set("techStack", v || null)} placeholder="APIs, sistemas, plataformas mencionadas" />
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1.5">Complexidade de Implementação</label>
          <select
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

        {/* Plano de Ação */}
        <SectionHeader label="Plano de Ação" />
        <TextareaField label="Próximos Passos" value={(data.nextSteps || []).join("\n")} onChange={(v) => set("nextSteps", v.split("\n").filter(Boolean))} placeholder="Um por linha" />
        <TextareaField label="Responsáveis" value={data.responsibleParties || ""} onChange={(v) => set("responsibleParties", v || null)} placeholder="Quem é responsável por cada ação" rows={2} />
        <div className="grid grid-cols-2 gap-4">
          <Field label="Data do Próximo Contato" value={data.nextContactDate || ""} onChange={(v) => set("nextContactDate", v || null)} type="date" />
        </div>
      </div>

      {/* Sidebar */}
      {showSidebar && (
        <div className="w-56 flex-shrink-0 space-y-4">
          <SectionHeader label="Análise IA" />
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Etapa Sugerida *</label>
            <select
              value={data.dealStage}
              onChange={(e) => set("dealStage", e.target.value as DealStage)}
              className="w-full h-9 px-3 bg-card border border-border rounded-lg text-sm focus:outline-none focus:border-primary focus:shadow-input-focus transition-all"
            >
              {DEAL_STAGES.map((s) => (<option key={s} value={s}>{s}</option>))}
            </select>
          </div>
          <SidebarField label="Confiança" value={data.confidenceLevel != null ? `${data.confidenceLevel}%` : "—"} />
          <SelectField label="Urgência" value={data.urgency || ""} onChange={(v) => set("urgency", (v || null) as ComplexityLevel | null)} options={["Baixa", "Média", "Alta"]} />
          <SelectField label="Risco" value={data.risk || ""} onChange={(v) => set("risk", (v || null) as ComplexityLevel | null)} options={["Baixa", "Média", "Alta"]} />
          <SelectField label="Potencial de Expansão" value={data.expansionPotential || ""} onChange={(v) => set("expansionPotential", (v || null) as PotentialLevel | null)} options={["Baixo", "Médio", "Alto"]} />
          <SelectField label="Sensibilidade a Preço" value={data.priceSensitivity || ""} onChange={(v) => set("priceSensitivity", (v || null) as SensitivityLevel | null)} options={["Baixa", "Média", "Alta"]} />
        </div>
      )}
    </div>
  );
};

const SectionHeader = ({ label }: { label: string }) => (
  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border pb-2">{label}</h3>
);

const Field = ({ label, value, onChange, type = "text", placeholder, className }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string; className?: string;
}) => (
  <div className={className}>
    <label className="block text-xs font-medium text-muted-foreground mb-1.5">{label}</label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full h-9 px-3 bg-card border border-border rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:shadow-input-focus transition-all"
    />
  </div>
);

const TextareaField = ({ label, value, onChange, placeholder, rows = 4 }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; rows?: number;
}) => (
  <div>
    <label className="block text-xs font-medium text-muted-foreground mb-1.5">{label}</label>
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full px-3 py-2 bg-card border border-border rounded-lg text-sm placeholder:text-muted-foreground resize-none focus:outline-none focus:border-primary focus:shadow-input-focus transition-all"
    />
  </div>
);

const SelectField = ({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void; options: string[];
}) => (
  <div>
    <label className="block text-xs font-medium text-muted-foreground mb-1.5">{label}</label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full h-9 px-3 bg-card border border-border rounded-lg text-sm focus:outline-none focus:border-primary focus:shadow-input-focus transition-all"
    >
      <option value="">—</option>
      {options.map((o) => (<option key={o} value={o}>{o}</option>))}
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
