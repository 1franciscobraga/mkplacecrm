import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const KNOWN_DOMAINS: Record<string, string> = {
  picpay: "picpay.com",
  ifood: "ifood.com.br",
  b3: "b3.com.br",
  allu: "allu.com.br",
  submarino: "submarino.com.br",
  broadcast: "broadcast.com.br",
  mevo: "mevo.com.br",
  amc: "amcnetworks.com",
  "tp-link": "tp-link.com",
  "tp link": "tp-link.com",
  tplink: "tp-link.com",
  anima: "animaeducacao.com.br",
  "ânima": "animaeducacao.com.br",
  familhao: "familhao.com.br",
  "familhão": "familhao.com.br",
  yape: "yape.com.pe",
  btg: "btgpactual.com",
  "btg pactual": "btgpactual.com",
  xp: "xpi.com.br",
  "xp inc": "xpi.com.br",
  santander: "santander.com.br",
  trademaster: "trademaster.com.br",
  ume: "ume.com.br",
  "delly's": "dfranciscausa.com",
  dellys: "dfranciscausa.com",
};

const GOOGLE_GENERIC_HASHES = new Set([
  "59bfe9bc385ad69f8524efc8f56fbd3d64ef98ea0aa6f7c5e3f9f83e6e603e6f",
]);

class AiGatewayHttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "AiGatewayHttpError";
  }
}

function normalize(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[']/g, "'")
    .trim();
}

function getKnownDomain(companyName: string): string | null {
  const normalized = normalize(companyName);
  return KNOWN_DOMAINS[normalized] || null;
}

function sanitizeDomain(raw: string): string | null {
  const clean = raw
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .replace(/["'`]/g, "")
    .replace(/\/$/, "")
    .trim()
    .toLowerCase();

  if (!/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(clean)) return null;
  if (clean.includes(" ")) return null;
  return clean;
}

async function sha256Hex(buffer: ArrayBuffer): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function callAiGateway(
  LOVABLE_API_KEY: string,
  messages: { role: string; content: string }[],
): Promise<string> {
  const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash-lite",
      messages,
      temperature: 0,
    }),
  });

  if (!aiResponse.ok) {
    throw new AiGatewayHttpError(aiResponse.status, `AI gateway error: ${aiResponse.status}`);
  }

  const aiData = await aiResponse.json();
  return aiData.choices?.[0]?.message?.content?.trim() || "";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { companyName } = await req.json();

    if (!companyName || typeof companyName !== "string" || companyName.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "companyName is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    let cleanDomain = getKnownDomain(companyName);

    if (!cleanDomain) {
      const domain = await callAiGateway(LOVABLE_API_KEY, [
        {
          role: "system",
          content: `You are a company domain resolver. Given a company name, return ONLY the official primary website domain for that exact company.
Return only the domain string (example: "ifood.com.br"). No protocol, no www, no quotes.
If you are not confident, return "UNKNOWN".`,
        },
        {
          role: "user",
          content: `Company: "${companyName.trim()}". What is its official domain?`,
        },
      ]);

      if (!domain || domain.toUpperCase() === "UNKNOWN") {
        return new Response(
          JSON.stringify({ logoUrl: null, domain: null, reason: "Could not determine company domain" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      cleanDomain = sanitizeDomain(domain);
      if (!cleanDomain) {
        return new Response(
          JSON.stringify({ logoUrl: null, domain: null, reason: "Invalid domain format" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const matchVerdict = await callAiGateway(LOVABLE_API_KEY, [
        {
          role: "system",
          content: `You validate company-to-domain matches.
Return only YES or NO.
YES only when the domain clearly belongs to the exact company name, not parent/sister/related brands.
If uncertain, return NO.`,
        },
        {
          role: "user",
          content: `Company: "${companyName.trim()}"\nDomain: "${cleanDomain}"\nIs this the exact company's official domain?`,
        },
      ]);

      if (matchVerdict.trim().toUpperCase() !== "YES") {
        return new Response(
          JSON.stringify({ logoUrl: null, domain: null, reason: "Ambiguous domain match" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    if (!cleanDomain) {
      return new Response(
        JSON.stringify({ logoUrl: null, domain: null, reason: "Could not determine company domain" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 2: Use Google Favicon API and reject known generic placeholders
    const googleFaviconUrl = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(cleanDomain)}&sz=128`;

    try {
      const faviconCheck = await fetch(googleFaviconUrl, { method: "GET" });
      if (faviconCheck.ok && faviconCheck.status === 200) {
        const body = await faviconCheck.arrayBuffer();
        const hash = await sha256Hex(body);
        if (GOOGLE_GENERIC_HASHES.has(hash)) {
          return new Response(
            JSON.stringify({ logoUrl: null, domain: cleanDomain, reason: "Generic placeholder icon" }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({ logoUrl: googleFaviconUrl, domain: cleanDomain }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } catch (e) {
      console.log("Google favicon check failed:", e);
    }

    // Nothing confidently valid found
    return new Response(
      JSON.stringify({ logoUrl: null, domain: cleanDomain, reason: "No valid logo found for domain" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    if (e instanceof AiGatewayHttpError) {
      if (e.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (e.status === 402) {
        return new Response(
          JSON.stringify({ error: "Credits exhausted. Please add credits to your workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    console.error("fetch-company-logo error:", e);
    const message = e instanceof Error ? e.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
