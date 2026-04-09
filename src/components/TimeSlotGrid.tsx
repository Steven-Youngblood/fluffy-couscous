"use client";

interface TimeSlot {
  start: string;
  end: string;
}

interface TimeSlotGridProps {
  slots: TimeSlot[];
  selectedSlot: string | null;
  onSlotSelect: (startTime: string) => void;
  loading: boolean;
}

export default function TimeSlotGrid({
  slots,
  selectedSlot,
  onSlotSelect,
  loading,
}: TimeSlotGridProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
        <span className="ml-2 text-sm text-gray-500">Loading available times...</span>
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-gray-500">
        No available times for this date. Please try another day.
      </p>
    );
  }

  function formatTime(isoString: string): string {
    return new Intl.DateTimeFormat("en-NZ", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Pacific/Auckland",
      hour12: true,
    }).format(new Date(isoString));
  }

  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
      {slots.map((slot) => {
        const isSelected = selectedSlot === slot.start;
        return (
          <button
            key={slot.start}
            onClick={() => onSlotSelect(slot.start)}
            className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
              isSelected
                ? "border-blue-600 bg-blue-600 text-white"
                : "border-gray-200 text-gray-700 hover:border-blue-300 hover:bg-blue-50"
            }`}
          >
            {formatTime(slot.start)}
          </button>
        );
      })}
    </div>
  );
}
