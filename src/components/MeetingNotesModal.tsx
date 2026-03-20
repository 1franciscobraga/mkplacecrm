import { useState } from "react";
import { X, Sparkles, Loader2, CheckCircle2, Plus, Building2, ArrowRight, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Client, DealStage } from "@/types/crm";
import { normalizeClient } from "@/lib/clientData";

interface MeetingInsight {
  companyName: string;
  matchedName: string | null;
  isExisting: boolean;
  nextSteps: string[];
  deadline: string | null;
  suggestedStage: string | null;
  urgency: string | null;
  responsible: string | null;
  context: string;
}

interface ProcessedResult {
  insights: MeetingInsight[];
  generalNotes: string | null;
}

interface MeetingNotesModalProps {
  open: boolean;
  onClose: () => void;
  clients: Client[];
  onUpdateClient: (client: Client) => void;
  onAddClient: (client: Client) => void;
}

const MeetingNotesModal = ({ open, onClose, clients, onUpdateClient, onAddClient }: MeetingNotesModalProps) => {
  const [transcript, setTranscript] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ProcessedResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [applied, setApplied] = useState<Set<number>>(new Set());

  const handleProcess = async () => {
    if (!transcript.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setApplied(new Set());

    try {
      const { data, error: fnError } = await supabase.functions.invoke("process-meeting", {
        body: {
          transcript,
          existingClients: clients.map((c) => ({ clientName: c.clientName, id: c.id })),
        },
      });
      if (fnError) throw fnError;
      setResult(data as ProcessedResult);
    } catch (e: any) {
      console.error("Process meeting error:", e);
      setError(e?.message || "Erro ao processar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const applyInsight = (insight: MeetingInsight, index: number) => {
    if (insight.isExisting && insight.matchedName) {
      const existing = clients.find(
        (c) => c.clientName.toLowerCase() === insight.matchedName!.toLowerCase()
      );
      if (existing) {
        const updatedSteps = [
          ...(existing.nextSteps || []),
          ...insight.nextSteps.filter((s) => !existing.nextSteps.includes(s)),
        ];
        const updates: Partial<Client> = {
          ...existing,
          nextSteps: updatedSteps,
          nextContactDate: insight.deadline || existing.nextContactDate,
          responsibleParties: insight.responsible || existing.responsibleParties,
          updatedAt: new Date().toISOString(),
        };
        if (insight.suggestedStage) {
          updates.dealStage = insight.suggestedStage as DealStage;
        }
        onUpdateClient(updates as Client);
      }
    } else {
      const newClient = normalizeClient({
        clientName: insight.companyName,
        dealStage: (insight.suggestedStage as DealStage) || "Lead demonstrou interesse",
        nextSteps: insight.nextSteps,
        nextContactDate: insight.deadline,
        responsibleParties: insight.responsible,
        executiveSummary: insight.context,
        urgency: insight.urgency as any,
      });
      onAddClient(newClient);
    }
    setApplied((prev) => new Set(prev).add(index));
  };

  const applyAll = () => {
    if (!result) return;
    result.insights.forEach((insight, i) => {
      if (!applied.has(i)) applyInsight(insight, i);
    });
  };

  const resetAndClose = () => {
    setTranscript("");
    setResult(null);
    setError(null);
    setApplied(new Set());
    onClose();
  };

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 bg-foreground/20 backdrop-blur-[2px] z-50" onClick={resetAndClose} />
      <div className="fixed inset-4 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-3xl md:max-h-[85vh] bg-card rounded-xl shadow-modal z-50 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <h2 className="font-semibold text-base">Processar Reunião Interna</h2>
          </div>
          <button onClick={resetAndClose} className="p-1.5 hover:bg-secondary rounded-lg transition-colors">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {!result ? (
            <>
              <p className="text-sm text-muted-foreground">
                Cole a transcrição ou resumo de uma reunião interna. A IA vai identificar empresas mencionadas,
                próximos passos e atualizações relevantes.
              </p>
              <textarea
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder="Cole sua transcrição ou resumo de reunião interna aqui..."
                className="w-full h-48 bg-card border border-border rounded-lg p-4 text-sm placeholder:text-muted-foreground resize-none focus:outline-none focus:border-primary focus:shadow-input-focus transition-all"
                disabled={loading}
              />
              {error && <p className="text-sm text-destructive">{error}</p>}
              <button
                onClick={handleProcess}
                disabled={loading || !transcript.trim()}
                className="w-full h-10 bg-primary text-primary-foreground font-medium text-sm rounded-lg hover:opacity-90 disabled:opacity-40 transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processando reunião...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Processar com IA
                  </>
                )}
              </button>
            </>
          ) : (
            <>
              {/* Results header */}
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-foreground">
                  {result.insights.length} empresa{result.insights.length !== 1 ? "s" : ""} identificada{result.insights.length !== 1 ? "s" : ""}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={applyAll}
                    disabled={applied.size === result.insights.length}
                    className="h-8 px-3 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:opacity-90 disabled:opacity-40 transition-all flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Aplicar todos
                  </button>
                  <button
                    onClick={() => { setResult(null); setApplied(new Set()); }}
                    className="h-8 px-3 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors"
                  >
                    Voltar
                  </button>
                </div>
              </div>

              {/* Insights list */}
              <div className="space-y-3">
                {result.insights.map((insight, i) => {
                  const isApplied = applied.has(i);
                  return (
                    <div
                      key={i}
                      className={`rounded-lg border p-4 transition-all ${
                        isApplied
                          ? "border-emerald-200 bg-emerald-50/50"
                          : "border-border bg-card"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5">
                            <Building2 className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                            <span className="font-semibold text-sm text-foreground">{insight.companyName}</span>
                            {insight.isExisting ? (
                              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-700">
                                Existente
                              </span>
                            ) : (
                              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700 flex items-center gap-0.5">
                                <Plus className="w-2.5 h-2.5" />
                                Nova
                              </span>
                            )}
                            {insight.urgency && (
                              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                                insight.urgency === "Alta" ? "bg-red-50 text-red-700" :
                                insight.urgency === "Média" ? "bg-amber-50 text-amber-700" :
                                "bg-gray-100 text-gray-600"
                              }`}>
                                {insight.urgency}
                              </span>
                            )}
                          </div>

                          <p className="text-xs text-muted-foreground mb-2">{insight.context}</p>

                          {insight.nextSteps.length > 0 && (
                            <div className="space-y-1 mb-2">
                              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Próximos passos:</p>
                              {insight.nextSteps.map((step, j) => (
                                <div key={j} className="flex items-start gap-1.5">
                                  <ArrowRight className="w-3 h-3 text-primary mt-0.5 flex-shrink-0" />
                                  <span className="text-xs text-foreground">{step}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                            {insight.deadline && (
                              <span>Prazo: {new Date(insight.deadline).toLocaleDateString("pt-BR")}</span>
                            )}
                            {insight.suggestedStage && (
                              <span className="flex items-center gap-1">
                                Etapa: <strong className="text-foreground">{insight.suggestedStage}</strong>
                              </span>
                            )}
                            {insight.responsible && (
                              <span>Resp: {insight.responsible}</span>
                            )}
                          </div>
                        </div>

                        <button
                          onClick={() => applyInsight(insight, i)}
                          disabled={isApplied}
                          className={`h-8 px-3 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 flex-shrink-0 ${
                            isApplied
                              ? "bg-emerald-100 text-emerald-700 cursor-default"
                              : "bg-primary text-primary-foreground hover:opacity-90"
                          }`}
                        >
                          {isApplied ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Aplicado
                            </>
                          ) : (
                            "Aplicar"
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {result.generalNotes && (
                <div className="rounded-lg border border-border bg-secondary/50 p-3">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-1">Notas gerais</p>
                  <p className="text-sm text-foreground">{result.generalNotes}</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default MeetingNotesModal;
