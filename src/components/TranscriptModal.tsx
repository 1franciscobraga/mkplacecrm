import { useState } from "react";
import { X, Sparkles, Loader2 } from "lucide-react";
import { ExtractedData } from "@/types/crm";
import { supabase } from "@/integrations/supabase/client";
import { Client } from "@/types/crm";
import ManualClientModal from "./ManualClientModal";
import { normalizeExtractedData } from "@/lib/clientData";

interface TranscriptModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (client: Client) => void;
}

const TranscriptModal = ({ open, onClose, onSave }: TranscriptModalProps) => {
  const [transcript, setTranscript] = useState("");
  const [loading, setLoading] = useState(false);
  const [extracted, setExtracted] = useState<ExtractedData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleExtract = async () => {
    if (!transcript.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("extract-client", {
        body: { transcript },
      });
      if (fnError) throw fnError;
      setExtracted(normalizeExtractedData((data ?? {}) as Partial<ExtractedData>));
    } catch (e: any) {
      console.error("Extraction error:", e);
      setError(e?.message || "Erro ao extrair dados. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const resetAndClose = () => {
    setTranscript("");
    setExtracted(null);
    setError(null);
    setLoading(false);
    onClose();
  };

  if (!open) return null;

  if (extracted) {
    return (
      <ManualClientModal
        open={true}
        onClose={resetAndClose}
        onSave={(client) => {
          onSave(client);
          resetAndClose();
        }}
        prefilled={extracted}
        aiBanner
      />
    );
  }

  return (
    <>
      <div className="fixed inset-0 bg-foreground/20 backdrop-blur-[2px] z-50" onClick={resetAndClose} />
      <div className="fixed inset-4 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-xl bg-card rounded-xl shadow-modal z-50 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <h2 className="font-semibold text-base">Inserir Transcrição</h2>
          </div>
          <button onClick={resetAndClose} className="p-1.5 hover:bg-secondary rounded-lg transition-colors">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder="Cole sua transcrição de reunião aqui..."
            className="w-full h-48 bg-card border border-border rounded-lg p-4 text-sm placeholder:text-muted-foreground resize-none focus:outline-none focus:border-primary focus:shadow-input-focus transition-all"
            disabled={loading}
          />

          {error && <p className="text-sm text-destructive">{error}</p>}

          <button
            onClick={handleExtract}
            disabled={loading || !transcript.trim()}
            className="w-full h-10 bg-primary text-primary-foreground font-medium text-sm rounded-lg hover:opacity-90 disabled:opacity-40 transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Extraindo dados...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Extrair com IA
              </>
            )}
          </button>
        </div>
      </div>
    </>
  );
};

export default TranscriptModal;
