import "server-only";

import { createSign } from "node:crypto";

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const SHEETS_SCOPE = "https://www.googleapis.com/auth/spreadsheets";
const ASSERTION_LIFETIME_S = 60 * 60;
/** Refresh a little early so a token never expires while a request is using it. */
const REFRESH_MARGIN_MS = 60 * 1000;
const TOKEN_TIMEOUT_MS = 5000;

export interface ServiceAccountCredentials {
  email: string;
  /** PEM private key, with real newlines. */
  privateKey: string;
}

/**
 * Exchanges a signed service-account assertion for a short-lived access token. Signing uses
 * Node's crypto module, so no Google client library is needed. The token is cached until shortly
 * before it expires.
 */
export function createAccessTokenProvider(
  credentials: ServiceAccountCredentials,
  fetcher: typeof fetch = fetch,
  now: () => number = Date.now,
): () => Promise<string> {
  let cached: { token: string; expiresAt: number } | null = null;

  async function requestToken(): Promise<string> {
    const issuedAt = Math.floor(now() / 1000);
    const header = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64url");
    const claims = Buffer.from(
      JSON.stringify({
        iss: credentials.email,
        scope: SHEETS_SCOPE,
        aud: TOKEN_URL,
        iat: issuedAt,
        exp: issuedAt + ASSERTION_LIFETIME_S,
      }),
    ).toString("base64url");
    const unsigned = `${header}.${claims}`;
    const signature = createSign("RSA-SHA256").update(unsigned).sign(credentials.privateKey, "base64url");

    const response = await fetcher(TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion: `${unsigned}.${signature}`,
      }),
      signal: AbortSignal.timeout(TOKEN_TIMEOUT_MS),
    });
    if (!response.ok) throw new Error(`Google token request failed with HTTP ${response.status}`);

    const payload = (await response.json()) as { access_token?: unknown; expires_in?: unknown };
    if (typeof payload.access_token !== "string" || typeof payload.expires_in !== "number") {
      throw new Error("Google token response was not understood");
    }
    cached = { token: payload.access_token, expiresAt: now() + payload.expires_in * 1000 - REFRESH_MARGIN_MS };
    return payload.access_token;
  }

  return async function getAccessToken(): Promise<string> {
    if (cached && now() < cached.expiresAt) return cached.token;
    return requestToken();
  };
}
