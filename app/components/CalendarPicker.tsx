"use client";

import { useState } from "react";

const DAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function isoWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dow = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dow);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

function toYMD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function fmtDate(ymd: string): string {
  return new Date(ymd + "T00:00:00").toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
  });
}

interface Props {
  from: string;
  to: string;
  onChange: (from: string, to: string) => void;
  errorFrom?: string;
  errorTo?: string;
}

export default function CalendarPicker({ from, to, onChange, errorFrom, errorTo }: Props) {
  const todayStr = toYMD(new Date());

  const [displayDate, setDisplayDate] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });

  function prevMonth() {
    setDisplayDate((p) => new Date(p.getFullYear(), p.getMonth() - 1, 1));
  }
  function nextMonth() {
    setDisplayDate((p) => new Date(p.getFullYear(), p.getMonth() + 1, 1));
  }

  function handleDayClick(dateStr: string) {
    if (dateStr < todayStr) return;
    // No selection yet, or both already selected → start fresh
    if (!from || (from && to)) {
      onChange(dateStr, "");
      return;
    }
    // from is set, to is not
    if (dateStr < from) {
      onChange(dateStr, from);
    } else if (dateStr === from) {
      onChange("", "");
    } else {
      onChange(from, dateStr);
    }
  }

  // Build grid
  const year = displayDate.getFullYear();
  const month = displayDate.getMonth();
  const startDow = (new Date(year, month, 1).getDay() + 6) % 7; // 0=Mon
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const weeks: { weekNum: number; days: (Date | null)[] }[] = [];
  let current: (Date | null)[] = Array(startDow).fill(null);

  for (let d = 1; d <= daysInMonth; d++) {
    current.push(new Date(year, month, d));
    if (current.length === 7) {
      weeks.push({ weekNum: isoWeek(current.find((x) => x !== null)!), days: current });
      current = [];
    }
  }
  if (current.length > 0) {
    while (current.length < 7) current.push(null);
    weeks.push({ weekNum: isoWeek(current.find((x) => x !== null)!), days: current });
  }

  return (
    <div className="bg-fs-slate-light rounded-xl p-4 select-none">
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={prevMonth}
          className="w-8 h-8 flex items-center justify-center text-fs-gray-2 hover:text-white hover:bg-fs-slate rounded-lg transition-colors text-lg"
        >
          ‹
        </button>
        <span className="text-white font-fs text-sm font-semibold tracking-wide">
          {MONTHS[month]} {year}
        </span>
        <button
          type="button"
          onClick={nextMonth}
          className="w-8 h-8 flex items-center justify-center text-fs-gray-2 hover:text-white hover:bg-fs-slate rounded-lg transition-colors text-lg"
        >
          ›
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-[1.5rem_repeat(7,1fr)] mb-1">
        <div />
        {DAYS.map((d) => (
          <div key={d} className="text-center text-fs-gray-3 text-xs font-fs py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Weeks */}
      {weeks.map((week) => (
        <div key={week.weekNum} className="grid grid-cols-[1.5rem_repeat(7,1fr)]">
          {/* Week number */}
          <div className="flex items-center justify-center text-fs-gray-3 text-xs font-fs">
            {week.weekNum}
          </div>

          {week.days.map((day, i) => {
            if (!day) return <div key={i} className="h-8" />;

            const ds = toYMD(day);
            const isPast = ds < todayStr;
            const isToday = ds === todayStr;
            const isFrom = ds === from;
            const isTo = ds === to;
            const inRange = !!(from && to && ds > from && ds < to);
            const isEndpoint = isFrom || isTo;

            // Range band background (full-width strip)
            const showRangeBand =
              inRange ||
              (isFrom && !!to) ||
              (isTo && !!from);

            const bandRounded =
              isFrom ? "rounded-l-full" : isTo ? "rounded-r-full" : "";

            return (
              <div key={i} className="relative h-8 flex items-center justify-center">
                {/* Range highlight band */}
                {showRangeBand && (
                  <div
                    className={`absolute inset-y-1 inset-x-0 bg-fs-red/20 ${bandRounded}`}
                  />
                )}
                {/* Day button */}
                <button
                  type="button"
                  disabled={isPast}
                  onClick={() => handleDayClick(ds)}
                  className={[
                    "relative z-10 w-7 h-7 flex items-center justify-center rounded-full text-xs font-fs transition-colors",
                    isPast
                      ? "text-fs-gray-3 cursor-not-allowed"
                      : "cursor-pointer",
                    isEndpoint
                      ? "bg-fs-red text-white font-bold"
                      : isToday
                      ? "text-fs-red font-bold"
                      : inRange
                      ? "text-white"
                      : isPast
                      ? ""
                      : "text-fs-chalk hover:bg-fs-slate",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  {day.getDate()}
                </button>
              </div>
            );
          })}
        </div>
      ))}

      {/* Selected range summary */}
      <div className="mt-3 pt-3 border-t border-fs-slate">
        <div className="flex items-center gap-2 text-xs font-fs">
          <div className={`flex-1 ${errorFrom ? "text-fs-red" : ""}`}>
            <span className="text-fs-gray-3">From  </span>
            {from ? (
              <span className="text-white">{fmtDate(from)}</span>
            ) : (
              <span className="text-fs-gray-3 italic">not selected</span>
            )}
            {errorFrom && <p className="text-fs-red mt-0.5">{errorFrom}</p>}
          </div>
          <div className="text-fs-gray-3">→</div>
          <div className={`flex-1 ${errorTo ? "text-fs-red" : ""}`}>
            <span className="text-fs-gray-3">To  </span>
            {to ? (
              <span className="text-white">{fmtDate(to)}</span>
            ) : (
              <span className="text-fs-gray-3 italic">not selected</span>
            )}
            {errorTo && <p className="text-fs-red mt-0.5">{errorTo}</p>}
          </div>
          {(from || to) && (
            <button
              type="button"
              onClick={() => onChange("", "")}
              className="text-fs-gray-3 hover:text-white transition-colors ml-1"
            >
              ✕
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
