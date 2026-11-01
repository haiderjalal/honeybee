import type { Metadata } from "next";

import { Bee } from "@/components/art/Bee";
import { Container } from "@/components/layout/Container";
import { ButtonLink } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false },
};

export default function NotFound() {
  return (
    <Container className="flex min-h-[80svh] flex-col items-center justify-center gap-6 pt-24 text-center">
      <div className="float-bob w-24" aria-hidden="true">
        <Bee className="w-full" />
      </div>
      <p className="font-display text-8xl text-amber-800">404</p>
      <h1 className="font-display text-4xl text-forest-950">This bee flew off course</h1>
      <p className="max-w-md text-forest-900/85">
        The page you&apos;re looking for doesn&apos;t exist. Let&apos;s get you back to the hive.
      </p>
      <ButtonLink href="/">Back to the hive</ButtonLink>
    </Container>
  );
}
