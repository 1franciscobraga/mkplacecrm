import { useState, useMemo } from "react";
import { Client, DEAL_STAGES, DealStage, STAGE_COLORS } from "@/types/crm";
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
    if (sortField === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const SortIcon = ({ field }: { field: SortField }) =>
    sortField === field ? (
      sortDir === "asc" ? (
        <ChevronUp className="w-3 h-3 inline ml-1" />
      ) : (
        <ChevronDown className="w-3 h-3 inline ml-1" />
      )
    ) : null;

  const filtered = useMemo(() => {
    let result = clients;
    if (stageFilter !== "all") {
      result = result.filter((c) => c.dealStage === stageFilter);
    }
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.clientName.toLowerCase().includes(q) ||
          c.projectName?.toLowerCase().includes(q) ||
          c.contactPerson?.toLowerCase().includes(q)
      );
    }
    result.sort((a, b) => {
      const aVal = a[sortField] ?? "";
      const bVal = b[sortField] ?? "";
      const cmp = String(aVal).localeCompare(String(bVal));
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
            className="w-full h-9 pl-9 pr-4 bg-secondary border border-border rounded-sm font-sans text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors duration-150"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value as DealStage | "all")}
            className="h-9 px-3 bg-secondary border border-border rounded-sm font-sans text-sm text-foreground focus:outline-none focus:border-primary transition-colors duration-150"
          >
            <option value="all">Todas as etapas</option>
            {DEAL_STAGES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="border border-border rounded-md overflow-hidden flex-1">
        <div className="overflow-auto max-h-[calc(100vh-280px)]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th onClick={() => toggleSort("clientName")} className="text-left px-4 py-3 font-data text-[10px] uppercase tracking-wider text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
                  Cliente <SortIcon field="clientName" />
                </th>
                <th onClick={() => toggleSort("dealStage")} className="text-left px-4 py-3 font-data text-[10px] uppercase tracking-wider text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
                  Etapa <SortIcon field="dealStage" />
                </th>
                <th className="text-left px-4 py-3 font-data text-[10px] uppercase tracking-wider text-muted-foreground">
                  Dores
                </th>
                <th className="text-left px-4 py-3 font-data text-[10px] uppercase tracking-wider text-muted-foreground">
                  Próx. Ação
                </th>
                <th onClick={() => toggleSort("meetingDate")} className="text-left px-4 py-3 font-data text-[10px] uppercase tracking-wider text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
                  Última Reunião <SortIcon field="meetingDate" />
                </th>
                <th onClick={() => toggleSort("dealValue")} className="text-left px-4 py-3 font-data text-[10px] uppercase tracking-wider text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
                  Valor <SortIcon field="dealValue" />
                </th>
                <th className="text-left px-4 py-3 font-data text-[10px] uppercase tracking-wider text-muted-foreground">
                  Responsável
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-muted-foreground text-sm">
                    Nenhum cliente encontrado.
                  </td>
                </tr>
              ) : (
                filtered.map((client, i) => (
                  <tr
                    key={client.id}
                    onClick={() => onClientClick(client)}
                    className={`border-b border-border cursor-pointer hover:bg-teal-50 transition-colors duration-150 ${
                      i % 2 === 0 ? "" : "bg-card/50"
                    }`}
                  >
                    <td className="px-4 py-3">
                      <p className="font-sans font-medium text-foreground">{client.clientName}</p>
                      {client.projectName && (
                        <p className="font-sans text-xs text-muted-foreground">{client.projectName}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`font-data text-xs ${STAGE_COLORS[client.dealStage]}`}>
                        {client.dealStage}
                      </span>
                    </td>
                    <td className="px-4 py-3 max-w-[200px]">
                      <p className="text-xs text-muted-foreground truncate">
                        {client.painPoints[0] || "—"}
                      </p>
                    </td>
                    <td className="px-4 py-3 max-w-[200px]">
                      <p className="text-xs text-muted-foreground truncate">
                        {client.nextActions[0] || "—"}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-data text-xs text-muted-foreground">
                        {client.meetingDate
                          ? new Date(client.meetingDate).toLocaleDateString("pt-BR")
                          : "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-data text-xs text-primary">
                        {client.dealValue || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-muted-foreground">{client.assignedTo}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ClientsTable;
