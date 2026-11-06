"use client";

import { LoaderCircle, Mail } from "lucide-react";
import { useActionState, useState } from "react";

import { Button } from "@/components/ui/Button";
import { InputField } from "@/components/ui/Field";
import { requestSignInLink } from "@/features/membership/authActions";
import type { SignInState } from "@/features/membership/signInState";

import { FormMessage } from "./FormMessage";

import type { ReactElement } from "react";

const INITIAL_SIGN_IN_STATE: SignInState = { status: "idle", message: "" };

/** Requests a one-time sign-in link. The typed email stays in the field when a request fails. */
export function SignInForm(): ReactElement {
  const [state, formAction, isPending] = useActionState(requestSignInLink, INITIAL_SIGN_IN_STATE);
  const [email, setEmail] = useState("");

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <InputField
        id="sign-in-email"
        name="email"
        label="Email address"
        type="email"
        autoComplete="email"
        required
        value={email}
        onChange={(event) => setEmail(event.target.value)}
      />

      <Button type="submit" size="lg" disabled={isPending}>
        {isPending ? (
          <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
        ) : (
          <Mail className="size-4" aria-hidden="true" />
        )}
        {isPending ? "Sending your link" : "Send sign-in link"}
      </Button>

      {state.status !== "idle" ? (
        <FormMessage tone={state.status === "sent" ? "success" : "error"} message={state.message} />
      ) : null}
    </form>
  );
}
