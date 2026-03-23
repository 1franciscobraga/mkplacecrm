import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Send, ArrowLeft, Loader2, CheckCircle, Clock, UserPlus, Lock } from "lucide-react";
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

const Admin = () => {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [emails, setEmails] = useState<AuthorizedEmail[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [inviting, setInviting] = useState<string | null>(null);

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
    if (error) {
      console.error("Error fetching emails:", error);
    }
    setEmails((data as unknown as AuthorizedEmail[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    if (authenticated) {
      fetchEmails();
    }
  }, [authenticated]);

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
    setAdding(false);
    toast.success(`${email} added to whitelist.`);
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
            {passwordError && <p className="text-sm text-red-500">{passwordError}</p>}
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
      <div className="flex-1 p-6 max-w-3xl mx-auto w-full">
        <div className="flex items-center gap-3 mb-6">
          <a href="/" className="p-2 rounded-lg hover:bg-secondary transition-colors">
            <ArrowLeft className="w-4 h-4 text-muted-foreground" />
          </a>
          <div>
            <h1 className="text-lg font-bold text-foreground">Access Management</h1>
            <p className="text-sm text-muted-foreground">
              Manage authorized emails. Only whitelisted emails can access the CRM.
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
            Add
          </Button>
        </form>

        {/* Email list */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-secondary/30">
            <div className="grid grid-cols-[1fr_100px_120px_80px] gap-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              <span>Email</span>
              <span>Status</span>
              <span>Invited</span>
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
              {emails.map((entry) => (
                <div
                  key={entry.id}
                  className="grid grid-cols-[1fr_100px_120px_80px] gap-4 items-center px-4 py-3 hover:bg-secondary/20 transition-colors"
                >
                  <span className="text-sm font-medium text-foreground truncate">{entry.email}</span>
                  <span className="flex items-center gap-1.5">
                    {entry.status === "invited" ? (
                      <>
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-xs text-emerald-600 font-medium">Invited</span>
                      </>
                    ) : (
                      <>
                        <Clock className="w-3.5 h-3.5 text-amber-500" />
                        <span className="text-xs text-amber-600 font-medium">Active</span>
                      </>
                    )}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {entry.invited_at
                      ? new Date(entry.invited_at).toLocaleDateString("en-US", {
                          month: "short", day: "numeric", year: "numeric",
                        })
                      : "—"}
                  </span>
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => sendInvite(entry.email)}
                      disabled={inviting === entry.email}
                      className="p-1.5 rounded-md hover:bg-secondary transition-colors disabled:opacity-50"
                      title="Send invite"
                    >
                      {inviting === entry.email ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
                      ) : (
                        <Send className="w-3.5 h-3.5 text-muted-foreground" />
                      )}
                    </button>
                    <button
                      onClick={() => handleRemove(entry.id, entry.email)}
                      className="p-1.5 rounded-md hover:bg-red-50 transition-colors"
                      title="Remove"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-500" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Admin;
