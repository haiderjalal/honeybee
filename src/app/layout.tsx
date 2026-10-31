import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";
import type { ReactNode } from "react";

import { AppProviders } from "@/components/layout/AppProviders";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { JsonLd } from "@/components/shared/JsonLd";
import { SITE } from "@/constants/site";
import { CartAnnouncer } from "@/features/cart/components/CartAnnouncer";
import { CartDrawer } from "@/features/cart/components/CartDrawer";
import { CartHive } from "@/features/cart/components/CartHive";
import { INTRO_GATE_SCRIPT } from "@/features/intro/introState";
import { organizationJsonLd, websiteJsonLd } from "@/lib/seo/jsonLd";

import "./globals.css";

const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces", display: "swap" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name} — Raw Sidr, Acacia & Wildflower Honey in Pakistan`,
    template: `%s | ${SITE.name}`,
  },
  description: SITE.description,
  applicationName: SITE.name,
  keywords: [
    "raw honey Pakistan",
    "Sidr honey",
    "Beri honey",
    "Acacia honey",
    "Phulai honey",
    "Wildflower honey",
    "buy honey online Pakistan",
    "honey 1 kg price",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: SITE.name,
    locale: SITE.locale,
    url: "/",
    title: `${SITE.name} — Raw honey, poured to order`,
    description: SITE.description,
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE.name} — Raw honey, poured to order`,
    description: SITE.description,
  },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large" } },
  category: "food",
};

export const viewport: Viewport = {
  themeColor: "#0c0804",
  colorScheme: "dark",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en-PK" className={`${fraunces.variable} ${inter.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: INTRO_GATE_SCRIPT }} />
      </head>
      <body className="min-h-dvh">
        <a
          href="#main"
          className="fixed top-3 left-3 z-[200] -translate-y-24 rounded-full bg-gold-400 px-4 py-2 font-medium text-ink-950 focus-visible:translate-y-0"
        >
          Skip to content
        </a>
        <AppProviders>
          <Navbar />
          <main id="main">{children}</main>
          <Footer />
          <CartHive />
          <CartDrawer />
          <CartAnnouncer />
        </AppProviders>
        <JsonLd data={[organizationJsonLd(), websiteJsonLd()]} />
      </body>
    </html>
  );
}
