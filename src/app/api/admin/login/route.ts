import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { getSession } from "@/lib/session";

export async function POST(request: NextRequest) {
  const { password } = await request.json();

  const hash = process.env.ADMIN_PASSWORD_HASH;
  if (!hash) {
    return Response.json(
      { error: "Admin password not configured" },
      { status: 500 }
    );
  }

  const valid = await bcrypt.compare(password, hash);
  if (!valid) {
    return Response.json({ error: "Invalid password" }, { status: 401 });
  }

  const session = await getSession();
  session.isAdmin = true;
  await session.save();

  return Response.json({ success: true });
}
