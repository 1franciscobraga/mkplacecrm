import { Client, DealStage } from "@/types/crm";
import { normalizeClient } from "@/lib/clientData";
import { supabase } from "@/integrations/supabase/client";

// ── Mapping helpers: DB row ↔ Client ──

const rowToClient = (row: Record<string, unknown>): Client =>
  normalizeClient({
    id: row.id as string,
    clientName: row.client_name as string,
    projectName: row.project_name as string | null,
    meetingDate: row.meeting_date as string | null,
    businessModel: row.business_model as string | null,
    contactName: row.contact_name as string | null,
    contactRole: row.contact_role as string | null,
    contactEmail: row.contact_email as string | null,
    contactPhone: row.contact_phone as string | null,
    companyGroup: row.company_group as string | null,
    executiveSummary: row.executive_summary as string | null,
    painPointsAndChallenges: (row.pain_points_and_challenges ?? []) as string[],
    goalsAndExpectations: (row.goals_and_expectations ?? []) as string[],
    clientDifferentials: (row.client_differentials ?? []) as string[],
    dealValue: row.deal_value as string | null,
    revenueModel: row.revenue_model as string | null,
    clientTimeline: row.client_timeline as string | null,
    budgetMentioned: row.budget_mentioned as string | null,
    techStack: row.tech_stack as string | null,
    implementationComplexity: row.implementation_complexity as Client["implementationComplexity"],
    nextSteps: (row.next_steps ?? []) as string[],
    responsibleParties: row.responsible_parties as string | null,
    nextContactDate: row.next_contact_date as string | null,
    dealStage: row.deal_stage as DealStage,
    confidenceLevel: row.confidence_level as number | null,
    urgency: row.urgency as Client["urgency"],
    risk: row.risk as Client["risk"],
    expansionPotential: row.expansion_potential as Client["expansionPotential"],
    priceSensitivity: row.price_sensitivity as Client["priceSensitivity"],
    leadSource: row.lead_source as string | null,
    assignedTo: row.assigned_to as string,
    meetings: (row.meetings ?? []) as Client["meetings"],
    notes: (row.notes ?? "") as string,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  });

const clientToRow = (client: Client) => ({
  id: client.id,
  client_name: client.clientName,
  project_name: client.projectName,
  meeting_date: client.meetingDate,
  business_model: client.businessModel,
  contact_name: client.contactName,
  contact_role: client.contactRole,
  contact_email: client.contactEmail,
  contact_phone: client.contactPhone,
  company_group: client.companyGroup,
  executive_summary: client.executiveSummary,
  pain_points_and_challenges: client.painPointsAndChallenges,
  goals_and_expectations: client.goalsAndExpectations,
  client_differentials: client.clientDifferentials,
  deal_value: client.dealValue,
  revenue_model: client.revenueModel,
  client_timeline: client.clientTimeline,
  budget_mentioned: client.budgetMentioned,
  tech_stack: client.techStack,
  implementation_complexity: client.implementationComplexity,
  next_steps: client.nextSteps,
  responsible_parties: client.responsibleParties,
  next_contact_date: client.nextContactDate,
  deal_stage: client.dealStage,
  confidence_level: client.confidenceLevel,
  urgency: client.urgency,
  risk: client.risk,
  expansion_potential: client.expansionPotential,
  price_sensitivity: client.priceSensitivity,
  lead_source: client.leadSource,
  assigned_to: client.assignedTo,
  meetings: client.meetings,
  notes: client.notes,
  created_at: client.createdAt,
  updated_at: client.updatedAt,
});

// ── Public API ──

export async function getClients(): Promise<Client[]> {
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching clients:", error);
    return [];
  }

  return (data ?? []).map((row) => rowToClient(row as Record<string, unknown>));
}

export async function addClient(client: Client): Promise<void> {
  const normalized = normalizeClient({
    ...client,
    updatedAt: new Date().toISOString(),
  });
  console.log("Saving client object:", JSON.stringify(normalized, null, 2));

  const row = clientToRow(normalized);
  const { error } = await supabase.from("clients").insert(row as any);
  if (error) console.error("Error adding client:", error);
}

export async function updateClient(updated: Client): Promise<void> {
  const normalized = normalizeClient({
    ...updated,
    updatedAt: new Date().toISOString(),
  });

  const row = clientToRow(normalized);
  const { error } = await supabase
    .from("clients")
    .update(row as any)
    .eq("id", normalized.id);
  if (error) console.error("Error updating client:", error);
}

export async function updateClientStage(clientId: string, stage: DealStage): Promise<void> {
  const { error } = await supabase
    .from("clients")
    .update({ deal_stage: stage, updated_at: new Date().toISOString() })
    .eq("id", clientId);
  if (error) console.error("Error updating stage:", error);
}

export async function deleteClient(clientId: string): Promise<void> {
  const { error } = await supabase.from("clients").delete().eq("id", clientId);
  if (error) console.error("Error deleting client:", error);
}

// ── Realtime subscription ──

export function subscribeToClients(onUpdate: (clients: Client[]) => void) {
  // Initial fetch
  getClients().then(onUpdate);

  const channel = supabase
    .channel("clients-realtime")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "clients" },
      () => {
        // Re-fetch all on any change for simplicity
        getClients().then(onUpdate);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
