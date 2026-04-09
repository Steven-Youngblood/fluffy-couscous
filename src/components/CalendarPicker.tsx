"use client";

import { useState, useMemo } from "react";
import {
  WORKING_HOURS,
  MAX_ADVANCE_DAYS,
  MIN_NOTICE_HOURS,
} from "@/config/business-hours";

interface CalendarPickerProps {
  onDateSelect: (date: string) => void;
  selectedDate: string | null;
}

export default function CalendarPicker({
  onDateSelect,
  selectedDate,
}: CalendarPickerProps) {
  const today = new Date();
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [viewYear, setViewYear] = useState(today.getFullYear());

  const minDate = new Date(
    today.getTime() + MIN_NOTICE_HOURS * 60 * 60 * 1000
  );
  const maxDate = new Date(
    today.getTime() + MAX_ADVANCE_DAYS * 24 * 60 * 60 * 1000
  );

  const days = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const result: (number | null)[] = [];

    // Pad the beginning
    for (let i = 0; i < firstDay; i++) result.push(null);
    for (let i = 1; i <= daysInMonth; i++) result.push(i);

    return result;
  }, [viewMonth, viewYear]);

  function isAvailable(day: number): boolean {
    const date = new Date(viewYear, viewMonth, day);
    const dayOfWeek = date.getDay();

    // Check working hours
    if (!WORKING_HOURS[dayOfWeek]) return false;

    // Check date range
    if (date < new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate()))
      return false;
    if (date > maxDate) return false;

    return true;
  }

  function formatDateStr(day: number): string {
    const m = String(viewMonth + 1).padStart(2, "0");
    const d = String(day).padStart(2, "0");
    return `${viewYear}-${m}-${d}`;
  }

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  function prevMonth() {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  }

  function nextMonth() {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  }

  return (
    <div className="w-full max-w-sm">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={prevMonth}
          className="p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100"
          aria-label="Previous month"
        >
          &larr;
        </button>
        <h3 className="text-base font-semibold text-gray-900">
          {monthNames[viewMonth]} {viewYear}
        </h3>
        <button
          onClick={nextMonth}
          className="p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100"
          aria-label="Next month"
        >
          &rarr;
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-500 mb-2">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="py-1 font-medium">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day, i) => {
          if (day === null)
            return <div key={`empty-${i}`} className="aspect-square" />;

          const dateStr = formatDateStr(day);
          const available = isAvailable(day);
          const isSelected = selectedDate === dateStr;

          return (
            <button
              key={dateStr}
              onClick={() => available && onDateSelect(dateStr)}
              disabled={!available}
              className={`aspect-square flex items-center justify-center rounded-lg text-sm transition-colors ${
                isSelected
                  ? "bg-blue-600 text-white font-semibold"
                  : available
                    ? "text-gray-900 hover:bg-blue-50 cursor-pointer"
                    : "text-gray-300 cursor-default"
              }`}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}
