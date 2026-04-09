"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import CalendarPicker from "@/components/CalendarPicker";
import TimeSlotGrid from "@/components/TimeSlotGrid";

interface TimeSlot {
  start: string;
  end: string;
}

interface MeetingTypeInfo {
  name: string;
  description: string;
  durationMin: number;
  color: string;
}

export default function BookMeetingPage() {
  const params = useParams();
  const router = useRouter();
  const meetingType = params.meetingType as string;

  const [meetingInfo, setMeetingInfo] = useState<MeetingTypeInfo | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch meeting type info
  useEffect(() => {
    fetch(`/api/meeting-types/${meetingType}`)
      .then((r) => r.json())
      .then(setMeetingInfo)
      .catch(() => {});
  }, [meetingType]);

  // Fetch slots when date changes
  const fetchSlots = useCallback(async (date: string) => {
    setLoading(true);
    setSelectedSlot(null);
    try {
      const res = await fetch(`/api/slots?type=${meetingType}&date=${date}`);
      const data = await res.json();
      setSlots(data.slots || []);
    } catch {
      setSlots([]);
    } finally {
      setLoading(false);
    }
  }, [meetingType]);

  function handleDateSelect(date: string) {
    setSelectedDate(date);
    fetchSlots(date);
  }

  function handleContinue() {
    if (!selectedSlot) return;
    const params = new URLSearchParams({
      type: meetingType,
      start: selectedSlot,
    });
    router.push(`/book/confirm?${params}`);
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <button
        onClick={() => router.push("/")}
        className="mb-6 text-sm text-blue-600 hover:text-blue-800"
      >
        &larr; Back to meeting types
      </button>

      {meetingInfo && (
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <div
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: meetingInfo.color }}
            />
            <h1 className="text-2xl font-bold text-gray-900">
              {meetingInfo.name}
            </h1>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            {meetingInfo.durationMin} minutes
          </p>
        </div>
      )}

      <div className="grid gap-8 md:grid-cols-2">
        <div>
          <h2 className="mb-4 text-sm font-medium text-gray-700">
            Select a date
          </h2>
          <CalendarPicker
            onDateSelect={handleDateSelect}
            selectedDate={selectedDate}
          />
        </div>

        <div>
          {selectedDate && (
            <>
              <h2 className="mb-4 text-sm font-medium text-gray-700">
                Available times for{" "}
                {new Date(selectedDate + "T12:00:00").toLocaleDateString(
                  "en-NZ",
                  {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  }
                )}
              </h2>
              <TimeSlotGrid
                slots={slots}
                selectedSlot={selectedSlot}
                onSlotSelect={setSelectedSlot}
                loading={loading}
              />

              {selectedSlot && (
                <button
                  onClick={handleContinue}
                  className="mt-6 w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
                >
                  Continue
                </button>
              )}
            </>
          )}

          {!selectedDate && (
            <p className="py-12 text-center text-sm text-gray-400">
              Select a date to see available times
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
