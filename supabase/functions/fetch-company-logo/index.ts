import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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

    // Step 1: Use AI to find the company's real website domain
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          {
            role: "system",
            content: `You are a company domain resolver. Given a company name, return ONLY the company's official website domain (e.g., "apple.com", "ifood.com.br", "btgpactual.com"). 
Return ONLY the domain string, nothing else. No explanation, no protocol, no quotes, no www prefix.
If it's a Brazilian company, prefer .com.br domains when applicable.
If you cannot determine the domain with confidence, return "UNKNOWN".`,
          },
          {
            role: "user",
            content: `What is the official website domain for the company: "${companyName.trim()}"?`,
          },
        ],
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "Credits exhausted. Please add credits to your workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      console.error("AI gateway error:", aiResponse.status);
      throw new Error(`AI gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const domain = aiData.choices?.[0]?.message?.content?.trim();

    if (!domain || domain === "UNKNOWN" || domain.includes(" ")) {
      return new Response(
        JSON.stringify({ logoUrl: null, domain: null, reason: "Could not determine company domain" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Clean domain
    const cleanDomain = domain
      .replace(/^https?:\/\//, "")
      .replace(/^www\./, "")
      .replace(/['"]/g, "")
      .replace(/\/$/, "")
      .trim();

    // Step 2: Use Google Favicon API (reliable, returns real favicons at 128px)
    const googleFaviconUrl = `https://www.google.com/s2/favicons?domain=${cleanDomain}&sz=128`;

    try {
      const faviconCheck = await fetch(googleFaviconUrl, { method: "GET" });
      if (faviconCheck.ok && faviconCheck.status === 200) {
        // Check content length - the default "globe" icon for unknown domains is ~726 bytes
        const body = await faviconCheck.arrayBuffer();
        if (body.byteLength > 750) {
          // Real favicon found
          return new Response(
            JSON.stringify({ logoUrl: googleFaviconUrl, domain: cleanDomain }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
    } catch (e) {
      console.log("Google favicon check failed:", e);
    }

    // Step 3: Fallback - try Clearbit
    const clearbitUrl = `https://logo.clearbit.com/${cleanDomain}`;
    try {
      const clearbitCheck = await fetch(clearbitUrl, { method: "HEAD" });
      if (clearbitCheck.ok) {
        return new Response(
          JSON.stringify({ logoUrl: clearbitUrl, domain: cleanDomain }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } catch (e) {
      console.log("Clearbit check failed:", e);
    }

    // Nothing valid found
    return new Response(
      JSON.stringify({ logoUrl: null, domain: cleanDomain, reason: "No valid logo found for domain" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("fetch-company-logo error:", e);
    const message = e instanceof Error ? e.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
