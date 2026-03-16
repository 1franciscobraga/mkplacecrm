import { ExtractedData, DealStage, DEAL_STAGES } from "@/types/crm";

interface ClientFormFieldsProps {
  data: ExtractedData;
  onChange: (data: ExtractedData) => void;
}

const ClientFormFields = ({ data, onChange }: ClientFormFieldsProps) => {
  const set = (field: keyof ExtractedData, value: any) => onChange({ ...data, [field]: value });

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Nome do Cliente *" value={data.clientName} onChange={(v) => set("clientName", v)} />
        <Field label="Projeto / Nome Interno" value={data.projectName || ""} onChange={(v) => set("projectName", v || null)} />
        <Field label="Pessoa de Contato" value={data.contactPerson || ""} onChange={(v) => set("contactPerson", v || null)} />
        <Field label="Data da Reunião" value={data.meetingDate || ""} onChange={(v) => set("meetingDate", v || null)} type="date" />
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1.5">Etapa do Deal *</label>
          <select
            value={data.dealStage}
            onChange={(e) => set("dealStage", e.target.value as DealStage)}
            className="w-full h-9 px-3 bg-card border border-border rounded-lg text-sm focus:outline-none focus:border-primary focus:shadow-input-focus transition-all"
          >
            {DEAL_STAGES.map((s) => (<option key={s} value={s}>{s}</option>))}
          </select>
        </div>
        <Field label="Valor do Deal" value={data.dealValue || ""} onChange={(v) => set("dealValue", v || null)} placeholder="Ex: R$ 75.000 + 2,5% GMV" />
      </div>

      <TextareaField label="Dores" value={(data.painPoints || []).join("\n")} onChange={(v) => set("painPoints", v.split("\n").filter(Boolean))} placeholder="Uma por linha" />
      <TextareaField label="Objetivos" value={(data.goals || []).join("\n")} onChange={(v) => set("goals", v.split("\n").filter(Boolean))} placeholder="Um por linha" />
      <TextareaField label="Expectativas" value={(data.expectations || []).join("\n")} onChange={(v) => set("expectations", v.split("\n").filter(Boolean))} placeholder="Uma por linha" />
      <TextareaField label="Próximas Ações" value={(data.nextActions || []).join("\n")} onChange={(v) => set("nextActions", v.split("\n").filter(Boolean))} placeholder="Uma por linha" />
      <TextareaField label="Notas Técnicas" value={data.technicalNotes || ""} onChange={(v) => set("technicalNotes", v || null)} />
      <TextareaField label="Outras Informações" value={data.otherRelevantInfo || ""} onChange={(v) => set("otherRelevantInfo", v || null)} />
    </div>
  );
};

const Field = ({ label, value, onChange, type = "text", placeholder }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string;
}) => (
  <div>
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

const TextareaField = ({ label, value, onChange, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string;
}) => (
  <div>
    <label className="block text-xs font-medium text-muted-foreground mb-1.5">{label}</label>
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full h-20 px-3 py-2 bg-card border border-border rounded-lg text-sm placeholder:text-muted-foreground resize-none focus:outline-none focus:border-primary focus:shadow-input-focus transition-all"
    />
  </div>
);

export default ClientFormFields;
