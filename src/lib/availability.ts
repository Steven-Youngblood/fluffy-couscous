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
  // Parse date components directly — no timezone conversion needed
  // because dateStr IS the NZ calendar date (e.g. "2026-04-10" = Friday)
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day).getDay();
}

function parseTimeInDate(dateStr: string, time: string): Date {
  // Convert a NZ date + time (e.g. "2026-04-10" + "09:00") to a UTC Date.
  // We find the NZ→UTC offset by comparing a known UTC instant with its NZ representation.
  const [hours, minutes] = time.split(":").map(Number);

  // Use a reference point at midnight UTC on this date
  const refUtc = new Date(`${dateStr}T00:00:00Z`);

  // Format that UTC instant in NZ timezone to find the offset
  const nzParts = new Intl.DateTimeFormat("en-US", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(refUtc);

  const get = (type: string) => parseInt(nzParts.find((p) => p.type === type)?.value ?? "0");
  // What NZ shows when it's midnight UTC
  const nzAtRefMs = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  // Offset = NZ time - UTC time (positive means NZ is ahead)
  const offsetMs = nzAtRefMs - refUtc.getTime();

  // The desired NZ time as a UTC timestamp, then subtract the offset to get actual UTC
  const nzTargetMs = Date.UTC(
    parseInt(dateStr.slice(0, 4)),
    parseInt(dateStr.slice(5, 7)) - 1,
    parseInt(dateStr.slice(8, 10)),
    hours,
    minutes
  );

  return new Date(nzTargetMs - offsetMs);
}
