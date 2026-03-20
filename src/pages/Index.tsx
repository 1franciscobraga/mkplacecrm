import { useState, useEffect, useRef } from "react";
import { Client, DealStage } from "@/types/crm";
import { addClient, updateClient, updateClientStage, deleteClient, subscribeToClients } from "@/store/clientStore";
import Navbar from "@/components/Navbar";
import StatsBar from "@/components/StatsBar";
import PipelineBoard from "@/components/PipelineBoard";
import ClientsTable from "@/components/ClientsTable";
import FunnelView from "@/components/FunnelView";
import NextStepsView from "@/components/NextStepsView";
import ClientDrawer from "@/components/ClientDrawer";
import TranscriptModal from "@/components/TranscriptModal";
import ManualClientModal from "@/components/ManualClientModal";
import MeetingNotesModal from "@/components/MeetingNotesModal";
import { Plus, LayoutGrid, Table, FileText, PenLine, ChevronDown, TrendingDown, ListChecks, ClipboardList } from "lucide-react";

const Index = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [activeTab, setActiveTab] = useState<"pipeline" | "clients" | "funnel" | "nextsteps">("pipeline");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [transcriptOpen, setTranscriptOpen] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Client | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = subscribeToClients((updated) => {
      setClients(updated);
      // Refresh selected client if it's open
      setSelectedClient((prev) =>
        prev ? updated.find((c) => c.id === prev.id) ?? null : null
      );
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleStageChange = async (clientId: string, newStage: DealStage) => {
    await updateClientStage(clientId, newStage);
  };

  const handleNewClient = async (client: Client) => {
    await addClient(client);
  };

  const handleUpdateClient = async (client: Client) => {
    await updateClient(client);
  };

  const handleEditClient = (client: Client) => {
    setSelectedClient(client);
  };

  const handleDeleteConfirm = async () => {
    if (deleteTarget) {
      await deleteClient(deleteTarget.id);
      if (selectedClient?.id === deleteTarget.id) setSelectedClient(null);
      setDeleteTarget(null);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col overflow-hidden">
      <Navbar />
      <StatsBar clients={clients} />

      <div className="flex items-center justify-between px-6 border-b border-border">
        <div className="flex items-center gap-6">
          <TabButton active={activeTab === "pipeline"} onClick={() => setActiveTab("pipeline")} icon={LayoutGrid} label="Pipeline" />
          <TabButton active={activeTab === "clients"} onClick={() => setActiveTab("clients")} icon={Table} label="Todos os Clientes" />
           <TabButton active={activeTab === "funnel"} onClick={() => setActiveTab("funnel")} icon={TrendingDown} label="Funil" />
           <TabButton active={activeTab === "nextsteps"} onClick={() => setActiveTab("nextsteps")} icon={ListChecks} label="Próximos Passos" />
        </div>

        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="h-9 px-4 bg-primary text-primary-foreground font-medium text-sm rounded-lg hover:opacity-90 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Novo Cliente
            <ChevronDown className="w-3.5 h-3.5 opacity-70" />
          </button>
          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-1 w-56 bg-card rounded-lg shadow-modal border border-border py-1 z-30">
              <button
                onClick={() => { setDropdownOpen(false); setTranscriptOpen(true); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-secondary transition-colors"
              >
                <FileText className="w-4 h-4 text-muted-foreground" />
                Inserir Transcrição
              </button>
              <button
                onClick={() => { setDropdownOpen(false); setManualOpen(true); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-secondary transition-colors"
              >
                <PenLine className="w-4 h-4 text-muted-foreground" />
                Adicionar Manualmente
              </button>
            </div>
          )}
        </div>
      </div>

      {activeTab === "pipeline" ? (
        <PipelineBoard clients={clients} onStageChange={handleStageChange} onClientClick={setSelectedClient} onEdit={handleEditClient} onDelete={setDeleteTarget} />
      ) : activeTab === "funnel" ? (
        <FunnelView clients={clients} onClientClick={setSelectedClient} />
      ) : activeTab === "nextsteps" ? (
        <NextStepsView clients={clients} onClientClick={setSelectedClient} />
      ) : (
        <ClientsTable clients={clients} onClientClick={setSelectedClient} onEdit={handleEditClient} onDelete={setDeleteTarget} />
      )}

      <ClientDrawer client={selectedClient} onClose={() => setSelectedClient(null)} onUpdate={handleUpdateClient} />
      <TranscriptModal open={transcriptOpen} onClose={() => setTranscriptOpen(false)} onSave={handleNewClient} />
      <ManualClientModal open={manualOpen} onClose={() => setManualOpen(false)} onSave={handleNewClient} />

      {/* Delete Confirmation Dialog */}
      {deleteTarget && (
        <>
          <div className="fixed inset-0 bg-foreground/20 backdrop-blur-[2px] z-[60]" onClick={() => setDeleteTarget(null)} />
          <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-card rounded-xl shadow-modal z-[60] p-6">
            <h3 className="font-semibold text-base text-foreground mb-2">Excluir cliente</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Tem certeza que deseja excluir <strong className="text-foreground">{deleteTarget.clientName}</strong>? Esta ação não pode ser desfeita.
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteTarget(null)} className="h-9 px-4 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
                Cancelar
              </button>
              <button onClick={handleDeleteConfirm} className="h-9 px-5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors">
                Excluir
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const TabButton = ({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: React.ElementType; label: string }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 py-3 text-sm font-medium border-b-2 transition-colors ${
      active ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
    }`}
  >
    <Icon className="w-4 h-4" />
    {label}
  </button>
);

export default Index;
