import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Send, ArrowLeft, Loader2, CheckCircle, Clock, UserPlus, Lock, Eye, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";

const ADMIN_PASSWORD = "scala2026";

interface AuthorizedEmail {
  id: string;
  email: string;
  status: string;
  invited_at: string | null;
  created_at: string;
  added_by: string | null;
}

interface AccessSummary {
  user_email: string;
  access_count: number;
  first_access: string;
  last_access: string;
}

interface AccessLog {
  id: string;
  accessed_at: string;
  user_agent: string | null;
}

const Admin = () => {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [emails, setEmails] = useState<AuthorizedEmail[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [inviting, setInviting] = useState<string | null>(null);
  const [accessSummaries, setAccessSummaries] = useState<Map<string, AccessSummary>>(new Map());
  const [expandedEmail, setExpandedEmail] = useState<string | null>(null);
  const [accessHistory, setAccessHistory] = useState<AccessLog[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setAuthenticated(true);
      setPasswordError("");
      sessionStorage.setItem("admin_auth", "true");
    } else {
      setPasswordError("Incorrect password");
    }
  };

  useEffect(() => {
    if (sessionStorage.getItem("admin_auth") === "true") {
      setAuthenticated(true);
    }
  }, []);

  const fetchEmails = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("authorized_emails")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) console.error("Error fetching emails:", error);
    setEmails((data as unknown as AuthorizedEmail[]) || []);
    setLoading(false);
  };

  const fetchAccessSummaries = async () => {
    const { data, error } = await supabase
      .from("access_logs")
      .select("user_email, accessed_at")
      .order("accessed_at", { ascending: true });

    if (error || !data) return;

    const summaries = new Map<string, AccessSummary>();
    for (const row of data as any[]) {
      const email = row.user_email;
      const existing = summaries.get(email);
      if (existing) {
        existing.access_count++;
        existing.last_access = row.accessed_at;
      } else {
        summaries.set(email, {
          user_email: email,
          access_count: 1,
          first_access: row.accessed_at,
          last_access: row.accessed_at,
        });
      }
    }
    setAccessSummaries(summaries);
  };

  useEffect(() => {
    if (authenticated) {
      fetchEmails();
      fetchAccessSummaries();
    }
  }, [authenticated]);

  const fetchHistory = async (email: string) => {
    if (expandedEmail === email) {
      setExpandedEmail(null);
      return;
    }
    setLoadingHistory(true);
    setExpandedEmail(email);

    const { data, error } = await supabase
      .from("access_logs")
      .select("id, accessed_at, user_agent")
      .eq("user_email", email)
      .order("accessed_at", { ascending: false })
      .limit(20);

    if (error) console.error("History error:", error);
    setAccessHistory((data as unknown as AccessLog[]) || []);
    setLoadingHistory(false);
  };

  const sendInvite = async (email: string) => {
    setInviting(email);
    try {
      const { data, error } = await supabase.functions.invoke("invite-user", {
        body: { email },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      await supabase
        .from("authorized_emails")
        .update({ invited_at: new Date().toISOString(), status: "invited" } as any)
        .eq("email", email);

      await fetchEmails();
      toast.success(`Invite sent to ${email}`);
    } catch (err: any) {
      console.error("Invite error:", err);
      toast.error(`Failed to send invite: ${err.message || "Unknown error"}`);
    } finally {
      setInviting(null);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = newEmail.trim().toLowerCase();
    if (!email) return;

    if (emails.some((e) => e.email === email)) {
      toast.error("This email is already in the whitelist.");
      return;
    }

    setAdding(true);
    const { error } = await supabase.from("authorized_emails").insert({
      email,
      status: "active",
      added_by: "admin",
    } as any);

    if (error) {
      toast.error("Failed to add email: " + error.message);
      setAdding(false);
      return;
    }

    setNewEmail("");
    await fetchEmails();
    toast.success(`${email} added. Sending invite...`);
    await sendInvite(email);
    setAdding(false);
  };

  const handleRemove = async (id: string, email: string) => {
    if (!confirm(`Remove ${email} from the whitelist?`)) return;
    const { error } = await supabase.from("authorized_emails").delete().eq("id", id);
    if (error) {
      toast.error("Failed to remove: " + error.message);
      return;
    }
    await fetchEmails();
    toast.success(`${email} removed.`);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit",
    });
  };

  const parseDevice = (ua: string | null) => {
    if (!ua) return "Unknown";
    if (/Mobile|Android|iPhone/i.test(ua)) return "Mobile";
    if (/Tablet|iPad/i.test(ua)) return "Tablet";
    return "Desktop";
  };

  // Password gate
  if (!authenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-6">
            <Lock className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <h1 className="text-xl font-bold text-foreground">Admin Access</h1>
            <p className="text-sm text-muted-foreground mt-1">Enter the admin password to continue</p>
          </div>
          <form onSubmit={handlePasswordSubmit} className="bg-card border border-border rounded-xl p-6 space-y-4">
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setPasswordError(""); }}
              autoFocus
              required
            />
            {passwordError && <p className="text-sm text-destructive">{passwordError}</p>}
            <Button type="submit" className="w-full">Enter</Button>
          </form>
          <div className="text-center mt-4">
            <a href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">← Back to CRM</a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <nav className="h-14 bg-card border-b border-border flex items-center justify-between px-6">
        <a href="/" className="text-base font-semibold text-foreground hover:opacity-80 transition-opacity">MKT CRM</a>
        <button
          onClick={() => { sessionStorage.removeItem("admin_auth"); setAuthenticated(false); }}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Lock Admin
        </button>
      </nav>
      <div className="flex-1 p-6 max-w-4xl mx-auto w-full">
        <div className="flex items-center gap-3 mb-6">
          <a href="/" className="p-2 rounded-lg hover:bg-secondary transition-colors">
            <ArrowLeft className="w-4 h-4 text-muted-foreground" />
          </a>
          <div>
            <h1 className="text-lg font-bold text-foreground">Access Management</h1>
            <p className="text-sm text-muted-foreground">
              Add investor emails to send them a magic link invite. Track access activity below.
            </p>
          </div>
        </div>

        {/* Add email form */}
        <form onSubmit={handleAdd} className="flex gap-3 mb-6">
          <div className="flex-1 relative">
            <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="email"
              placeholder="investor@email.com"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="pl-10"
              required
            />
          </div>
          <Button type="submit" disabled={adding || !newEmail.trim()} className="gap-2">
            {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Add & Invite
          </Button>
        </form>

        {/* Email list */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-secondary/30">
            <div className="grid grid-cols-[1fr_80px_70px_110px_110px_80px] gap-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              <span>Email</span>
              <span>Status</span>
              <span className="text-center">Views</span>
              <span>First Access</span>
              <span>Last Access</span>
              <span className="text-right">Actions</span>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : emails.length === 0 ? (
            <div className="text-center py-12 text-sm text-muted-foreground">
              No authorized emails yet. Add one above.
            </div>
          ) : (
            <div className="divide-y divide-border">
              {emails.map((entry) => {
                const summary = accessSummaries.get(entry.email);
                const isExpanded = expandedEmail === entry.email;

                return (
                  <div key={entry.id}>
                    <div
                      className="grid grid-cols-[1fr_80px_70px_110px_110px_80px] gap-3 items-center px-4 py-3 hover:bg-secondary/20 transition-colors cursor-pointer"
                      onClick={() => fetchHistory(entry.email)}
                    >
                      <span className="text-sm font-medium text-foreground truncate flex items-center gap-1.5">
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />}
                        {entry.email}
                      </span>
                      <span className="flex items-center gap-1.5">
                        {entry.status === "invited" ? (
                          <>
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                            <span className="text-xs text-emerald-600 font-medium">Invited</span>
                          </>
                        ) : (
                          <>
                            <Clock className="w-3.5 h-3.5 text-amber-500" />
                            <span className="text-xs text-amber-600 font-medium">Pending</span>
                          </>
                        )}
                      </span>
                      <span className="text-center">
                        {summary ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-foreground bg-secondary px-2 py-0.5 rounded-full">
                            <Eye className="w-3 h-3" />
                            {summary.access_count}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {summary ? formatDate(summary.first_access) : "—"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {summary ? formatDate(summary.last_access) : "—"}
                      </span>
                      <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => sendInvite(entry.email)}
                          disabled={inviting === entry.email}
                          className="p-1.5 rounded-md hover:bg-secondary transition-colors disabled:opacity-50"
                          title="Resend invite"
                        >
                          {inviting === entry.email ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
                          ) : (
                            <Send className="w-3.5 h-3.5 text-muted-foreground" />
                          )}
                        </button>
                        <button
                          onClick={() => handleRemove(entry.id, entry.email)}
                          className="p-1.5 rounded-md hover:bg-destructive/10 transition-colors"
                          title="Remove"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-destructive" />
                        </button>
                      </div>
                    </div>

                    {/* Expanded access history */}
                    {isExpanded && (
                      <div className="bg-secondary/10 border-t border-border px-6 py-3">
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Recent Access History</h4>
                        {loadingHistory ? (
                          <div className="flex items-center gap-2 py-2">
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">Loading...</span>
                          </div>
                        ) : accessHistory.length === 0 ? (
                          <p className="text-xs text-muted-foreground py-2">No access records yet.</p>
                        ) : (
                          <div className="space-y-1.5">
                            {accessHistory.map((log) => (
                              <div key={log.id} className="flex items-center gap-4 text-xs text-muted-foreground">
                                <span className="font-medium text-foreground">{formatDate(log.accessed_at)}</span>
                                <span className="bg-secondary px-2 py-0.5 rounded text-[10px]">{parseDevice(log.user_agent)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Admin;
