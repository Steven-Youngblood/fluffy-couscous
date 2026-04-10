import { ConfidentialClientApplication } from "@azure/msal-node";
import { prisma } from "./db";
import { encrypt, decrypt } from "./encryption";

const SCOPES = ["Calendars.Read", "Calendars.ReadWrite", "User.Read"];

function getMsalClient(): ConfidentialClientApplication {
  return new ConfidentialClientApplication({
    auth: {
      clientId: process.env.AZURE_CLIENT_ID!,
      clientSecret: process.env.AZURE_CLIENT_SECRET!,
      authority: `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}`,
    },
  });
}

/**
 * Extract refresh token from MSAL's internal token cache.
 * MSAL Node doesn't expose it on the AuthenticationResult — it's only in the cache.
 * On serverless (Vercel), the in-memory cache is lost between invocations,
 * so we must extract and persist it ourselves.
 */
function extractRefreshToken(client: ConfidentialClientApplication): string {
  const cache = JSON.parse(client.getTokenCache().serialize());
  const refreshTokens = cache.RefreshToken;
  if (!refreshTokens) return "";
  const firstKey = Object.keys(refreshTokens)[0];
  return firstKey ? (refreshTokens[firstKey].secret ?? "") : "";
}

export function getAuthUrl(redirectUri: string): string {
  const params = new URLSearchParams({
    client_id: process.env.AZURE_CLIENT_ID!,
    response_type: "code",
    redirect_uri: redirectUri,
    scope: ["offline_access", ...SCOPES].join(" "),
    response_mode: "query",
  });
  return `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}/oauth2/v2.0/authorize?${params}`;
}

export async function exchangeCodeForTokens(
  code: string,
  redirectUri: string
) {
  const client = getMsalClient();
  const result = await client.acquireTokenByCode({
    code,
    scopes: SCOPES,
    redirectUri,
  });

  if (!result) throw new Error("Failed to acquire tokens");

  const refreshToken = extractRefreshToken(client);

  // Store encrypted tokens
  await prisma.authToken.upsert({
    where: { id: "primary" },
    create: {
      id: "primary",
      accessToken: encrypt(result.accessToken),
      refreshToken: encrypt(refreshToken),
      expiresAt: result.expiresOn ?? new Date(Date.now() + 3600 * 1000),
    },
    update: {
      accessToken: encrypt(result.accessToken),
      refreshToken: encrypt(refreshToken),
      expiresAt: result.expiresOn ?? new Date(Date.now() + 3600 * 1000),
    },
  });

  return result;
}

export async function getAccessToken(): Promise<string> {
  const stored = await prisma.authToken.findUnique({
    where: { id: "primary" },
  });

  if (!stored) {
    throw new Error("No auth token found. Please connect your calendar first.");
  }

  // If token is still valid (with 5-min buffer), return it
  if (stored.expiresAt > new Date(Date.now() + 5 * 60 * 1000)) {
    return decrypt(stored.accessToken);
  }

  // Refresh the token
  const client = getMsalClient();
  const refreshToken = decrypt(stored.refreshToken);

  const result = await client.acquireTokenByRefreshToken({
    refreshToken,
    scopes: SCOPES,
  });

  if (!result) throw new Error("Failed to refresh token");

  // Extract new refresh token from cache (Microsoft may rotate it)
  const newRefreshToken = extractRefreshToken(client) || refreshToken;

  await prisma.authToken.update({
    where: { id: "primary" },
    data: {
      accessToken: encrypt(result.accessToken),
      refreshToken: encrypt(newRefreshToken),
      expiresAt: result.expiresOn ?? new Date(Date.now() + 3600 * 1000),
    },
  });

  return result.accessToken;
}

export async function isCalendarConnected(): Promise<boolean> {
  try {
    const stored = await prisma.authToken.findUnique({
      where: { id: "primary" },
    });
    return !!stored;
  } catch {
    return false;
  }
}

export async function disconnectCalendar(): Promise<void> {
  await prisma.authToken.deleteMany();
}
