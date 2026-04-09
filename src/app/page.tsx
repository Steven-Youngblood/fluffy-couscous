import { prisma } from "@/lib/db";
import MeetingTypeCard from "@/components/MeetingTypeCard";
import { DEFAULT_MEETING_TYPES, type MeetingTypeConfig } from "@/config/meeting-types";

export const dynamic = "force-dynamic";

async function getMeetingTypes(): Promise<MeetingTypeConfig[]> {
  try {
    const types = await prisma.meetingType.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    });

    // If no meeting types in DB, seed defaults
    if (types.length === 0) {
      const seeded = await Promise.all(
        DEFAULT_MEETING_TYPES.map((mt, i) =>
          prisma.meetingType.create({
            data: { ...mt, sortOrder: i },
          })
        )
      );
      return seeded;
    }

    return types;
  } catch {
    // DB not set up yet — show defaults for development
    return DEFAULT_MEETING_TYPES;
  }
}

export default async function HomePage() {
  const meetingTypes = await getMeetingTypes();

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900">
          Book a Consultation
        </h1>
        <p className="mt-2 text-gray-600">
          Choose a meeting type to get started.
        </p>
      </div>

      <div className="space-y-4">
        {meetingTypes.map((mt) => (
          <MeetingTypeCard
            key={mt.slug}
            slug={mt.slug}
            name={mt.name}
            description={mt.description}
            durationMin={mt.durationMin}
            color={mt.color}
          />
        ))}
      </div>
    </div>
  );
}
