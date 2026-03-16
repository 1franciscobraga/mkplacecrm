import { Client, DealStage } from "@/types/crm";

const STORAGE_KEY = "mkt-crm-clients";

const SAMPLE_CLIENT: Client = {
  id: "umi-001",
  clientName: "UMI",
  projectName: "Expansão Marketplace E-commerce",
  contactPerson: "Equipe UMI",
  meetingDate: "2026-03-11",
  dealStage: "Qualificação",
  dealValue: "R$ 75.000 setup + 2.5% GMV",
  painPoints: [
    "Sem operação de e-commerce própria",
    "Sem conexões com distribuidores",
    "Sem infraestrutura logística para logística reversa",
    "Processo de lockers é manual e não escalável",
  ],
  goals: [
    "Lançar MVP em 1-2 meses",
    "Aumentar LTV dos clientes",
    "Criar novas fontes de receita",
    "Solução white-label de marketplace",
  ],
  expectations: [
    "Integração rápida com sistemas existentes",
    "Escalabilidade da plataforma",
    "Suporte técnico dedicado",
  ],
  nextActions: [
    "Definir escopo do piloto",
    "Agendar reunião presencial de trabalho",
    "Preparar proposta detalhada com CTO",
  ],
  differentials: [
    "Rede existente de lockers",
    "Base de usuários ativa",
    "Marca reconhecida no segmento",
  ],
  technicalNotes: "Necessidade de API para integração com sistema de lockers existente. Possível uso de white-label.",
  otherRelevantInfo: "CEO muito engajado com o projeto. Prioridade alta internamente.",
  assignedTo: "Você",
  createdAt: "2026-03-11T10:00:00Z",
  meetings: [
    {
      id: "m-001",
      date: "2026-03-11",
      summary: "Reunião inicial de qualificação. Discutimos dores, objetivos e próximos passos.",
    },
  ],
  notes: "",
};

export function getClients(): Client[] {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    const initial = [SAMPLE_CLIENT];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
    return initial;
  }
  return JSON.parse(stored);
}

export function saveClients(clients: Client[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(clients));
}

export function addClient(client: Client): Client[] {
  const clients = getClients();
  clients.push(client);
  saveClients(clients);
  return clients;
}

export function updateClient(updated: Client): Client[] {
  const clients = getClients().map((c) => (c.id === updated.id ? updated : c));
  saveClients(clients);
  return clients;
}

export function updateClientStage(clientId: string, stage: DealStage): Client[] {
  const clients = getClients().map((c) =>
    c.id === clientId ? { ...c, dealStage: stage } : c
  );
  saveClients(clients);
  return clients;
}
