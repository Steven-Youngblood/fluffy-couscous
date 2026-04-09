import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { deleteCalendarEvent } from "@/lib/graph";
import { sendCancellationNotification } from "@/lib/email";

// GET: Fetch booking details by cancellation key
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ cancellationKey: string }> }
) {
  const { cancellationKey } = await params;

  const booking = await prisma.booking.findUnique({
    where: { cancellationKey },
  });

  if (!booking) {
    return Response.json({ error: "Booking not found" }, { status: 404 });
  }

  // Look up meeting type name
  const meetingType = await prisma.meetingType.findUnique({
    where: { slug: booking.meetingType },
  });

  return Response.json({
    id: booking.id,
    meetingType: booking.meetingType,
    meetingTypeName: meetingType?.name || booking.meetingType,
    startTime: booking.startTime.toISOString(),
    endTime: booking.endTime.toISOString(),
    bookerName: booking.bookerName,
    status: booking.status,
  });
}

// DELETE: Cancel a booking
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ cancellationKey: string }> }
) {
  const { cancellationKey } = await params;

  const booking = await prisma.booking.findUnique({
    where: { cancellationKey },
  });

  if (!booking) {
    return Response.json({ error: "Booking not found" }, { status: 404 });
  }

  if (booking.status === "cancelled") {
    return Response.json({ error: "Booking already cancelled" }, { status: 400 });
  }

  // Delete from Outlook calendar
  if (booking.graphEventId) {
    try {
      await deleteCalendarEvent(booking.graphEventId);
    } catch (error) {
      console.error("Failed to delete calendar event:", error);
    }
  }

  // Update booking status
  await prisma.booking.update({
    where: { cancellationKey },
    data: { status: "cancelled" },
  });

  // Look up meeting type name for the email
  const meetingType = await prisma.meetingType.findUnique({
    where: { slug: booking.meetingType },
  });

  // Send cancellation emails
  try {
    await sendCancellationNotification({
      bookerName: booking.bookerName,
      bookerEmail: booking.bookerEmail,
      meetingTypeName: meetingType?.name || booking.meetingType,
      startTime: booking.startTime,
    });
  } catch (emailError) {
    console.error("Failed to send cancellation email:", emailError);
  }

  return Response.json({ success: true });
}
