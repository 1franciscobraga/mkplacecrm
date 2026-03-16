import { useState, useEffect } from "react";
import { Client, DealStage } from "@/types/crm";
import { getClients, saveClients, addClient, updateClient, updateClientStage } from "@/store/clientStore";
import Navbar from "@/components/Navbar";
import StatsBar from "@/components/StatsBar";
import PipelineBoard from "@/components/PipelineBoard";
import ClientsTable from "@/components/ClientsTable";
import ClientDrawer from "@/components/ClientDrawer";
import TranscriptModal from "@/components/TranscriptModal";
import { Plus, LayoutGrid, Table } from "lucide-react";

const Index = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [activeTab, setActiveTab] = useState<"pipeline" | "clients">("pipeline");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [transcriptOpen, setTranscriptOpen] = useState(false);

  useEffect(() => {
    setClients(getClients());
  }, []);

  const handleStageChange = (clientId: string, newStage: DealStage) => {
    const updated = updateClientStage(clientId, newStage);
    setClients(updated);
  };

  const handleClientClick = (client: Client) => {
    setSelectedClient(client);
  };

  const handleClientUpdate = (client: Client) => {
    const updated = updateClient(client);
    setClients(updated);
    setSelectedClient(client);
  };

  const handleNewClient = (client: Client) => {
    const updated = addClient(client);
    setClients(updated);
  };

  return (
    <div className="min-h-screen bg-background grid-texture flex flex-col">
      <Navbar />
      <StatsBar clients={clients} />

      <div className="flex items-center justify-between px-6 py-3 border-b border-border">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab("pipeline")}
            className={`flex items-center gap-2 px-4 py-2 rounded-sm text-sm font-sans font-medium transition-colors duration-150 ${
              activeTab === "pipeline"
                ? "bg-secondary text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            Pipeline
          </button>
          <button
            onClick={() => setActiveTab("clients")}
            className={`flex items-center gap-2 px-4 py-2 rounded-sm text-sm font-sans font-medium transition-colors duration-150 ${
              activeTab === "clients"
                ? "bg-secondary text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Table className="w-4 h-4" />
            Todos os Clientes
          </button>
        </div>

        <button
          onClick={() => setTranscriptOpen(true)}
          className="h-9 px-4 bg-primary text-primary-foreground font-sans font-medium text-sm rounded-sm hover:opacity-90 transition-all duration-150 flex items-center gap-2 animate-pulse-glow"
        >
          <Plus className="w-4 h-4" />
          Novo Cliente
        </button>
      </div>

      {activeTab === "pipeline" ? (
        <PipelineBoard
          clients={clients}
          onStageChange={handleStageChange}
          onClientClick={handleClientClick}
        />
      ) : (
        <ClientsTable clients={clients} onClientClick={handleClientClick} />
      )}

      <ClientDrawer
        client={selectedClient}
        onClose={() => setSelectedClient(null)}
        onUpdate={handleClientUpdate}
      />

      <TranscriptModal
        open={transcriptOpen}
        onClose={() => setTranscriptOpen(false)}
        onSave={handleNewClient}
      />
    </div>
  );
};

export default Index;
