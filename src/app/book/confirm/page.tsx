"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

function BookingForm() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const meetingType = searchParams.get("type") || "";
  const startTime = searchParams.get("start") || "";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [meetingInfo, setMeetingInfo] = useState<{
    name: string;
    durationMin: number;
  } | null>(null);

  useEffect(() => {
    if (meetingType) {
      fetch(`/api/meeting-types/${meetingType}`)
        .then((r) => r.json())
        .then(setMeetingInfo)
        .catch(() => {});
    }
  }, [meetingType]);

  if (!meetingType || !startTime) {
    return (
      <div className="mx-auto max-w-lg px-4 py-12 text-center">
        <p className="text-gray-500">Invalid booking link. Please start over.</p>
        <button
          onClick={() => router.push("/")}
          className="mt-4 text-blue-600 hover:text-blue-800"
        >
          Go back
        </button>
      </div>
    );
  }

  const start = new Date(startTime);
  const end = meetingInfo
    ? new Date(start.getTime() + meetingInfo.durationMin * 60 * 1000)
    : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          meetingTypeSlug: meetingType,
          startTime,
          bookerName: name,
          bookerEmail: email,
          notes: notes || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        setSubmitting(false);
        return;
      }

      router.push(
        `/book/success?name=${encodeURIComponent(name)}&type=${encodeURIComponent(meetingInfo?.name || meetingType)}&start=${encodeURIComponent(startTime)}`
      );
    } catch {
      setError("Network error. Please check your connection and try again.");
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-12">
      <button
        onClick={() => router.back()}
        className="mb-6 text-sm text-blue-600 hover:text-blue-800"
      >
        &larr; Back
      </button>

      <h1 className="text-2xl font-bold text-gray-900">Confirm Your Booking</h1>

      <div className="mt-4 rounded-lg bg-blue-50 p-4">
        <p className="font-medium text-gray-900">
          {meetingInfo?.name || meetingType}
        </p>
        <p className="text-sm text-gray-600">
          {new Intl.DateTimeFormat("en-NZ", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            timeZone: "Pacific/Auckland",
          }).format(start)}
          {end &&
            ` – ${new Intl.DateTimeFormat("en-NZ", {
              hour: "2-digit",
              minute: "2-digit",
              timeZone: "Pacific/Auckland",
            }).format(end)}`}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700"
          >
            Your name
          </label>
          <input
            id="name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Jane Smith"
          />
        </div>

        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700"
          >
            Email address
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="jane@example.com"
          />
        </div>

        <div>
          <label
            htmlFor="notes"
            className="block text-sm font-medium text-gray-700"
          >
            Notes (optional)
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            maxLength={1000}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Anything you'd like to discuss..."
          />
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting ? "Booking..." : "Confirm Booking"}
        </button>
      </form>
    </div>
  );
}

export default function ConfirmPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-lg px-4 py-12 text-center text-gray-500">
          Loading...
        </div>
      }
    >
      <BookingForm />
    </Suspense>
  );
}
