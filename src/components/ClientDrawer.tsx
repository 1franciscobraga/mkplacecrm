import { useState } from "react";
import { Client, STAGE_BADGE_STYLES, DEAL_STAGES, DealStage, ComplexityLevel, PotentialLevel, SensitivityLevel } from "@/types/crm";
import { X, Pencil, RotateCcw, AlertCircle, CheckCircle2, Clock, AlertTriangle, Sparkles, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ClientDrawerProps {
  client: Client | null;
  onClose: () => void;
  onUpdate: (client: Client) => void;
}

const ClientDrawer = ({ client, onClose, onUpdate }: ClientDrawerProps) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Client | null>(null);
  const [aiSuggestion, setAiSuggestion] = useState<{ nextStep: string; deadline: string } | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  if (!client) return null;

  const startEdit = () => {
    setDraft({ ...client, painPointsAndChallenges: [...(client.painPointsAndChallenges || [])], goalsAndExpectations: [...(client.goalsAndExpectations || [])], clientDifferentials: [...(client.clientDifferentials || [])], nextSteps: [...(client.nextSteps || [])] });
    setEditing(true);
  };

  const cancelEdit = () => {
    setDraft(null);
    setEditing(false);
  };

  const saveEdit = () => {
    if (draft) {
      onUpdate(draft);
      setEditing(false);
      setDraft(null);
    }
  };

  const d = editing && draft ? draft : client;
  const set = (field: keyof Client, value: any) => {
    if (draft) setDraft({ ...draft, [field]: value });
  };

  const getStepStatus = () => {
    if (!d.nextContactDate) return { status: "no_deadline" as const, label: "Sem prazo", color: "text-muted-foreground", bg: "bg-secondary", Icon: Clock };
    const due = new Date(d.nextContactDate);
    const diffDays = Math.ceil((due.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return { status: "overdue" as const, label: "Atrasado", color: "text-red-700", bg: "bg-red-50", Icon: AlertCircle };
    if (diffDays <= 3) return { status: "approaching" as const, label: "Próximo do vencimento", color: "text-amber-700", bg: "bg-amber-50", Icon: AlertTriangle };
    return { status: "on_track" as const, label: "Em dia", color: "text-emerald-700", bg: "bg-emerald-50", Icon: CheckCircle2 };
  };

  const stepStatus = getStepStatus();

  const handleAiSuggest = async () => {
    setAiLoading(true);
    try {
      const { data: result, error } = await supabase.functions.invoke("suggest-next-step", {
        body: {
          clientName: client.clientName,
          dealStage: client.dealStage,
          nextSteps: client.nextSteps,
          executiveSummary: client.executiveSummary,
          meetingDate: client.meetingDate,
          notes: client.notes,
        },
      });
      if (error) throw error;
      setAiSuggestion(result);
    } catch (e) {
      console.error("AI suggestion error:", e);
    } finally {
      setAiLoading(false);
    }
  };

  const applyAiSuggestion = () => {
    if (!aiSuggestion) return;
    const newSteps = [...(d.nextSteps || []), aiSuggestion.nextStep];
    if (editing && draft) {
      setDraft({ ...draft, nextSteps: newSteps, nextContactDate: aiSuggestion.deadline });
    } else {
      onUpdate({ ...client, nextSteps: newSteps, nextContactDate: aiSuggestion.deadline });
    }
    setAiSuggestion(null);
  };

  const badge = STAGE_BADGE_STYLES[d.dealStage];

  return (
    <>
      <div className="fixed inset-0 bg-foreground/20 backdrop-blur-[2px] z-40" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-[60%] min-w-[480px] max-w-[800px] bg-card border-l border-border z-50 overflow-y-auto shadow-modal animate-in slide-in-from-right duration-200">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="font-semibold text-lg text-foreground">{d.clientName}</h2>
              <p className="text-sm text-muted-foreground">{d.projectName || "—"}</p>
            </div>
            <div className="flex items-center gap-2">
              {editing ? (
                <>
                  <button onClick={cancelEdit} className="h-8 px-3 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">Cancelar</button>
                  <button onClick={saveEdit} className="h-8 px-4 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-all">Salvar Alterações</button>
                </>
              ) : (
                <button onClick={startEdit} className="h-8 px-3 border border-primary text-primary rounded-lg text-sm font-medium hover:bg-primary/5 transition-colors flex items-center gap-1.5">
                  <Pencil className="w-3.5 h-3.5" />
                  Editar
                </button>
              )}
              <button onClick={onClose} className="p-1.5 hover:bg-secondary rounded-lg transition-colors">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
          </div>

          <div className="flex gap-6">
            {/* Main content */}
            <div className="flex-1 space-y-6">
              {/* Identificação */}
              <SectionHeader label="Identificação" />
              <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                <ReadOrEdit editing={editing} label="Nome do Cliente" value={d.clientName} onChange={(v) => set("clientName", v)} />
                <ReadOrEdit editing={editing} label="Projeto / Nome Interno" value={d.projectName} onChange={(v) => set("projectName", v || null)} />
                <ReadOrEdit editing={editing} label="Data da Reunião" value={d.meetingDate} onChange={(v) => set("meetingDate", v || null)} type="date" />
                <ReadOrEdit editing={editing} label="Modelo de Negócio" value={d.businessModel} onChange={(v) => set("businessModel", v || null)} />
              </div>

              {/* Contato Principal */}
              <SectionHeader label="Contato Principal" />
              <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                <ReadOrEdit editing={editing} label="Nome do Contato" value={d.contactName} onChange={(v) => set("contactName", v || null)} />
                <ReadOrEdit editing={editing} label="Cargo / Função" value={d.contactRole} onChange={(v) => set("contactRole", v || null)} />
                <ReadOrEdit editing={editing} label="Email" value={d.contactEmail} onChange={(v) => set("contactEmail", v || null)} type="email" />
                <ReadOrEdit editing={editing} label="Telefone" value={d.contactPhone} onChange={(v) => set("contactPhone", v || null)} />
                <ReadOrEdit editing={editing} label="Empresa / Grupo Econômico" value={d.companyGroup} onChange={(v) => set("companyGroup", v || null)} />
                <ReadOrEdit editing={editing} label="Origem do Cliente" value={d.leadSource} onChange={(v) => set("leadSource", v || null)} />
              </div>

              {/* Análise Comercial */}
              <SectionHeader label="Análise Comercial" />
              <ReadOrEditTextarea editing={editing} label="Resumo Executivo" value={d.executiveSummary} onChange={(v) => set("executiveSummary", v || null)} />
              <ReadOrEditList editing={editing} label="Dores & Desafios" items={d.painPointsAndChallenges} onChange={(v) => set("painPointsAndChallenges", v)} />
              <ReadOrEditList editing={editing} label="Objetivos & Expectativas" items={d.goalsAndExpectations} onChange={(v) => set("goalsAndExpectations", v)} />
              <ReadOrEditList editing={editing} label="Diferenciais do Cliente" items={d.clientDifferentials} onChange={(v) => set("clientDifferentials", v)} />

              {/* Financeiro & Negócio */}
              <SectionHeader label="Financeiro & Negócio" />
              <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                <ReadOrEdit editing={editing} label="Valor do Deal / Proposta" value={d.dealValue} onChange={(v) => set("dealValue", v || null)} />
                <ReadOrEdit editing={editing} label="Modelo de Receita" value={d.revenueModel} onChange={(v) => set("revenueModel", v || null)} />
                <ReadOrEdit editing={editing} label="Prazo / Urgência do Cliente" value={d.clientTimeline} onChange={(v) => set("clientTimeline", v || null)} />
                <ReadOrEdit editing={editing} label="Orçamento Mencionado" value={d.budgetMentioned} onChange={(v) => set("budgetMentioned", v || null)} />
              </div>

              {/* Contexto Técnico */}
              <SectionHeader label="Contexto Técnico" />
              <ReadOrEditTextarea editing={editing} label="Stack / Integrações Relevantes" value={d.techStack} onChange={(v) => set("techStack", v || null)} />
              <ReadOrEditSelect editing={editing} label="Complexidade de Implementação" value={d.implementationComplexity} onChange={(v) => set("implementationComplexity", v || null)} options={["Baixa", "Média", "Alta"]} />

              {/* Plano de Ação — Status */}
              <SectionHeader label="Plano de Ação" />

              {/* Next step status card */}
              {(d.nextSteps?.length > 0 || d.nextContactDate) && (
                <div className={`rounded-lg p-3 border ${stepStatus.bg} border-border`}>
                  <div className="flex items-center gap-2 mb-2">
                    <stepStatus.Icon className={`w-4 h-4 ${stepStatus.color}`} />
                    <span className={`text-xs font-semibold ${stepStatus.color}`}>{stepStatus.label}</span>
                    {d.nextContactDate && (
                      <span className="text-xs text-muted-foreground ml-auto">
                        Prazo: {new Date(d.nextContactDate).toLocaleDateString("pt-BR")}
                      </span>
                    )}
                  </div>
                  {d.nextSteps?.filter(s => s.trim()).map((step, i) => (
                    <div key={i} className="flex items-start gap-2 ml-6">
                      <span className="w-1 h-1 rounded-full bg-foreground/40 mt-1.5 flex-shrink-0" />
                      <span className="text-sm text-foreground">{step}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* AI suggestion */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleAiSuggest}
                  disabled={aiLoading}
                  className="h-8 px-3 flex items-center gap-1.5 text-xs font-medium text-primary border border-primary/30 rounded-lg hover:bg-primary/5 transition-colors disabled:opacity-50"
                >
                  {aiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  Sugerir próximo passo com IA
                </button>
              </div>

              {aiSuggestion && (
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-2">
                  <p className="text-xs font-semibold text-primary flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3" />
                    Sugestão da IA
                  </p>
                  <p className="text-sm text-foreground">{aiSuggestion.nextStep}</p>
                  <p className="text-xs text-muted-foreground">Prazo sugerido: {new Date(aiSuggestion.deadline).toLocaleDateString("pt-BR")}</p>
                  <div className="flex gap-2 mt-2">
                    <button onClick={applyAiSuggestion} className="h-7 px-3 bg-primary text-primary-foreground rounded-md text-xs font-medium hover:opacity-90 transition-all">
                      Aplicar
                    </button>
                    <button onClick={() => setAiSuggestion(null)} className="h-7 px-3 text-xs text-muted-foreground hover:text-foreground transition-colors">
                      Descartar
                    </button>
                  </div>
                </div>
              )}

              <ReadOrEditList editing={editing} label="Próximos Passos" items={d.nextSteps} onChange={(v) => set("nextSteps", v)} />
              <ReadOrEditTextarea editing={editing} label="Responsáveis" value={d.responsibleParties} onChange={(v) => set("responsibleParties", v || null)} />
              <ReadOrEdit editing={editing} label="Data do Próximo Contato" value={d.nextContactDate} onChange={(v) => set("nextContactDate", v || null)} type="date" />

              {/* Timeline de Reuniões */}
              <SectionHeader label="Timeline de Reuniões" />
              {d.meetings.length > 0 ? (
                <div className="space-y-2">
                  {d.meetings.map((m) => (
                    <div key={m.id} className="bg-secondary rounded-lg p-3">
                      <p className="text-xs text-muted-foreground">{new Date(m.date).toLocaleDateString("pt-BR")}</p>
                      <p className="text-sm text-foreground mt-1">{m.summary}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">—</p>
              )}

              {/* Notas */}
              <SectionHeader label="Notas" />
              <textarea
                value={d.notes}
                onChange={(e) => editing ? set("notes", e.target.value) : onUpdate({ ...client, notes: e.target.value })}
                placeholder="Adicione suas notas aqui..."
                className="w-full h-24 bg-card border border-border rounded-lg p-3 text-sm placeholder:text-muted-foreground resize-none focus:outline-none focus:border-primary focus:shadow-input-focus transition-all"
              />

              <button className="w-full h-9 flex items-center justify-center gap-2 bg-secondary rounded-lg text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
                <RotateCcw className="w-3.5 h-3.5" />
                Re-analisar transcrição
              </button>
            </div>

            {/* Sidebar - Inteligência Comercial */}
            <div className="w-52 flex-shrink-0 space-y-4">
              <SectionHeader label="Inteligência Comercial" />
              {editing ? (
                <>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">Estágio Atual</label>
                    <select value={d.dealStage} onChange={(e) => set("dealStage", e.target.value as DealStage)} className="w-full h-9 px-3 bg-card border border-border rounded-lg text-sm focus:outline-none focus:border-primary transition-all">
                      {DEAL_STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">Nível de Confiança (%)</label>
                    <input type="number" min={0} max={100} value={d.confidenceLevel ?? ""} onChange={(e) => set("confidenceLevel", e.target.value ? Number(e.target.value) : null)} className="w-full h-9 px-3 bg-card border border-border rounded-lg text-sm focus:outline-none focus:border-primary transition-all" />
                  </div>
                  <ReadOrEditSelect editing label="Urgência" value={d.urgency} onChange={(v) => set("urgency", v || null)} options={["Baixa", "Média", "Alta"]} />
                  <ReadOrEditSelect editing label="Risco" value={d.risk} onChange={(v) => set("risk", v || null)} options={["Baixa", "Média", "Alta"]} />
                  <ReadOrEditSelect editing label="Potencial de Expansão" value={d.expansionPotential} onChange={(v) => set("expansionPotential", v || null)} options={["Baixo", "Médio", "Alto"]} />
                  <ReadOrEditSelect editing label="Sensibilidade a Preço" value={d.priceSensitivity} onChange={(v) => set("priceSensitivity", v || null)} options={["Baixa", "Média", "Alta"]} />
                </>
              ) : (
                <>
                  <SidebarItem label="Estágio Atual">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium ${badge.bg} ${badge.text}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                      {d.dealStage}
                    </span>
                  </SidebarItem>
                  <SidebarItem label="Nível de Confiança"><span className="text-sm font-semibold text-foreground">{d.confidenceLevel != null ? `${d.confidenceLevel}%` : "—"}</span></SidebarItem>
                  <SidebarItem label="Urgência"><span className="text-sm text-foreground">{d.urgency || "—"}</span></SidebarItem>
                  <SidebarItem label="Risco"><span className="text-sm text-foreground">{d.risk || "—"}</span></SidebarItem>
                  <SidebarItem label="Potencial de Expansão"><span className="text-sm text-foreground">{d.expansionPotential || "—"}</span></SidebarItem>
                  <SidebarItem label="Sensibilidade a Preço"><span className="text-sm text-foreground">{d.priceSensitivity || "—"}</span></SidebarItem>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

/* --- Sub-components --- */

const SectionHeader = ({ label }: { label: string }) => (
  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border pb-2">{label}</h3>
);

const SidebarItem = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="bg-secondary rounded-lg p-3">
    <p className="text-[10px] font-medium text-muted-foreground mb-1">{label}</p>
    {children}
  </div>
);

const ReadOrEdit = ({ editing, label, value, onChange, type = "text", className }: {
  editing: boolean; label: string; value: string | null | undefined; onChange: (v: string) => void; type?: string; className?: string;
}) => (
  <div className={className}>
    <p className="text-xs font-medium text-muted-foreground mb-1">{label}</p>
    {editing ? (
      <input type={type} value={value || ""} onChange={(e) => onChange(e.target.value)} className="w-full h-9 px-3 bg-card border border-border rounded-lg text-sm focus:outline-none focus:border-primary focus:shadow-input-focus transition-all" />
    ) : (
      <p className="text-sm text-foreground">{type === "date" && value ? new Date(value).toLocaleDateString("pt-BR") : (value || "—")}</p>
    )}
  </div>
);

const ReadOrEditTextarea = ({ editing, label, value, onChange }: {
  editing: boolean; label: string; value: string | null | undefined; onChange: (v: string) => void;
}) => (
  <div>
    <p className="text-xs font-medium text-muted-foreground mb-1">{label}</p>
    {editing ? (
      <textarea value={value || ""} onChange={(e) => onChange(e.target.value)} rows={3} className="w-full px-3 py-2 bg-card border border-border rounded-lg text-sm resize-none focus:outline-none focus:border-primary focus:shadow-input-focus transition-all" />
    ) : (
      <p className="text-sm text-foreground whitespace-pre-wrap">{value || "—"}</p>
    )}
  </div>
);

const ReadOrEditList = ({ editing, label, items, onChange }: {
  editing: boolean; label: string; items: string[] | undefined; onChange: (v: string[]) => void;
}) => (
  <div>
    <p className="text-xs font-medium text-muted-foreground mb-1">{label}</p>
    {editing ? (
      <textarea value={(items || []).join("\n")} onChange={(e) => onChange(e.target.value.split("\n").filter(Boolean))} rows={4} placeholder="Um por linha" className="w-full px-3 py-2 bg-card border border-border rounded-lg text-sm resize-none focus:outline-none focus:border-primary focus:shadow-input-focus transition-all" />
    ) : (items && items.length > 0) ? (
      <ul className="space-y-1">
        {items.map((item, i) => (
          <li key={i} className="text-sm text-foreground flex gap-2">
            <span className="text-primary mt-1.5 text-[6px]">●</span>
            {item}
          </li>
        ))}
      </ul>
    ) : (
      <p className="text-sm text-foreground">—</p>
    )}
  </div>
);

const ReadOrEditSelect = ({ editing, label, value, onChange, options }: {
  editing: boolean; label: string; value: string | null | undefined; onChange: (v: string) => void; options: string[];
}) => (
  <div>
    <p className="text-xs font-medium text-muted-foreground mb-1">{label}</p>
    {editing ? (
      <select value={value || ""} onChange={(e) => onChange(e.target.value)} className="w-full h-9 px-3 bg-card border border-border rounded-lg text-sm focus:outline-none focus:border-primary transition-all">
        <option value="">—</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    ) : (
      <p className="text-sm text-foreground">{value || "—"}</p>
    )}
  </div>
);

export default ClientDrawer;
