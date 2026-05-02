"use client"

import { useState, useEffect, useRef } from "react"
import {
  GraduationCap,
  Briefcase,
  Activity,
  Pencil,
  Check,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { getTimeAllocation, saveTimeAllocation } from "@/lib/timeAllocationStore"
import { getTimetable } from "@/lib/timetableStore"
import { parseDuration } from "@/lib/timetableParser"
import type { TimeAllocation } from "@/types/timeAllocation"
import type { TimetableEntry } from "@/types/timetable"

function weeklyClassHours(entries: TimetableEntry[]): number {
  // Deduplicate by subject+group+day+time — each unique combo is one session per week
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

interface Row {
  key: string
  label: string
  hours: number
  icon: React.ReactNode
  barColor: string
  iconBg: string
  iconColor: string
  editable: boolean
}

export function YourWeekPanel() {
  const [allocation, setAllocation] = useState<TimeAllocation | null>(null)
  const [timetable, setTimetable] = useState<TimetableEntry[] | null>(null)
  const [loaded, setLoaded] = useState(false)

  const [expandedKey, setExpandedKey] = useState<"job" | "recreation" | null>(
    null,
  )
  const [draftTitle, setDraftTitle] = useState("")
  const [draftHours, setDraftHours] = useState("")
  const [draftError, setDraftError] = useState("")

  // Points to the first focusable input in whichever editor is open
  const firstInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setAllocation(getTimeAllocation())
    setTimetable(getTimetable())
    setLoaded(true)
  }, [])

  useEffect(() => {
    if (expandedKey !== null) firstInputRef.current?.focus()
  }, [expandedKey])

  if (!loaded || !allocation) return null

  // ── Editor actions ─────────────────────────────────────────────

  function openEditor(key: "job" | "recreation") {
    if (expandedKey === key) {
      setExpandedKey(null)
      return
    }
    if (key === "job" && allocation!.job) {
      setDraftTitle(allocation!.job.title)
      setDraftHours(String(allocation!.job.hoursPerWeek))
    } else {
      setDraftTitle("")
      setDraftHours(String(allocation!.recreationHoursPerWeek))
    }
    setDraftError("")
    setExpandedKey(key)
  }

  function closeEditor() {
    setExpandedKey(null)
    setDraftError("")
  }

  function handleSave() {
    if (expandedKey === "job" && draftTitle.trim() === "") {
      setDraftError("Add a short title.")
      return
    }
    const hrs = Number(draftHours)
    if (draftHours === "" || hrs < 0) {
      setDraftError(hrs < 0 ? "Hours can't be negative." : "Enter the hours.")
      return
    }

    const updated: TimeAllocation = {
      ...allocation!,
      job:
        expandedKey === "job"
          ? { title: draftTitle.trim(), hoursPerWeek: hrs }
          : allocation!.job,
      recreationHoursPerWeek:
        expandedKey === "recreation" ? hrs : allocation!.recreationHoursPerWeek,
      updatedAt: new Date().toISOString(),
    }
    saveTimeAllocation(updated)
    setAllocation(updated)
    closeEditor()
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleSave()
    if (e.key === "Escape") closeEditor()
  }

  // ── Derived data ───────────────────────────────────────────────

  const classHours = timetable ? weeklyClassHours(timetable) : null

  const rows: Row[] = [
    ...(classHours !== null
      ? [
          {
            key: "classes",
            label: "Classes",
            hours: classHours,
            icon: <GraduationCap className="h-3.5 w-3.5" />,
            barColor: "bg-primary",
            iconBg: "bg-primary/10",
            iconColor: "text-primary",
            editable: false,
          },
        ]
      : []),
    ...(allocation.job !== null
      ? [
          {
            key: "job",
            label: allocation.job.title,
            hours: allocation.job.hoursPerWeek,
            icon: <Briefcase className="h-3.5 w-3.5" />,
            barColor: "bg-sky-500",
            iconBg: "bg-sky-500/10",
            iconColor: "text-sky-600 dark:text-sky-400",
            editable: true,
          },
        ]
      : []),
    {
      key: "recreation",
      label: "Recreation",
      hours: allocation.recreationHoursPerWeek,
      icon: <Activity className="h-3.5 w-3.5" />,
      barColor: "bg-amber-500",
      iconBg: "bg-amber-500/10",
      iconColor: "text-amber-600 dark:text-amber-400",
      editable: true,
    },
  ]

  const totalCommitted = rows.reduce((sum, r) => sum + r.hours, 0)
  const roundedTotal = fmt(Math.round(totalCommitted * 10) / 10)

  // ── Render ─────────────────────────────────────────────────────

  return (
    <div className="mb-6 rounded-xl border p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold">Your week</h2>
        <span className="text-muted-foreground tabular-nums text-sm">
          {roundedTotal} hrs committed
        </span>
      </div>

      <div className="flex flex-col gap-0.5">
        {rows.map((row) => {
          const isOpen = expandedKey === row.key

          return (
            <div
              key={row.key}
              className={cn("rounded-lg", isOpen && "bg-muted/50")}
            >
              {/* Row header */}
              {row.editable ? (
                <button
                  onClick={() => openEditor(row.key as "job" | "recreation")}
                  className={cn(
                    "group flex w-full items-center gap-3 rounded-lg px-2 py-1.5 transition-colors",
                    !isOpen && "hover:bg-muted/50",
                  )}
                >
                  <div
                    className={cn(
                      "flex h-7 w-7 shrink-0 items-center justify-center rounded-md",
                      row.iconBg,
                      row.iconColor,
                    )}
                  >
                    {row.icon}
                  </div>
                  <span className="min-w-0 flex-1 truncate text-left text-sm">
                    {row.label}
                  </span>
                  <span className="text-muted-foreground tabular-nums text-sm">
                    {fmt(row.hours)} hrs/wk
                  </span>
                  <Pencil
                    className={cn(
                      "text-muted-foreground h-3 w-3 shrink-0 transition-opacity",
                      isOpen
                        ? "opacity-40"
                        : "opacity-0 group-hover:opacity-50",
                    )}
                  />
                </button>
              ) : (
                <div className="flex items-center gap-3 px-2 py-1.5">
                  <div
                    className={cn(
                      "flex h-7 w-7 shrink-0 items-center justify-center rounded-md",
                      row.iconBg,
                      row.iconColor,
                    )}
                  >
                    {row.icon}
                  </div>
                  <span className="min-w-0 flex-1 truncate text-sm">
                    {row.label}
                  </span>
                  <span className="text-muted-foreground tabular-nums text-sm">
                    {fmt(row.hours)} hrs/wk
                  </span>
                </div>
              )}

              {/* Inline editor */}
              {isOpen && (
                <div className="px-2 pb-3 pt-0.5">
                  <div className="flex flex-col gap-2">
                    {expandedKey === "job" && (
                      <input
                        ref={firstInputRef}
                        type="text"
                        value={draftTitle}
                        onChange={(e) => {
                          setDraftTitle(e.target.value)
                          if (draftError) setDraftError("")
                        }}
                        onKeyDown={handleKeyDown}
                        placeholder="Role title"
                        className="border-input bg-background placeholder:text-muted-foreground focus-visible:ring-ring/50 w-full rounded-md border px-2.5 py-1.5 text-sm outline-none focus-visible:ring-[3px]"
                      />
                    )}

                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <input
                          ref={
                            expandedKey === "recreation"
                              ? firstInputRef
                              : undefined
                          }
                          type="number"
                          min="0"
                          step="0.5"
                          value={draftHours}
                          onChange={(e) => {
                            setDraftHours(e.target.value)
                            if (draftError) setDraftError("")
                          }}
                          onKeyDown={handleKeyDown}
                          placeholder="0"
                          className="border-input bg-background placeholder:text-muted-foreground focus-visible:ring-ring/50 w-full rounded-md border py-1.5 pl-2.5 pr-14 text-sm outline-none focus-visible:ring-[3px]"
                        />
                        <span className="text-muted-foreground pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs">
                          hrs/wk
                        </span>
                      </div>

                      <button
                        onClick={handleSave}
                        aria-label="Save"
                        className="bg-primary text-primary-foreground flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition-opacity hover:opacity-80"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={closeEditor}
                        aria-label="Cancel"
                        className="text-muted-foreground hover:bg-muted hover:text-foreground flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition-colors"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {draftError && (
                      <p className="text-destructive text-xs">{draftError}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {totalCommitted > 0 && (
        <div className="mt-4">
          <div className="bg-muted flex h-2 overflow-hidden rounded-full">
            {rows.map((row) => (
              <div
                key={row.key}
                className={row.barColor}
                style={{ width: `${(row.hours / totalCommitted) * 100}%` }}
              />
            ))}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
            {rows.map((row) => (
              <span key={row.key} className="flex items-center gap-1.5">
                <span className={cn("h-2 w-2 rounded-full", row.barColor)} />
                <span className="text-muted-foreground text-xs">{row.label}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {classHours === null && (
        <p className="text-muted-foreground mt-4 border-t pt-3 text-xs">
          Class hours not included — add your timetable in setup to see the full
          picture.
        </p>
      )}
    </div>
  )
}
