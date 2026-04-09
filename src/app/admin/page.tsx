"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function AdminContent() {
  const searchParams = useSearchParams();
  const connectedParam = searchParams.get("connected");
  const errorParam = searchParams.get("error");

  const [password, setPassword] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [calendarConnected, setCalendarConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loginError, setLoginError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/status")
      .then((r) => r.json())
      .then((data) => {
        setIsAdmin(data.isAdmin);
        setCalendarConnected(data.calendarConnected);
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError(null);

    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (!res.ok) {
      setLoginError("Invalid password");
      return;
    }

    setIsAdmin(true);
    // Re-fetch status
    const status = await fetch("/api/admin/status").then((r) => r.json());
    setCalendarConnected(status.calendarConnected);
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center text-gray-500">
        Loading...
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-sm px-4 py-16">
        <h1 className="text-2xl font-bold text-gray-900 text-center">
          Admin Login
        </h1>
        <form onSubmit={handleLogin} className="mt-8 space-y-4">
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          {loginError && (
            <p className="text-sm text-red-600">{loginError}</p>
          )}
          <button
            type="submit"
            className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Log In
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>

      {connectedParam === "true" && (
        <div className="mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-700">
          Calendar connected successfully!
        </div>
      )}

      {errorParam && (
        <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          Error: {errorParam}
        </div>
      )}

      <div className="mt-8 space-y-6">
        {/* Calendar Connection */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-gray-900">
            Calendar Connection
          </h2>
          <div className="mt-3 flex items-center gap-2">
            <div
              className={`h-2.5 w-2.5 rounded-full ${
                calendarConnected ? "bg-green-500" : "bg-red-500"
              }`}
            />
            <span className="text-sm text-gray-600">
              {calendarConnected
                ? "Connected to Microsoft 365"
                : "Not connected"}
            </span>
          </div>
          <a
            href="/api/auth/login"
            className="mt-4 inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            {calendarConnected ? "Reconnect Calendar" : "Connect Calendar"}
          </a>
        </div>

        {/* Quick Info */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-gray-900">
            How It Works
          </h2>
          <ul className="mt-3 space-y-2 text-sm text-gray-600">
            <li>
              1. Connect your Microsoft 365 calendar above
            </li>
            <li>
              2. Share your booking link:{" "}
              <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs">
                {typeof window !== "undefined"
                  ? window.location.origin
                  : "your-site.com"}
              </code>
            </li>
            <li>
              3. Clients pick a time — it appears directly in your Outlook
              calendar
            </li>
          </ul>
        </div>

        {/* Meeting types info */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-gray-900">
            Meeting Types
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Meeting types are configured in{" "}
            <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs">
              src/config/meeting-types.ts
            </code>
            . Edit that file and redeploy to change your available meeting types.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-lg px-4 py-16 text-center text-gray-500">
          Loading...
        </div>
      }
    >
      <AdminContent />
    </Suspense>
  );
}
