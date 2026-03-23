import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Mail, Loader2, CheckCircle } from "lucide-react";

const Login = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: { emailRedirectTo: window.location.origin },
    });

    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-foreground">MKT CRM</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Sign in with your authorized email
          </p>
        </div>

        {sent ? (
          <div className="bg-card border border-border rounded-xl p-6 text-center">
            <CheckCircle className="w-10 h-10 text-primary mx-auto mb-3" />
            <h2 className="font-semibold text-foreground mb-1">Link sent!</h2>
            <p className="text-sm text-muted-foreground">
              Check your inbox at <strong>{email}</strong> and click the link to sign in.
            </p>
            <button
              onClick={() => { setSent(false); setEmail(""); }}
              className="mt-4 text-sm text-primary hover:underline"
            >
              Use another email
            </button>
          </div>
        ) : (
          <form onSubmit={handleLogin} className="bg-card border border-border rounded-xl p-6 space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="you@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                  autoFocus
                />
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}

            <Button type="submit" className="w-full" disabled={loading || !email.trim()}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send access link"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Login;
