/**
 * Utility to automatically guess a company logo URL based on company name.
 * Uses Clearbit Logo API with domain guessing.
 */

// Known Brazilian/international company domain mappings
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
  ânima: "animaeducacao.com.br",
  familhao: "familhao.com.br",
  familhão: "familhao.com.br",
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
  nubank: "nubank.com.br",
  itau: "itau.com.br",
  itaú: "itau.com.br",
  bradesco: "bradesco.com.br",
  magazine: "magazineluiza.com.br",
  magalu: "magazineluiza.com.br",
  mercadolivre: "mercadolivre.com.br",
  "mercado livre": "mercadolivre.com.br",
  amazon: "amazon.com",
  google: "google.com",
  microsoft: "microsoft.com",
  apple: "apple.com",
  meta: "meta.com",
  netflix: "netflix.com",
  uber: "uber.com",
  spotify: "spotify.com",
  airbnb: "airbnb.com",
  stripe: "stripe.com",
  slack: "slack.com",
  shopify: "shopify.com",
  salesforce: "salesforce.com",
  hubspot: "hubspot.com",
  totvs: "totvs.com",
  vtex: "vtex.com",
  stone: "stone.co",
  pagseguro: "pagseguro.uol.com.br",
  cielo: "cielo.com.br",
  localiza: "localiza.com",
  ambev: "ambev.com.br",
  vale: "vale.com",
  petrobras: "petrobras.com.br",
  embraer: "embraer.com",
  jbs: "jbs.com.br",
  natura: "natura.com.br",
  renner: "lojasrenner.com.br",
  americanas: "americanas.com.br",
  globo: "globo.com",
};

/**
 * Normalize company name for lookup.
 */
function normalize(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/['']/g, "'")
    .trim();
}

/**
 * Try to guess the domain from a company name.
 */
function guessDomain(companyName: string): string | null {
  const norm = normalize(companyName);

  // Direct match
  if (KNOWN_DOMAINS[norm]) return KNOWN_DOMAINS[norm];

  // Partial match: check if any known key is contained in the name
  for (const [key, domain] of Object.entries(KNOWN_DOMAINS)) {
    if (norm.includes(key) || key.includes(norm)) {
      return domain;
    }
  }

  // Fallback: generate a plausible domain from the company name
  const slug = norm
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "")
    .slice(0, 30);

  if (slug.length >= 2) {
    return `${slug}.com`;
  }

  return null;
}

/**
 * Get a Clearbit logo URL for a company name.
 * Returns null if domain cannot be guessed.
 */
export function getAutoLogoUrl(companyName: string): string | null {
  if (!companyName || companyName.trim().length === 0) return null;
  const domain = guessDomain(companyName);
  if (!domain) return null;
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
}

/**
 * Check if a logo URL is reachable (image loads successfully).
 * Used to validate auto-fetched logos.
 */
export function validateLogoUrl(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = url;
    // Timeout after 4 seconds
    setTimeout(() => resolve(false), 4000);
  });
}
