import Link from "next/link";
import { Menu } from "lucide-react";

import { CartNavButton } from "@/features/cart/components/CartNavButton";
import { NAV_LINKS, ROUTES } from "@/constants/routes";

import { Container } from "./Container";
import { Logo } from "./Logo";

export function Navbar() {
  return (
    <header className="fixed inset-x-0 top-0 z-30 border-b border-cream-50/5 bg-ink-950/70 backdrop-blur-xl">
      <Container className="flex h-18 items-center justify-between gap-6">
        <Link href={ROUTES.home} aria-label="Honeybee home" className="rounded-lg">
          <Logo />
        </Link>

        <nav aria-label="Main" className="hidden md:block">
          <ul className="flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="rounded-full px-4 py-2 text-sm text-cream-300 transition-colors hover:bg-cream-50/5 hover:text-gold-300"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <CartNavButton />
          <button
            type="button"
            popoverTarget="mobile-menu"
            aria-label="Open menu"
            className="grid size-11 place-items-center rounded-full text-cream-100 hover:bg-cream-50/5 md:hidden"
          >
            <Menu className="size-5" aria-hidden="true" />
          </button>
        </div>
      </Container>

      <nav
        id="mobile-menu"
        popover="auto"
        aria-label="Mobile"
        className="[inset:auto_1rem_auto_auto] m-0 mt-18 ml-auto w-[min(20rem,calc(100vw-2rem))] rounded-2xl border border-gold-400/20 bg-ink-900/95 p-3 text-cream-100 shadow-2xl backdrop-blur-xl md:hidden"
      >
        <ul className="flex flex-col">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="block rounded-xl px-4 py-3 text-base hover:bg-cream-50/5 hover:text-gold-300"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
