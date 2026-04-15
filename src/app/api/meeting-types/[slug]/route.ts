import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { DEFAULT_MEETING_TYPES } from "@/config/meeting-types";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  try {
    const mt = await prisma.meetingType.findUnique({ where: { slug } });
    if (!mt || !mt.isActive) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }
    return Response.json({
      name: mt.name,
      description: mt.description,
      durationMin: mt.durationMin,
      color: mt.color,
      allowInPerson: mt.allowInPerson,
    });
  } catch {
    // Fallback to defaults if DB not available
    const fallback = DEFAULT_MEETING_TYPES.find((m) => m.slug === slug);
    if (!fallback) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }
    return Response.json(fallback);
  }
}
