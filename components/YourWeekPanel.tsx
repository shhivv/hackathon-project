"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import {
  GraduationCap,
  Briefcase,
  Activity,
  Settings,
  Check,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { getTimeAllocation, saveTimeAllocation } from "@/lib/timeAllocationStore"
import { getTimetable } from "@/lib/timetableStore"
import { parseDuration } from "@/lib/timetableParser"
import { shiftHoursPerWeek } from "@/types/workSchedule"
import type { TimeAllocation } from "@/types/timeAllocation"
import type { TimetableEntry } from "@/types/timetable"

function weeklyClassHours(entries: TimetableEntry[]): number {
  const seen = new Set<string>()
  let total = 0
  for (const e of entries) {
    const key = `${e.subjectCode}|${e.group}|${e.day}|${e.time}`
    if (!seen.has(key)) {
      seen.add(key)
      total += parseDuration(e.duration)
    }
  }
  return Math.round(total * 10) / 10
}

function fmt(hours: number): string {
  return Number.isInteger(hours) ? String(hours) : hours.toFixed(1)
}

export function YourWeekPanel() {
  const [allocation, setAllocation] = useState<TimeAllocation | null>(null)
  const [timetable, setTimetable]   = useState<TimetableEntry[] | null>(null)
  const [loaded, setLoaded]         = useState(false)

  // Recreation inline editor
  const [recOpen, setRecOpen]       = useState(false)
  const [draftHours, setDraftHours] = useState("")
  const [draftError, setDraftError] = useState("")
  const recInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setAllocation(getTimeAllocation())
    setTimetable(getTimetable())
    setLoaded(true)
  }, [])

  useEffect(() => {
    if (recOpen) recInputRef.current?.focus()
  }, [recOpen])

  if (!loaded || !allocation) return null

  const classHours = timetable ? weeklyClassHours(timetable) : null
  const jobs        = allocation.jobs ?? []

  // ── Recreation editor ──────────────────────────────────────────
  function openRec() {
    setDraftHours(String(allocation!.recreationHoursPerWeek))
    setDraftError("")
    setRecOpen(true)
  }
  function closeRec() { setRecOpen(false); setDraftError("") }

  function saveRec() {
    const hrs = Number(draftHours)
    if (draftHours === "" || hrs < 0) {
      setDraftError(hrs < 0 ? "Hours can't be negative." : "Enter the hours.")
      return
    }
    const updated: TimeAllocation = {
      ...allocation!,
      recreationHoursPerWeek: hrs,
      updatedAt: new Date().toISOString(),
    }
    saveTimeAllocation(updated)
    setAllocation(updated)
    closeRec()
  }

  function handleRecKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter")  saveRec()
    if (e.key === "Escape") closeRec()
  }

  // ── Totals for the bar chart ────────────────────────────────────
  const totalJobHours = jobs.reduce((s, j) => s + shiftHoursPerWeek(j), 0)
  const totalCommitted =
    (classHours ?? 0) + totalJobHours + allocation.recreationHoursPerWeek
  const roundedTotal = fmt(Math.round(totalCommitted * 10) / 10)

  type BarSegment = { key: string; hours: number; barColor: string }
  const segments: BarSegment[] = [
    ...(classHours !== null
      ? [{ key: "classes", hours: classHours, barColor: "bg-primary" }]
      : []),
    ...jobs.map((j) => ({
      key: j.id,
      hours: shiftHoursPerWeek(j),
      barColor: "bg-sky-500",
    })),
    {
      key: "recreation",
      hours: allocation.recreationHoursPerWeek,
      barColor: "bg-amber-500",
    },
  ]

  return (
    <div className="mb-6 rounded-xl border p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold">Your week</h2>
        <span className="text-sm tabular-nums text-muted-foreground">
          {roundedTotal} hrs committed
        </span>
      </div>

      <div className="flex flex-col gap-0.5">
        {/* Classes row */}
        {classHours !== null && (
          <div className="flex items-center gap-3 px-2 py-1.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
              <GraduationCap className="h-3.5 w-3.5" />
            </div>
            <span className="min-w-0 flex-1 truncate text-sm">Classes</span>
            <span className="tabular-nums text-sm text-muted-foreground">
              {fmt(classHours)} hrs/wk
            </span>
          </div>
        )}

        {/* Work shift rows (read-only; edit via Settings) */}
        {jobs.map((shift) => (
          <div key={shift.id} className="flex items-center gap-3 px-2 py-1.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-sky-500/10 text-sky-600 dark:text-sky-400">
              <Briefcase className="h-3.5 w-3.5" />
            </div>
            <span className="min-w-0 flex-1 truncate text-sm">
              {shift.title}
            </span>
            <span className="tabular-nums text-sm text-muted-foreground">
              {fmt(shiftHoursPerWeek(shift))} hrs/wk
            </span>
          </div>
        ))}

        {/* Link to Settings if there are jobs (or to add one) */}
        {jobs.length > 0 && (
          <div className="px-2 pb-1">
            <Link
              href="/settings"
              className="flex items-center gap-1 text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
            >
              <Settings className="h-3 w-3" />
              Manage work schedule
            </Link>
          </div>
        )}

        {/* Recreation row — inline editable */}
        <div className={cn("rounded-lg", recOpen && "bg-muted/50")}>
          <button
            onClick={() => (recOpen ? closeRec() : openRec())}
            className={cn(
              "group flex w-full items-center gap-3 rounded-lg px-2 py-1.5 transition-colors",
              !recOpen && "hover:bg-muted/50"
            )}
          >
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Activity className="h-3.5 w-3.5" />
            </div>
            <span className="min-w-0 flex-1 truncate text-left text-sm">
              Recreation
            </span>
            <span className="tabular-nums text-sm text-muted-foreground">
              {fmt(allocation.recreationHoursPerWeek)} hrs/wk
            </span>
          </button>

          {recOpen && (
            <div className="px-2 pb-3 pt-0.5">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      ref={recInputRef}
                      type="number"
                      min="0"
                      step="0.5"
                      value={draftHours}
                      onChange={(e) => {
                        setDraftHours(e.target.value)
                        if (draftError) setDraftError("")
                      }}
                      onKeyDown={handleRecKeyDown}
                      placeholder="0"
                      className="border-input bg-background placeholder:text-muted-foreground focus-visible:ring-ring/50 w-full rounded-md border py-1.5 pl-2.5 pr-14 text-sm outline-none focus-visible:ring-[3px]"
                    />
                    <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                      hrs/wk
                    </span>
                  </div>
                  <button
                    onClick={saveRec}
                    aria-label="Save"
                    className="bg-primary text-primary-foreground flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition-opacity hover:opacity-80"
                  >
                    <Check className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={closeRec}
                    aria-label="Cancel"
                    className="text-muted-foreground hover:bg-muted hover:text-foreground flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                {draftError && (
                  <p className="text-xs text-destructive">{draftError}</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bar chart */}
      {totalCommitted > 0 && (
        <div className="mt-4">
          <div className="flex h-2 overflow-hidden rounded-full bg-muted">
            {segments.map((seg) => (
              <div
                key={seg.key}
                className={seg.barColor}
                style={{ width: `${(seg.hours / totalCommitted) * 100}%` }}
              />
            ))}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
            {classHours !== null && (
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-primary" />
                <span className="text-xs text-muted-foreground">Classes</span>
              </span>
            )}
            {jobs.map((j) => (
              <span key={j.id} className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-sky-500" />
                <span className="text-xs text-muted-foreground">{j.title}</span>
              </span>
            ))}
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              <span className="text-xs text-muted-foreground">Recreation</span>
            </span>
          </div>
        </div>
      )}

      {classHours === null && (
        <p className="mt-4 border-t pt-3 text-xs text-muted-foreground">
          Class hours not included — add your timetable in setup to see the
          full picture.
        </p>
      )}
    </div>
  )
}
