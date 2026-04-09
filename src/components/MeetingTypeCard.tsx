import Link from "next/link";

interface MeetingTypeCardProps {
  slug: string;
  name: string;
  description: string;
  durationMin: number;
  color: string;
}

export default function MeetingTypeCard({
  slug,
  name,
  description,
  durationMin,
  color,
}: MeetingTypeCardProps) {
  return (
    <Link
      href={`/book/${slug}`}
      className="block rounded-lg border border-gray-200 p-6 transition-shadow hover:shadow-md"
    >
      <div className="flex items-start gap-4">
        <div
          className="mt-1 h-3 w-3 rounded-full shrink-0"
          style={{ backgroundColor: color }}
        />
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-gray-900">{name}</h2>
          <p className="mt-1 text-sm text-gray-500">{durationMin} minutes</p>
          <p className="mt-2 text-sm text-gray-600">{description}</p>
        </div>
      </div>
    </Link>
  );
}
