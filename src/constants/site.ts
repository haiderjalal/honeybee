export const SITE = {
  name: "Honeybee",
  legalName: "Honeybee",
  tagline: "Raw honey, poured to order",
  description:
    "Honeybee delivers raw Sidr, Acacia and Wildflower honey across Pakistan in 500 g, 1 kg and 2 kg jars. Pick your honey, drop jars in your hive and send an order request — we confirm by phone and deliver to your door.",
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, ""),
  locale: "en_PK",
  country: "Pakistan",
  currency: "PKR",
  whatsappNumber: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "",
} as const;

export function absoluteUrl(path = "/"): string {
  return `${SITE.url}${path.startsWith("/") ? path : `/${path}`}`;
}

export function whatsappUrl(message: string): string | null {
  const digits = SITE.whatsappNumber.replace(/\D/g, "");
  if (!digits) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
