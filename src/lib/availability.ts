import {
  WORKING_HOURS,
  TIMEZONE,
  BUFFER_MINUTES,
  MAX_ADVANCE_DAYS,
  MIN_NOTICE_HOURS,
} from "@/config/business-hours";
import { getFreeBusy, type FreeBusyBlock } from "./graph";
import { prisma } from "./db";

export interface TimeSlot {
  start: string; // ISO string in TIMEZONE
  end: string;
}

/**
 * Generate available time slots for a given date and meeting duration.
 */
export async function getAvailableSlots(
  dateStr: string, // YYYY-MM-DD
  durationMin: number
): Promise<TimeSlot[]> {
  // Parse date in NZ timezone
  const dayStart = new Date(
    new Date(`${dateStr}T00:00:00`).toLocaleString("en-US", {
      timeZone: TIMEZONE,
    })
  );

  const dayOfWeek = getDayOfWeek(dateStr);
  const hours = WORKING_HOURS[dayOfWeek];
  if (!hours) return []; // Not a working day

  // Check date is within booking window
  const now = new Date();
  const maxDate = new Date(now.getTime() + MAX_ADVANCE_DAYS * 24 * 60 * 60 * 1000);
  const minDate = new Date(now.getTime() + MIN_NOTICE_HOURS * 60 * 60 * 1000);

  if (dayStart > maxDate) return [];

  // Build working hours boundaries for this date
  const workStart = parseTimeInDate(dateStr, hours.start);
  const workEnd = parseTimeInDate(dateStr, hours.end);

  // Fetch busy blocks from Outlook
  const busyBlocks = await getFreeBusy(
    `${dateStr}T${hours.start}:00`,
    `${dateStr}T${hours.end}:00`,
    TIMEZONE
  );

  // Also fetch existing bookings from our DB (in case of race conditions or manual events)
  const dbBookings = await prisma.booking.findMany({
    where: {
      status: "confirmed",
      startTime: { gte: workStart },
      endTime: { lte: workEnd },
    },
    select: { startTime: true, endTime: true },
  });

  // Merge all busy periods (Graph + DB bookings) with buffer
  const busyPeriods = [
    ...busyBlocks.map((b) => ({
      start: new Date(b.start).getTime() - BUFFER_MINUTES * 60 * 1000,
      end: new Date(b.end).getTime() + BUFFER_MINUTES * 60 * 1000,
    })),
    ...dbBookings.map((b: { startTime: Date; endTime: Date }) => ({
      start: b.startTime.getTime() - BUFFER_MINUTES * 60 * 1000,
      end: b.endTime.getTime() + BUFFER_MINUTES * 60 * 1000,
    })),
  ];

  // Generate slots at 15-minute intervals
  const slots: TimeSlot[] = [];
  const slotInterval = 15 * 60 * 1000;
  const durationMs = durationMin * 60 * 1000;

  let cursor = workStart.getTime();
  const endBoundary = workEnd.getTime();

  while (cursor + durationMs <= endBoundary) {
    const slotStart = cursor;
    const slotEnd = cursor + durationMs;

    // Check slot is in the future with minimum notice
    if (new Date(slotStart) > minDate) {
      // Check slot doesn't overlap with any busy period
      const isAvailable = !busyPeriods.some(
        (busy) => slotStart < busy.end && slotEnd > busy.start
      );

      if (isAvailable) {
        slots.push({
          start: new Date(slotStart).toISOString(),
          end: new Date(slotEnd).toISOString(),
        });
      }
    }

    cursor += slotInterval;
  }

  return slots;
}

function getDayOfWeek(dateStr: string): number {
  // Create date at noon to avoid timezone edge cases
  const d = new Date(`${dateStr}T12:00:00`);
  // Get the day in NZ timezone
  const nzDay = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    timeZone: TIMEZONE,
  }).format(d);
  const dayMap: Record<string, number> = {
    Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
  };
  return dayMap[nzDay] ?? 0;
}

function parseTimeInDate(dateStr: string, time: string): Date {
  // Create a date in NZ timezone
  const [hours, minutes] = time.split(":").map(Number);
  // Use a formatter to figure out the UTC offset for this date in NZST/NZDT
  const dateAtNoon = new Date(`${dateStr}T12:00:00Z`);
  const nzFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  // Get the NZ offset by comparing UTC noon with NZ noon
  const parts = nzFormatter.formatToParts(dateAtNoon);
  const getPart = (type: string) =>
    parts.find((p) => p.type === type)?.value ?? "0";
  const nzDate = new Date(
    `${getPart("year")}-${getPart("month")}-${getPart("day")}T${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00`
  );

  // Calculate offset: what UTC time corresponds to this NZ time?
  const utcAtNoon = dateAtNoon.getTime();
  const nzNoonStr = `${getPart("year")}-${getPart("month")}-${getPart("day")}T${getPart("hour")}:${getPart("minute")}:${getPart("second")}`;
  const nzNoonLocal = new Date(nzNoonStr).getTime();
  const offsetMs = utcAtNoon - nzNoonLocal;

  return new Date(nzDate.getTime() + offsetMs);
}
