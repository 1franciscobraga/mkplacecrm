import { useState, useMemo } from "react";
import { Client, DEAL_STAGES, DealStage, STAGE_BADGE_STYLES } from "@/types/crm";
import { Search, ChevronDown, ChevronUp, Filter } from "lucide-react";

interface ClientsTableProps {
  clients: Client[];
  onClientClick: (client: Client) => void;
}

type SortField = "clientName" | "dealStage" | "meetingDate" | "dealValue";
type SortDir = "asc" | "desc";

const ClientsTable = ({ clients, onClientClick }: ClientsTableProps) => {
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<DealStage | "all">("all");
  const [sortField, setSortField] = useState<SortField>("clientName");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("asc"); }
  };

  const SortIcon = ({ field }: { field: SortField }) =>
    sortField === field ? (
      sortDir === "asc" ? <ChevronUp className="w-3 h-3 inline ml-0.5" /> : <ChevronDown className="w-3 h-3 inline ml-0.5" />
    ) : null;

  const filtered = useMemo(() => {
    let result = clients;
    if (stageFilter !== "all") result = result.filter((c) => c.dealStage === stageFilter);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) => c.clientName.toLowerCase().includes(q) || c.projectName?.toLowerCase().includes(q) || c.contactPerson?.toLowerCase().includes(q)
      );
    }
    result.sort((a, b) => {
      const cmp = String(a[sortField] ?? "").localeCompare(String(b[sortField] ?? ""));
      return sortDir === "asc" ? cmp : -cmp;
    });
    return result;
  }, [clients, search, stageFilter, sortField, sortDir]);

  return (
    <div className="flex-1 flex flex-col p-6">
      <div className="flex items-center gap-4 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar clientes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 pl-9 pr-4 bg-card border border-border rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:shadow-input-focus transition-all"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value as DealStage | "all")}
            className="h-9 px-3 bg-card border border-border rounded-lg text-sm focus:outline-none focus:border-primary focus:shadow-input-focus transition-all"
          >
            <option value="all">Todas as etapas</option>
            {DEAL_STAGES.map((s) => (<option key={s} value={s}>{s}</option>))}
          </select>
        </div>
      </div>

      <div className="bg-card rounded-xl shadow-card overflow-hidden flex-1">
        <div className="overflow-auto max-h-[calc(100vh-280px)]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {([
                  ["clientName", "Cliente"],
                  ["dealStage", "Etapa"],
                  [null, "Dores"],
                  [null, "Próx. Ação"],
                  ["meetingDate", "Última Reunião"],
                  ["dealValue", "Valor"],
                  [null, "Responsável"],
                ] as const).map(([field, label], i) => (
                  <th
                    key={i}
                    onClick={field ? () => toggleSort(field as SortField) : undefined}
                    className={`text-left px-4 py-3 text-xs font-medium text-muted-foreground ${field ? "cursor-pointer hover:text-foreground" : ""} transition-colors`}
                  >
                    {label} {field && <SortIcon field={field as SortField} />}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-muted-foreground text-sm">Nenhum cliente encontrado.</td></tr>
              ) : (
                filtered.map((client) => {
                  const badge = STAGE_BADGE_STYLES[client.dealStage];
                  return (
                    <tr
                      key={client.id}
                      onClick={() => onClientClick(client)}
                      className="border-b border-border last:border-b-0 cursor-pointer hover:bg-secondary/50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium text-foreground">{client.clientName}</p>
                        {client.projectName && <p className="text-xs text-muted-foreground">{client.projectName}</p>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium ${badge.bg} ${badge.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                          {client.dealStage}
                        </span>
                      </td>
                      <td className="px-4 py-3 max-w-[200px]"><p className="text-xs text-muted-foreground truncate">{client.painPoints[0] || "—"}</p></td>
                      <td className="px-4 py-3 max-w-[200px]"><p className="text-xs text-muted-foreground truncate">{client.nextActions[0] || "—"}</p></td>
                      <td className="px-4 py-3"><span className="text-xs text-muted-foreground">{client.meetingDate ? new Date(client.meetingDate).toLocaleDateString("pt-BR") : "—"}</span></td>
                      <td className="px-4 py-3"><span className="text-sm font-semibold text-primary">{client.dealValue || "—"}</span></td>
                      <td className="px-4 py-3"><span className="text-xs text-muted-foreground">{client.assignedTo}</span></td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ClientsTable;
