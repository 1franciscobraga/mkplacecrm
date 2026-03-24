import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const AUTHORIZED_STATUSES = ["active", "invited"];

const isAllowedRedirect = (value: string) => {
  try {
    const url = new URL(value);
    const host = url.hostname;

    return (
      host === "localhost" ||
      host.endsWith(".lovable.app") ||
      host.endsWith(".lovableproject.com")
    );
  } catch {
    return false;
  }
};

const resolveRedirectTo = (req: Request, redirectTo?: string) => {
  const candidates = [redirectTo, req.headers.get("origin"), "https://vladcrm.lovable.app"];

  for (const candidate of candidates) {
    if (!candidate || typeof candidate !== "string") continue;
    if (!isAllowedRedirect(candidate)) continue;
    return new URL(candidate).origin;
  }

  return "https://vladcrm.lovable.app";
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload = await req.json().catch(() => ({}));
    const email = typeof payload?.email === "string" ? payload.email : "";
    const action = payload?.action === "request" ? "request" : "login";
    const redirectTo = typeof payload?.redirectTo === "string" ? payload.redirectTo : undefined;

    if (!email || typeof email !== "string") {
      return new Response(
        JSON.stringify({ error: "email is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!["login", "request"].includes(action)) {
      return new Response(
        JSON.stringify({ error: "invalid action" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const normalizedEmail = email.toLowerCase().trim();

    const { data: existingRows, error: lookupError } = await supabase
      .from("authorized_emails")
      .select("id, status")
      .eq("email", normalizedEmail)
      .order("created_at", { ascending: false })
      .limit(1);

    if (lookupError) {
      console.error("Whitelist lookup error:", lookupError);
      return new Response(
        JSON.stringify({ error: lookupError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const existing = existingRows?.[0] ?? null;
    const isAuthorized = !!existing && AUTHORIZED_STATUSES.includes(existing.status);

    if (action === "request") {
      if (isAuthorized) {
        return new Response(
          JSON.stringify({ success: true, result: "already_authorized" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (existing?.status === "requested") {
        return new Response(
          JSON.stringify({ success: true, result: "already_requested" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (existing) {
        const { error: updateError } = await supabase
          .from("authorized_emails")
          .update({ status: "requested", added_by: "request", invited_at: null })
          .eq("id", existing.id);

        if (updateError) {
          console.error("Request update error:", updateError);
          return new Response(
            JSON.stringify({ error: updateError.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      } else {
        const { error: insertError } = await supabase
          .from("authorized_emails")
          .insert({ email: normalizedEmail, status: "requested", added_by: "request" });

        if (insertError) {
          console.error("Request insert error:", insertError);
          return new Response(
            JSON.stringify({ error: insertError.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }

      return new Response(
        JSON.stringify({ success: true, result: "requested" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!isAuthorized) {
      return new Response(
        JSON.stringify({ error: "Email não autorizado. Solicite liberação no admin." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const safeRedirectTo = resolveRedirectTo(req, redirectTo);

    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: normalizedEmail,
      options: {
        emailRedirectTo: safeRedirectTo,
        shouldCreateUser: true,
      },
    });

    if (otpError) {
      console.error("Magic link error:", otpError);
      return new Response(
        JSON.stringify({ error: otpError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    await supabase
      .from("authorized_emails")
      .update({ status: "invited", invited_at: new Date().toISOString() })
      .eq("email", normalizedEmail)
      .in("status", AUTHORIZED_STATUSES);

    return new Response(
      JSON.stringify({ success: true, result: "link_sent" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("invite-user error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
