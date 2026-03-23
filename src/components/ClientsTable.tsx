import { useState, useMemo, useRef, useEffect } from "react";
import { Client, DEAL_STAGES, DealStage, STAGE_BADGE_STYLES } from "@/types/crm";
import { Search, ChevronDown, ChevronUp, Filter, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { stageLabel } from "@/lib/i18n";

interface ClientsTableProps {
  clients: Client[];
  onClientClick: (client: Client) => void;
  onEdit: (client: Client) => void;
  onDelete: (client: Client) => void;
}

type SortField = "clientName" | "dealStage" | "meetingDate" | "dealValue";
type SortDir = "asc" | "desc";

const ClientsTable = ({ clients, onClientClick, onEdit, onDelete }: ClientsTableProps) => {
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
        (c) => c.clientName.toLowerCase().includes(q) || c.projectName?.toLowerCase().includes(q) || c.contactName?.toLowerCase().includes(q)
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
            placeholder="Search clients..."
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
            <option value="all">All Stages</option>
            {DEAL_STAGES.map((s) => (<option key={s} value={s}>{stageLabel(s)}</option>))}
          </select>
        </div>
      </div>

      <div className="bg-card rounded-xl shadow-card overflow-hidden flex-1">
        <div className="overflow-auto max-h-[calc(100vh-280px)]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {([
                  ["clientName", "Client"],
                  ["dealStage", "Stage"],
                  [null, "Pain Points"],
                  [null, "Next Step"],
                  ["meetingDate", "Last Meeting"],
                  ["dealValue", "Value"],
                  [null, "Assigned To"],
                  [null, ""],
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
                <tr><td colSpan={8} className="text-center py-12 text-muted-foreground text-sm">No clients found.</td></tr>
              ) : (
                filtered.map((client) => (
                  <TableRow key={client.id} client={client} onClick={() => onClientClick(client)} onEdit={() => onEdit(client)} onDelete={() => onDelete(client)} />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const TableRow = ({ client, onClick, onEdit, onDelete }: { client: Client; onClick: () => void; onEdit: () => void; onDelete: () => void }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const badge = STAGE_BADGE_STYLES[client.dealStage];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    if (menuOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  return (
    <tr onClick={onClick} className="border-b border-border last:border-b-0 cursor-pointer hover:bg-secondary/50 transition-colors group">
      <td className="px-4 py-3">
        <p className="font-medium text-foreground">{client.clientName}</p>
        {client.projectName && <p className="text-xs text-muted-foreground">{client.projectName}</p>}
      </td>
      <td className="px-4 py-3">
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium ${badge.bg} ${badge.text}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
          {stageLabel(client.dealStage)}
        </span>
      </td>
      <td className="px-4 py-3 max-w-[200px]"><p className="text-xs text-muted-foreground truncate">{client.painPointsAndChallenges?.[0] || "—"}</p></td>
      <td className="px-4 py-3 max-w-[200px]"><p className="text-xs text-muted-foreground truncate">{client.nextSteps?.[0] || "—"}</p></td>
      <td className="px-4 py-3"><span className="text-xs text-muted-foreground">{client.meetingDate ? new Date(client.meetingDate).toLocaleDateString("en-US") : "—"}</span></td>
      <td className="px-4 py-3"><span className="text-sm font-semibold text-primary">{client.dealValue || "—"}</span></td>
      <td className="px-4 py-3"><span className="text-xs text-muted-foreground">{client.assignedTo}</span></td>
      <td className="px-4 py-3 w-10">
        <div className="relative" ref={menuRef}>
          <button
            onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
            className="p-1 rounded hover:bg-secondary opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <MoreVertical className="w-4 h-4 text-muted-foreground" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 w-44 bg-card rounded-lg shadow-modal border border-border py-1 z-30">
              <button onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onEdit(); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-secondary transition-colors">
                <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                Edit
              </button>
              <button onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onDelete(); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors">
                <Trash2 className="w-3.5 h-3.5" />
                Delete Client
              </button>
            </div>
          )}
        </div>
      </td>
    </tr>
  );
};

export default ClientsTable;
