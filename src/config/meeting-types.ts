export interface MeetingTypeConfig {
  slug: string;
  name: string;
  description: string;
  durationMin: number;
  color: string;
  allowInPerson?: boolean;
}

// Default meeting types — these seed the database on first run.
// After that, they're managed via the admin page.
export const DEFAULT_MEETING_TYPES: MeetingTypeConfig[] = [
  {
    slug: "discovery",
    name: "Discovery Call",
    description:
      "A 30-minute introductory call to discuss your needs and how I can help.",
    durationMin: 30,
    color: "#2563eb",
    allowInPerson: true,
  },
  {
    slug: "strategy",
    name: "Strategy Session",
    description:
      "A 60-minute deep-dive session to develop actionable strategies for your business.",
    durationMin: 60,
    color: "#7c3aed",
    allowInPerson: false,
  },
  {
    slug: "followup",
    name: "Follow-up Meeting",
    description: "A 30-minute check-in to review progress and next steps.",
    durationMin: 30,
    color: "#059669",
    allowInPerson: true,
  },
];
