import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Send, ArrowLeft, Loader2, CheckCircle, Clock, UserPlus } from "lucide-react";
import { toast } from "sonner";

interface AuthorizedEmail {
  id: string;
  email: string;
  status: string;
  invited_at: string | null;
  created_at: string;
  added_by: string | null;
}

const Admin = () => {
  const { user } = useAuth();
  const [emails, setEmails] = useState<AuthorizedEmail[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [inviting, setInviting] = useState<string | null>(null);

  const fetchEmails = async () => {
    const { data, error } = await supabase
      .from("authorized_emails")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      console.error("Error fetching emails:", error);
      return;
    }
    setEmails((data as unknown as AuthorizedEmail[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchEmails();
  }, []);

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
      added_by: user?.email || null,
    } as any);

    if (error) {
      toast.error("Failed to add email: " + error.message);
      setAdding(false);
      return;
    }

    setNewEmail("");
    await fetchEmails();
    setAdding(false);

    // Auto-send invite
    await sendInvite(email);
  };

  const sendInvite = async (email: string) => {
    setInviting(email);
    try {
      const { data, error } = await supabase.functions.invoke("invite-user", {
        body: { email },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      // Update invited_at
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
    if (!confirm(`Remove ${email} from the whitelist? They will lose access.`)) return;
    const { error } = await supabase.from("authorized_emails").delete().eq("id", id);
    if (error) {
      toast.error("Failed to remove: " + error.message);
      return;
    }
    await fetchEmails();
    toast.success(`${email} removed from whitelist.`);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
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
            Add & Invite
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
                  <span className="text-sm font-medium text-foreground truncate">
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
                        <span className="text-xs text-amber-600 font-medium">Active</span>
                      </>
                    )}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {entry.invited_at
                      ? new Date(entry.invited_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      : "—"}
                  </span>
                  <div className="flex items-center justify-end gap-1">
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
                      className="p-1.5 rounded-md hover:bg-red-50 transition-colors"
                      title="Remove access"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-500" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <p className="text-xs text-muted-foreground mt-4">
          When you add an email, the investor will receive a magic link to access the CRM.
          Only whitelisted emails can sign in.
        </p>
      </div>
    </div>
  );
};

export default Admin;