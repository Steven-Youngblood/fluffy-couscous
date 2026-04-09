export const TIMEZONE = "Pacific/Auckland";

// Buffer time in minutes between meetings
export const BUFFER_MINUTES = 15;

// How far ahead clients can book (in days)
export const MAX_ADVANCE_DAYS = 60;

// Minimum notice required for booking (in hours)
export const MIN_NOTICE_HOURS = 24;

// Working hours per day of week (0 = Sunday, 6 = Saturday)
// null means not available
export const WORKING_HOURS: Record<
  number,
  { start: string; end: string } | null
> = {
  0: null, // Sunday
  1: { start: "09:00", end: "17:00" }, // Monday
  2: { start: "09:00", end: "17:00" }, // Tuesday
  3: { start: "09:00", end: "17:00" }, // Wednesday
  4: { start: "09:00", end: "17:00" }, // Thursday
  5: { start: "09:00", end: "17:00" }, // Friday
  6: null, // Saturday
};
