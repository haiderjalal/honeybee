import Link from "next/link";
import type { JSX } from "react";

const SECTION_LINKS = [
  { href: "#pending", label: "Pending payments" },
  { href: "#members", label: "Members" },
  { href: "#orders", label: "Orders" },
  { href: "#reporting", label: "Reporting" },
] as const;

export function AdminSectionNav(): JSX.Element {
  return (
    <nav aria-label="Membership admin sections">
      <ul className="flex flex-wrap gap-2">
        {SECTION_LINKS.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="inline-flex min-h-10 items-center rounded-full border border-cream-50/15 px-4 text-sm text-cream-100 transition-colors hover:border-gold-300 hover:text-gold-300"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
