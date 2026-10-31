export const ROUTES = {
  home: "/",
  checkout: "/checkout",
  variety: (slug: string) => `/honey/${slug}`,
} as const;

export const SECTION_IDS = {
  pour: "pour",
  lab: "honey-lab",
  varieties: "varieties",
  process: "how-it-works",
  faq: "faq",
} as const;

export const NAV_LINKS = [
  { label: "Our honey", href: `/#${SECTION_IDS.varieties}` },
  { label: "Honey lab", href: `/#${SECTION_IDS.lab}` },
  { label: "How it works", href: `/#${SECTION_IDS.process}` },
  { label: "FAQ", href: `/#${SECTION_IDS.faq}` },
] as const;
