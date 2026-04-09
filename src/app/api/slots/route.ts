import { NextRequest } from "next/server";
import { getAvailableSlots } from "@/lib/availability";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const type = searchParams.get("type");
  const date = searchParams.get("date");

  if (!type || !date) {
    return Response.json(
      { error: "Missing required parameters: type, date" },
      { status: 400 }
    );
  }

  // Validate date format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return Response.json(
      { error: "Invalid date format. Use YYYY-MM-DD" },
      { status: 400 }
    );
  }

  try {
    // Look up meeting type
    const meetingType = await prisma.meetingType.findUnique({
      where: { slug: type },
    });

    if (!meetingType || !meetingType.isActive) {
      return Response.json(
        { error: "Meeting type not found" },
        { status: 404 }
      );
    }

    const slots = await getAvailableSlots(date, meetingType.durationMin);

    return Response.json({ slots, duration: meetingType.durationMin });
  } catch (error) {
    console.error("Error fetching slots:", error);
    return Response.json(
      { error: "Failed to fetch available slots" },
      { status: 500 }
    );
  }
}
