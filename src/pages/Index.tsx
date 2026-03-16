import { useState, useEffect, useRef } from "react";
import { Client, DealStage } from "@/types/crm";
import { getClients, addClient, updateClient, updateClientStage } from "@/store/clientStore";
import Navbar from "@/components/Navbar";
import StatsBar from "@/components/StatsBar";
import PipelineBoard from "@/components/PipelineBoard";
import ClientsTable from "@/components/ClientsTable";
import ClientDrawer from "@/components/ClientDrawer";
import TranscriptModal from "@/components/TranscriptModal";
import ManualClientModal from "@/components/ManualClientModal";
import { Plus, LayoutGrid, Table, FileText, PenLine, ChevronDown } from "lucide-react";

const Index = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [activeTab, setActiveTab] = useState<"pipeline" | "clients">("pipeline");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [transcriptOpen, setTranscriptOpen] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setClients(getClients());
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

  const handleStageChange = (clientId: string, newStage: DealStage) => {
    const updated = updateClientStage(clientId, newStage);
    setClients(updated);
  };

  const handleNewClient = (client: Client) => {
    const updated = addClient(client);
    setClients(updated);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <StatsBar clients={clients} />

      <div className="flex items-center justify-between px-6 border-b border-border">
        <div className="flex items-center gap-6">
          <TabButton active={activeTab === "pipeline"} onClick={() => setActiveTab("pipeline")} icon={LayoutGrid} label="Pipeline" />
          <TabButton active={activeTab === "clients"} onClick={() => setActiveTab("clients")} icon={Table} label="Todos os Clientes" />
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
        <PipelineBoard clients={clients} onStageChange={handleStageChange} onClientClick={setSelectedClient} />
      ) : (
        <ClientsTable clients={clients} onClientClick={setSelectedClient} />
      )}

      <ClientDrawer client={selectedClient} onClose={() => setSelectedClient(null)} onUpdate={(c) => { setClients(updateClient(c)); setSelectedClient(c); }} />
      <TranscriptModal open={transcriptOpen} onClose={() => setTranscriptOpen(false)} onSave={handleNewClient} />
      <ManualClientModal open={manualOpen} onClose={() => setManualOpen(false)} onSave={handleNewClient} />
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
