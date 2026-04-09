import { NextRequest } from "next/server";
import { getSession } from "@/lib/session";
import { getAuthUrl } from "@/lib/tokens";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session.isAdmin) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || request.nextUrl.origin;
  const redirectUri = `${baseUrl}/api/auth/callback`;
  const authUrl = getAuthUrl(redirectUri);

  return Response.redirect(authUrl);
}
