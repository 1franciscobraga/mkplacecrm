import { createContext, useCallback, useContext, useEffect, useRef, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  isAuthorized: boolean | null; // null = loading
  loading: boolean;
  signOut: () => Promise<void>;
}

const AUTH_CACHE_KEY = "authorized-email-cache-v1";
const AUTH_CACHE_TTL_MS = 30_000;

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function readAuthCache(email: string): boolean | null {
  try {
    const raw = sessionStorage.getItem(AUTH_CACHE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as { email?: string; authorized?: boolean; expiresAt?: number };
    if (!parsed.email || parsed.expiresAt == null) return null;
    if (parsed.email !== email || parsed.expiresAt < Date.now()) return null;

    return Boolean(parsed.authorized);
  } catch {
    return null;
  }
}

function writeAuthCache(email: string, authorized: boolean) {
  try {
    sessionStorage.setItem(
      AUTH_CACHE_KEY,
      JSON.stringify({
        email,
        authorized,
        expiresAt: Date.now() + AUTH_CACHE_TTL_MS,
      })
    );
  } catch {
    // ignore storage errors
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const inFlightChecksRef = useRef<Map<string, Promise<boolean>>>(new Map());

  const checkAuthorization = useCallback(async (email: string | undefined): Promise<boolean> => {
    if (!email) return false;

    const normalizedEmail = email.toLowerCase();
    const cachedAuth = readAuthCache(normalizedEmail);
    if (cachedAuth !== null) return cachedAuth;

    const existingRequest = inFlightChecksRef.current.get(normalizedEmail);
    if (existingRequest) return existingRequest;

    const request = (async () => {
      const { data, error } = await supabase
        .from("authorized_emails")
        .select("id")
        .eq("email", normalizedEmail)
        .maybeSingle();

      const authorized = !error && !!data;
      if (error) {
        console.error("Error checking authorization:", error);
      }

      writeAuthCache(normalizedEmail, authorized);
      return authorized;
    })();

    inFlightChecksRef.current.set(normalizedEmail, request);

    try {
      return await request;
    } finally {
      inFlightChecksRef.current.delete(normalizedEmail);
    }
  }, []);

  const resolveSessionAccess = useCallback(
    async (nextSession: Session | null, options?: { preferCacheOnly?: boolean }) => {
      setSession(nextSession);

      const email = nextSession?.user?.email?.toLowerCase();
      if (!email) {
        setIsAuthorized(null);
        setLoading(false);
        return;
      }

      if (options?.preferCacheOnly) {
        const cached = readAuthCache(email);
        if (cached !== null) {
          setIsAuthorized(cached);
          setLoading(false);
          return;
        }
      }

      const authorized = await checkAuthorization(email);
      setIsAuthorized(authorized);
      setLoading(false);
    },
    [checkAuthorization]
  );

  useEffect(() => {
    let isMounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, nextSession) => {
        if (!isMounted) return;

        await resolveSessionAccess(nextSession, {
          preferCacheOnly: event === "TOKEN_REFRESHED",
        });
      }
    );

    supabase.auth.getSession().then(async ({ data: { session: currentSession } }) => {
      if (!isMounted) return;
      await resolveSessionAccess(currentSession, { preferCacheOnly: true });
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [resolveSessionAccess]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setIsAuthorized(null);
    sessionStorage.removeItem(AUTH_CACHE_KEY);
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
