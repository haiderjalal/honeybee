"use client";

import { useEffect } from "react";

import { Container } from "@/components/layout/Container";
import { Button, ButtonLink } from "@/components/ui/Button";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Only the digest is reported; it maps to the full server log without exposing details.
    console.error("Page error", error.digest ?? error.name);
  }, [error]);

  return (
    <Container className="flex min-h-[80svh] flex-col items-center justify-center gap-6 pt-24 text-center">
      <h1 className="font-display text-4xl text-forest-950">Something got sticky</h1>
      <p className="max-w-md text-forest-900/85">We hit an unexpected problem loading this page. Please try again.</p>
      <div className="flex gap-3">
        <Button onClick={reset}>Try again</Button>
        <ButtonLink href="/" variant="secondary">
          Back to the hive
        </ButtonLink>
      </div>
    </Container>
  );
}
