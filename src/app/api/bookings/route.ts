import { NextRequest } from "next/server";
import { z } from "zod/v4";
import { prisma } from "@/lib/db";
import { createCalendarEvent } from "@/lib/graph";
import { sendBookingConfirmation } from "@/lib/email";
import { TIMEZONE } from "@/config/business-hours";
import { getAvailableSlots } from "@/lib/availability";
import { rateLimit } from "@/lib/rate-limit";

const BookingSchema = z.object({
  meetingTypeSlug: z.string().min(1),
  startTime: z.iso.datetime(),
  bookerName: z.string().min(1).max(200),
  bookerEmail: z.email(),
  notes: z.string().max(1000).optional(),
});

export async function POST(request: NextRequest) {
  // Rate limiting
  const ip = request.headers.get("x-forwarded-for") || "unknown";
  const { allowed } = rateLimit(ip, 10);
  if (!allowed) {
    return Response.json(
      { error: "Too many booking attempts. Please try again later." },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = BookingSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid input", details: parsed.error.issues },
      { status: 400 }
    );
  }

  const { meetingTypeSlug, startTime, bookerName, bookerEmail, notes } =
    parsed.data;

  try {
    // Look up meeting type
    const meetingType = await prisma.meetingType.findUnique({
      where: { slug: meetingTypeSlug },
    });

    if (!meetingType || !meetingType.isActive) {
      return Response.json(
        { error: "Meeting type not found" },
        { status: 404 }
      );
    }

    const start = new Date(startTime);
    const end = new Date(start.getTime() + meetingType.durationMin * 60 * 1000);

    // Race-condition guard: re-check availability
    const dateStr = startTime.split("T")[0];
    const availableSlots = await getAvailableSlots(
      dateStr,
      meetingType.durationMin
    );
    const isStillAvailable = availableSlots.some(
      (slot) => new Date(slot.start).getTime() === start.getTime()
    );

    if (!isStillAvailable) {
      return Response.json(
        { error: "This time slot is no longer available. Please choose another time." },
        { status: 409 }
      );
    }

    // Create calendar event in Outlook
    const startLocal = start.toLocaleString("sv-SE", { timeZone: TIMEZONE }).replace(" ", "T");
    const endLocal = end.toLocaleString("sv-SE", { timeZone: TIMEZONE }).replace(" ", "T");

    const graphEvent = await createCalendarEvent({
      subject: `${meetingType.name} — ${bookerName}`,
      startDateTime: startLocal,
      endDateTime: endLocal,
      timezone: TIMEZONE,
      attendeeEmail: bookerEmail,
      attendeeName: bookerName,
      body: notes
        ? `<p><strong>Notes from ${bookerName}:</strong></p><p>${notes}</p>`
        : undefined,
    });

    // Store booking in database
    const booking = await prisma.booking.create({
      data: {
        meetingType: meetingTypeSlug,
        startTime: start,
        endTime: end,
        bookerName,
        bookerEmail,
        notes: notes || null,
        graphEventId: graphEvent.id,
      },
    });

    // Send confirmation emails (don't fail the booking if email fails)
    try {
      await sendBookingConfirmation({
        bookerName,
        bookerEmail,
        meetingTypeName: meetingType.name,
        startTime: start,
        endTime: end,
        notes,
        cancellationKey: booking.cancellationKey,
        teamsLink: graphEvent.teamsLink,
      });
    } catch (emailError) {
      console.error("Failed to send confirmation email:", emailError);
    }

    return Response.json({
      success: true,
      bookingId: booking.id,
      cancellationKey: booking.cancellationKey,
    });
  } catch (error) {
    console.error("Booking error:", error);
    return Response.json(
      { error: "Failed to create booking. Please try again." },
      { status: 500 }
    );
  }
}
