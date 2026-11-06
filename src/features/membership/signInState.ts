/** State returned by the email sign-in form. Kept out of the "use server" module, which may export only async actions. */
export type SignInState =
  { status: "idle"; message: "" } | { status: "sent"; message: string } | { status: "error"; message: string };
