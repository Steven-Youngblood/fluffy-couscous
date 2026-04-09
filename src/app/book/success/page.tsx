"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function SuccessContent() {
  const searchParams = useSearchParams();
  const name = searchParams.get("name") || "there";
  const type = searchParams.get("type") || "Meeting";
  const start = searchParams.get("start");

  const dateStr = start
    ? new Intl.DateTimeFormat("en-NZ", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Pacific/Auckland",
        timeZoneName: "short",
      }).format(new Date(start))
    : "";

  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
        <svg
          className="h-8 w-8 text-green-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>

      <h1 className="text-2xl font-bold text-gray-900">You&apos;re Booked!</h1>

      <p className="mt-2 text-gray-600">
        Hi {name}, your <strong>{type}</strong> has been confirmed.
      </p>

      {dateStr && (
        <div className="mt-4 rounded-lg bg-gray-50 p-4">
          <p className="text-sm font-medium text-gray-900">{dateStr}</p>
        </div>
      )}

      <p className="mt-6 text-sm text-gray-500">
        A confirmation email has been sent with the details and a calendar
        invite. You can reschedule or cancel from the link in that email.
      </p>

      <Link
        href="/"
        className="mt-8 inline-block text-sm text-blue-600 hover:text-blue-800"
      >
        Book another meeting
      </Link>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-lg px-4 py-16 text-center text-gray-500">
          Loading...
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
