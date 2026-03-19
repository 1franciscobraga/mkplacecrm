import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  isAuthorized: boolean | null; // null = loading
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  const checkAuthorization = async (email: string | undefined) => {
    if (!email) {
      setIsAuthorized(false);
      return;
    }
    const { data, error } = await supabase
      .from("authorized_emails")
      .select("id")
      .eq("email", email.toLowerCase())
      .maybeSingle();

    if (error) {
      console.error("Error checking authorization:", error);
      setIsAuthorized(false);
      return;
    }
    setIsAuthorized(!!data);
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        if (session?.user) {
          await checkAuthorization(session.user.email);
        } else {
          setIsAuthorized(null);
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        await checkAuthorization(session.user.email);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setIsAuthorized(null);
  };

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, isAuthorized, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
