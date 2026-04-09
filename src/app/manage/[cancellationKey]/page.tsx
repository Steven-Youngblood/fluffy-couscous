"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface BookingInfo {
  id: string;
  meetingType: string;
  meetingTypeName: string;
  startTime: string;
  endTime: string;
  bookerName: string;
  status: string;
}

export default function ManageBookingPage() {
  const params = useParams();
  const cancellationKey = params.cancellationKey as string;

  const [booking, setBooking] = useState<BookingInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [cancelled, setCancelled] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/bookings/${cancellationKey}`)
      .then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      })
      .then(setBooking)
      .catch(() => setError("Booking not found."))
      .finally(() => setLoading(false));
  }, [cancellationKey]);

  async function handleCancel() {
    if (!confirm("Are you sure you want to cancel this booking?")) return;

    setCancelling(true);
    try {
      const res = await fetch(`/api/bookings/${cancellationKey}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to cancel.");
        return;
      }
      setCancelled(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setCancelling(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center text-gray-500">
        Loading booking details...
      </div>
    );
  }

  if (error && !booking) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-gray-500">{error}</p>
        <Link href="/" className="mt-4 inline-block text-blue-600 hover:text-blue-800">
          Book a new meeting
        </Link>
      </div>
    );
  }

  if (cancelled) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
          <svg
            className="h-8 w-8 text-red-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Booking Cancelled</h1>
        <p className="mt-2 text-gray-600">
          Your booking has been cancelled and removed from the calendar.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block text-sm text-blue-600 hover:text-blue-800"
        >
          Book a new meeting
        </Link>
      </div>
    );
  }

  if (!booking) return null;

  const isPast = new Date(booking.startTime) < new Date();
  const isCancelled = booking.status === "cancelled";

  return (
    <div className="mx-auto max-w-lg px-4 py-12">
      <h1 className="text-2xl font-bold text-gray-900">Manage Your Booking</h1>

      <div className="mt-6 rounded-lg border border-gray-200 bg-white p-6">
        <p className="text-lg font-medium text-gray-900">
          {booking.meetingTypeName}
        </p>
        <p className="mt-1 text-sm text-gray-600">
          {new Intl.DateTimeFormat("en-NZ", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            timeZone: "Pacific/Auckland",
            timeZoneName: "short",
          }).format(new Date(booking.startTime))}
        </p>
        <p className="mt-1 text-sm text-gray-500">
          Booked by {booking.bookerName}
        </p>

        {isCancelled && (
          <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            This booking has been cancelled.
          </div>
        )}

        {booking.status === "confirmed" && (
          <div className="mt-6 space-y-3">
            {!isPast && (
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="w-full rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-50 disabled:opacity-50"
              >
                {cancelling ? "Cancelling..." : "Cancel Booking"}
              </button>
            )}
            {isPast && (
              <p className="text-sm text-gray-500">
                This booking has already taken place.
              </p>
            )}
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}
      </div>

      <Link
        href="/"
        className="mt-6 inline-block text-sm text-blue-600 hover:text-blue-800"
      >
        Book a new meeting
      </Link>
    </div>
  );
}
