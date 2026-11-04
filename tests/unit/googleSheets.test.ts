import { generateKeyPairSync, verify } from "node:crypto";
import { describe, expect, it, vi } from "vitest";

import { createAccessTokenProvider } from "@/lib/google/serviceAccount";
import { appendSheetRow } from "@/lib/google/sheets";

const { privateKey, publicKey } = generateKeyPairSync("rsa", {
  modulusLength: 2048,
  publicKeyEncoding: { type: "spki", format: "pem" },
  privateKeyEncoding: { type: "pkcs8", format: "pem" },
});
const credentials = { email: "orders@honyb-test.iam.gserviceaccount.com", privateKey };
const NOW_MS = 1_700_000_000_000;

/** Minimal stand-in for a fetch Response; only the fields the client reads. */
function fakeResponse(payload: unknown, status = 200): Response {
  return { ok: status >= 200 && status < 300, status, json: async () => payload } as unknown as Response;
}

describe("createAccessTokenProvider", () => {
  it("signs an assertion that verifies with the service account key", async () => {
    const fetcher = vi.fn<typeof fetch>(async () => fakeResponse({ access_token: "token-1", expires_in: 3600 }));
    const getAccessToken = createAccessTokenProvider(credentials, fetcher, () => NOW_MS);

    expect(await getAccessToken()).toBe("token-1");

    const init = fetcher.mock.calls[0][1] as RequestInit;
    const assertion = (init.body as URLSearchParams).get("assertion") ?? "";
    const [header, claims, signature] = assertion.split(".");
    const isValid = verify(
      "RSA-SHA256",
      Buffer.from(`${header}.${claims}`),
      publicKey,
      Buffer.from(signature, "base64url"),
    );
    expect(isValid).toBe(true);
    expect(JSON.parse(Buffer.from(claims, "base64url").toString())).toMatchObject({
      iss: credentials.email,
      scope: "https://www.googleapis.com/auth/spreadsheets",
    });
  });

  it("reuses the token until shortly before it expires", async () => {
    let clock = NOW_MS;
    const fetcher = vi.fn<typeof fetch>(async () => fakeResponse({ access_token: "token-1", expires_in: 3600 }));
    const getAccessToken = createAccessTokenProvider(credentials, fetcher, () => clock);

    await getAccessToken();
    await getAccessToken();
    expect(fetcher).toHaveBeenCalledTimes(1);

    clock += 3600 * 1000;
    await getAccessToken();
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
});

describe("appendSheetRow", () => {
  it("appends one row with raw values, so a formula typed by a customer is stored as text", async () => {
    const fetcher = vi.fn<typeof fetch>(async () => fakeResponse({}));
    await appendSheetRow({ sheetId: "sheet-123", tab: "Orders", getAccessToken: async () => "token-1", fetcher }, [
      '=HYPERLINK("x")',
      3499,
    ]);

    const [url, init] = fetcher.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/v4/spreadsheets/sheet-123/values/Orders!A1:append");
    expect(url).toContain("valueInputOption=RAW");
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer token-1");
    expect(JSON.parse(init.body as string)).toEqual({ values: [['=HYPERLINK("x")', 3499]] });
  });

  it("reports a rejected append so the caller can log it", async () => {
    const fetcher = vi.fn<typeof fetch>(async () => fakeResponse({}, 403));
    await expect(
      appendSheetRow({ sheetId: "sheet-123", tab: "Orders", getAccessToken: async () => "token-1", fetcher }, ["x"]),
    ).rejects.toThrow("HTTP 403");
  });
});
