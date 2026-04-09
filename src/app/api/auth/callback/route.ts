import { NextRequest } from "next/server";
import { getSession } from "@/lib/session";
import { exchangeCodeForTokens } from "@/lib/tokens";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session.isAdmin) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const code = request.nextUrl.searchParams.get("code");
  const error = request.nextUrl.searchParams.get("error");

  if (error) {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || request.nextUrl.origin;
    return Response.redirect(
      `${baseUrl}/admin?error=${encodeURIComponent(error)}`
    );
  }

  if (!code) {
    return Response.json({ error: "No authorization code" }, { status: 400 });
  }

  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || request.nextUrl.origin;
    const redirectUri = `${baseUrl}/api/auth/callback`;
    await exchangeCodeForTokens(code, redirectUri);
    return Response.redirect(`${baseUrl}/admin?connected=true`);
  } catch (err) {
    console.error("OAuth callback error:", err);
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || request.nextUrl.origin;
    return Response.redirect(
      `${baseUrl}/admin?error=${encodeURIComponent("Failed to connect calendar")}`
    );
  }
}
