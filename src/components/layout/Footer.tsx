import Link from "next/link";

import { NAV_LINKS, ROUTES } from "@/constants/routes";
import { SITE, whatsappUrl } from "@/constants/site";
import { getVarieties } from "@/services/catalog.service";

import { DripEdge } from "@/components/art/DripEdge";

import { Container } from "./Container";
import { Logo } from "./Logo";

export function Footer() {
  const whatsapp = whatsappUrl("Hi HonyB, I have a question about your honey.");

  return (
    <footer className="relative mt-24 border-t border-gold-400/15 bg-forest-950">
      <DripEdge />
      <Container className="grid gap-12 py-16 md:grid-cols-[1.4fr_1fr_1fr]">
        <div className="space-y-4">
          <Logo />
          <p className="max-w-sm text-cream-300">{SITE.description}</p>
        </div>

        <nav aria-label="Honey varieties">
          <h2 className="mb-4 text-xs font-semibold tracking-[0.25em] text-gold-400 uppercase">Our honey</h2>
          <ul className="space-y-2">
            {getVarieties().map((variety) => (
              <li key={variety.slug}>
                <Link href={ROUTES.variety(variety.slug)} className="text-cream-300 hover:text-gold-300">
                  {variety.name} ({variety.localName})
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Footer">
          <h2 className="mb-4 text-xs font-semibold tracking-[0.25em] text-gold-400 uppercase">Explore</h2>
          <ul className="space-y-2">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-cream-300 hover:text-gold-300">
                  {link.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href={ROUTES.checkout} className="text-cream-300 hover:text-gold-300">
                Send an order request
              </Link>
            </li>
            {whatsapp ? (
              <li>
                <a
                  href={whatsapp}
                  className="text-cream-300 hover:text-gold-300"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  Chat on WhatsApp
                </a>
              </li>
            ) : null}
          </ul>
        </nav>
      </Container>
      <Container className="flex flex-col gap-2 border-t border-cream-50/5 py-6 text-sm text-cream-500 sm:flex-row sm:justify-between">
        <p>
          © {SITE.legalName}. Delivered across {SITE.country}.
        </p>
        <p>Prices in Pakistani rupees (PKR).</p>
      </Container>
    </footer>
  );
}
