import { useState } from "react";
import { Client, STAGE_BADGE_STYLES, DEAL_STAGES, DealStage, ComplexityLevel, PotentialLevel, SensitivityLevel } from "@/types/crm";
import { X, Pencil, RotateCcw, AlertCircle, CheckCircle2, Clock, AlertTriangle, Sparkles, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { stageLabel, complexityLabel, potentialLabel, sensitivityLabel } from "@/lib/i18n";
import CompanyLogo from "@/components/CompanyLogo";

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
    if (!d.nextContactDate) return { status: "no_deadline" as const, label: "No Deadline", color: "text-muted-foreground", bg: "bg-secondary", Icon: Clock };
    const due = new Date(d.nextContactDate);
    const diffDays = Math.ceil((due.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return { status: "overdue" as const, label: "Overdue", color: "text-red-700", bg: "bg-red-50", Icon: AlertCircle };
    if (diffDays <= 3) return { status: "approaching" as const, label: "Due Soon", color: "text-amber-700", bg: "bg-amber-50", Icon: AlertTriangle };
    return { status: "on_track" as const, label: "On Track", color: "text-emerald-700", bg: "bg-emerald-50", Icon: CheckCircle2 };
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
            <div className="flex items-center gap-3">
              <CompanyLogo logoUrl={d.logoUrl} companyName={d.clientName} size={48} />
              <div>
                <h2 className="font-semibold text-lg text-foreground">{d.clientName}</h2>
                <p className="text-sm text-muted-foreground">{d.projectName || "—"}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {editing ? (
                <>
                  <button onClick={cancelEdit} className="h-8 px-3 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">Cancel</button>
                  <button onClick={saveEdit} className="h-8 px-4 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-all">Save Changes</button>
                </>
              ) : (
                <button onClick={startEdit} className="h-8 px-3 border border-primary text-primary rounded-lg text-sm font-medium hover:bg-primary/5 transition-colors flex items-center gap-1.5">
                  <Pencil className="w-3.5 h-3.5" />
                  Edit
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
              <SectionHeader label="Identification" />
              <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                <ReadOrEdit editing={editing} label="Client Name" value={d.clientName} onChange={(v) => set("clientName", v)} />
                <ReadOrEdit editing={editing} label="Project / Internal Name" value={d.projectName} onChange={(v) => set("projectName", v || null)} />
                <ReadOrEdit editing={editing} label="Meeting Date" value={d.meetingDate} onChange={(v) => set("meetingDate", v || null)} type="date" />
                <ReadOrEdit editing={editing} label="Business Model" value={d.businessModel} onChange={(v) => set("businessModel", v || null)} />
                <ReadOrEdit editing={editing} label="Logo URL" value={d.logoUrl} onChange={(v) => set("logoUrl", v || null)} placeholder="https://example.com/logo.png" />
              </div>

              <SectionHeader label="Primary Contact" />
              <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                <ReadOrEdit editing={editing} label="Contact Name" value={d.contactName} onChange={(v) => set("contactName", v || null)} />
                <ReadOrEdit editing={editing} label="Role / Position" value={d.contactRole} onChange={(v) => set("contactRole", v || null)} />
                <ReadOrEdit editing={editing} label="Email" value={d.contactEmail} onChange={(v) => set("contactEmail", v || null)} type="email" />
                <ReadOrEdit editing={editing} label="Phone" value={d.contactPhone} onChange={(v) => set("contactPhone", v || null)} />
                <ReadOrEdit editing={editing} label="Company / Economic Group" value={d.companyGroup} onChange={(v) => set("companyGroup", v || null)} />
                <ReadOrEdit editing={editing} label="Lead Source" value={d.leadSource} onChange={(v) => set("leadSource", v || null)} />
              </div>

              <SectionHeader label="Commercial Analysis" />
              <ReadOrEditTextarea editing={editing} label="Executive Summary" value={d.executiveSummary} onChange={(v) => set("executiveSummary", v || null)} />
              <ReadOrEditList editing={editing} label="Pain Points & Challenges" items={d.painPointsAndChallenges} onChange={(v) => set("painPointsAndChallenges", v)} />
              <ReadOrEditList editing={editing} label="Goals & Expectations" items={d.goalsAndExpectations} onChange={(v) => set("goalsAndExpectations", v)} />
              <ReadOrEditList editing={editing} label="Client Differentials" items={d.clientDifferentials} onChange={(v) => set("clientDifferentials", v)} />

              <SectionHeader label="Financial & Business" />
              <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                <ReadOrEdit editing={editing} label="Deal / Proposal Value" value={d.dealValue} onChange={(v) => set("dealValue", v || null)} />
                <ReadOrEdit editing={editing} label="Revenue Model" value={d.revenueModel} onChange={(v) => set("revenueModel", v || null)} />
                <ReadOrEdit editing={editing} label="Client Timeline / Urgency" value={d.clientTimeline} onChange={(v) => set("clientTimeline", v || null)} />
                <ReadOrEdit editing={editing} label="Budget Mentioned" value={d.budgetMentioned} onChange={(v) => set("budgetMentioned", v || null)} />
              </div>

              <SectionHeader label="Technical Context" />
              <ReadOrEditTextarea editing={editing} label="Tech Stack / Integrations" value={d.techStack} onChange={(v) => set("techStack", v || null)} />
              <ReadOrEditSelect editing={editing} label="Implementation Complexity" value={d.implementationComplexity} onChange={(v) => set("implementationComplexity", v || null)} options={[{ value: "Baixa", label: "Low" }, { value: "Média", label: "Medium" }, { value: "Alta", label: "High" }]} />

              <SectionHeader label="Action Plan" />

              {(d.nextSteps?.length > 0 || d.nextContactDate) && (
                <div className={`rounded-lg p-3 border ${stepStatus.bg} border-border`}>
                  <div className="flex items-center gap-2 mb-2">
                    <stepStatus.Icon className={`w-4 h-4 ${stepStatus.color}`} />
                    <span className={`text-xs font-semibold ${stepStatus.color}`}>{stepStatus.label}</span>
                    {d.nextContactDate && (
                      <span className="text-xs text-muted-foreground ml-auto">
                        Deadline: {new Date(d.nextContactDate).toLocaleDateString("en-US")}
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

              <div className="flex items-center gap-2">
                <button
                  onClick={handleAiSuggest}
                  disabled={aiLoading}
                  className="h-8 px-3 flex items-center gap-1.5 text-xs font-medium text-primary border border-primary/30 rounded-lg hover:bg-primary/5 transition-colors disabled:opacity-50"
                >
                  {aiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  Suggest next step with AI
                </button>
              </div>

              {aiSuggestion && (
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-2">
                  <p className="text-xs font-semibold text-primary flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3" />
                    AI Suggestion
                  </p>
                  <p className="text-sm text-foreground">{aiSuggestion.nextStep}</p>
                  <p className="text-xs text-muted-foreground">Suggested deadline: {new Date(aiSuggestion.deadline).toLocaleDateString("en-US")}</p>
                  <div className="flex gap-2 mt-2">
                    <button onClick={applyAiSuggestion} className="h-7 px-3 bg-primary text-primary-foreground rounded-md text-xs font-medium hover:opacity-90 transition-all">
                      Apply
                    </button>
                    <button onClick={() => setAiSuggestion(null)} className="h-7 px-3 text-xs text-muted-foreground hover:text-foreground transition-colors">
                      Discard
                    </button>
                  </div>
                </div>
              )}

              <ReadOrEditList editing={editing} label="Next Steps" items={d.nextSteps} onChange={(v) => set("nextSteps", v)} />
              <ReadOrEditTextarea editing={editing} label="Responsible Parties" value={d.responsibleParties} onChange={(v) => set("responsibleParties", v || null)} />
              <ReadOrEdit editing={editing} label="Next Contact Date" value={d.nextContactDate} onChange={(v) => set("nextContactDate", v || null)} type="date" />

              <SectionHeader label="Meeting Timeline" />
              {d.meetings.length > 0 ? (
                <div className="space-y-2">
                  {d.meetings.map((m) => (
                    <div key={m.id} className="bg-secondary rounded-lg p-3">
                      <p className="text-xs text-muted-foreground">{new Date(m.date).toLocaleDateString("en-US")}</p>
                      <p className="text-sm text-foreground mt-1">{m.summary}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">—</p>
              )}

              <SectionHeader label="Notes" />
              <textarea
                value={d.notes}
                onChange={(e) => editing ? set("notes", e.target.value) : onUpdate({ ...client, notes: e.target.value })}
                placeholder="Add your notes here..."
                className="w-full h-24 bg-card border border-border rounded-lg p-3 text-sm placeholder:text-muted-foreground resize-none focus:outline-none focus:border-primary focus:shadow-input-focus transition-all"
              />

              <button className="w-full h-9 flex items-center justify-center gap-2 bg-secondary rounded-lg text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
                <RotateCcw className="w-3.5 h-3.5" />
                Re-analyze transcript
              </button>
            </div>

            {/* Sidebar - Commercial Intelligence */}
            <div className="w-52 flex-shrink-0 space-y-4">
              <SectionHeader label="Commercial Intelligence" />
              {editing ? (
                <>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">Current Stage</label>
                    <select value={d.dealStage} onChange={(e) => set("dealStage", e.target.value as DealStage)} className="w-full h-9 px-3 bg-card border border-border rounded-lg text-sm focus:outline-none focus:border-primary transition-all">
                      {DEAL_STAGES.map((s) => <option key={s} value={s}>{stageLabel(s)}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">Confidence Level (%)</label>
                    <input type="number" min={0} max={100} value={d.confidenceLevel ?? ""} onChange={(e) => set("confidenceLevel", e.target.value ? Number(e.target.value) : null)} className="w-full h-9 px-3 bg-card border border-border rounded-lg text-sm focus:outline-none focus:border-primary transition-all" />
                  </div>
                  <ReadOrEditSelect editing label="Urgency" value={d.urgency} onChange={(v) => set("urgency", v || null)} options={[{ value: "Baixa", label: "Low" }, { value: "Média", label: "Medium" }, { value: "Alta", label: "High" }]} />
                  <ReadOrEditSelect editing label="Risk" value={d.risk} onChange={(v) => set("risk", v || null)} options={[{ value: "Baixa", label: "Low" }, { value: "Média", label: "Medium" }, { value: "Alta", label: "High" }]} />
                  <ReadOrEditSelect editing label="Expansion Potential" value={d.expansionPotential} onChange={(v) => set("expansionPotential", v || null)} options={[{ value: "Baixo", label: "Low" }, { value: "Médio", label: "Medium" }, { value: "Alto", label: "High" }]} />
                  <ReadOrEditSelect editing label="Price Sensitivity" value={d.priceSensitivity} onChange={(v) => set("priceSensitivity", v || null)} options={[{ value: "Baixa", label: "Low" }, { value: "Média", label: "Medium" }, { value: "Alta", label: "High" }]} />
                </>
              ) : (
                <>
                  <SidebarItem label="Current Stage">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium ${badge.bg} ${badge.text}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                      {stageLabel(d.dealStage)}
                    </span>
                  </SidebarItem>
                  <SidebarItem label="Confidence Level"><span className="text-sm font-semibold text-foreground">{d.confidenceLevel != null ? `${d.confidenceLevel}%` : "—"}</span></SidebarItem>
                  <SidebarItem label="Urgency"><span className="text-sm text-foreground">{complexityLabel(d.urgency)}</span></SidebarItem>
                  <SidebarItem label="Risk"><span className="text-sm text-foreground">{complexityLabel(d.risk)}</span></SidebarItem>
                  <SidebarItem label="Expansion Potential"><span className="text-sm text-foreground">{potentialLabel(d.expansionPotential)}</span></SidebarItem>
                  <SidebarItem label="Price Sensitivity"><span className="text-sm text-foreground">{sensitivityLabel(d.priceSensitivity)}</span></SidebarItem>
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
      <p className="text-sm text-foreground">{type === "date" && value ? new Date(value).toLocaleDateString("en-US") : (value || "—")}</p>
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
      <textarea value={(items || []).join("\n")} onChange={(e) => onChange(e.target.value.split("\n").filter(Boolean))} rows={4} placeholder="One per line" className="w-full px-3 py-2 bg-card border border-border rounded-lg text-sm resize-none focus:outline-none focus:border-primary focus:shadow-input-focus transition-all" />
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
  editing: boolean; label: string; value: string | null | undefined; onChange: (v: string) => void; options: { value: string; label: string }[];
}) => (
  <div>
    <p className="text-xs font-medium text-muted-foreground mb-1">{label}</p>
    {editing ? (
      <select value={value || ""} onChange={(e) => onChange(e.target.value)} className="w-full h-9 px-3 bg-card border border-border rounded-lg text-sm focus:outline-none focus:border-primary transition-all">
        <option value="">—</option>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    ) : (
      <p className="text-sm text-foreground">{value ? options.find(o => o.value === value)?.label || value : "—"}</p>
    )}
  </div>
);

export default ClientDrawer;
