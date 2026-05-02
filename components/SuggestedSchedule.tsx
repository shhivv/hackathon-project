"use client"

import { useState, useEffect, useMemo } from "react"
import { CalendarDays, BookOpen, Briefcase, Activity } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  type TrackedAssignment,
  calculatePriority,
  priorityConfig,
} from "@/lib/assignments"
import { getTimetable } from "@/lib/timetableStore"
import { getTimeAllocation } from "@/lib/timeAllocationStore"
import { buildSchedule, type ScheduledBlock } from "@/lib/scheduler"
import type { TimetableEntry } from "@/types/timetable"
import type { TimeAllocation } from "@/types/timeAllocation"

interface Props {
  assignments: TrackedAssignment[]
}

function fmtTime(d: Date): string {
  return d.toLocaleTimeString("en-AU", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
}

function fmtMins(start: Date, end: Date): string {
  const mins = (end.getTime() - start.getTime()) / 60000
  const h = mins / 60
  return Number.isInteger(h) ? `${h}h` : `${h.toFixed(1)}h`
}

function dayLabel(date: Date, now: Date): string {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const d     = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const diff  = Math.round((d.getTime() - today.getTime()) / 86400000)
  if (diff === 0) return "Today"
  if (diff === 1) return "Tomorrow"
  return date.toLocaleDateString("en-AU", {
    weekday: "short",
    day: "numeric",
    month: "short",
  })
}

function totalHoursForType(blocks: ScheduledBlock[], type: ScheduledBlock["type"]): number {
  return blocks
    .filter((b) => b.type === type)
    .reduce((s, b) => s + (b.endTime.getTime() - b.startTime.getTime()) / 3600000, 0)
}

// Visual config per block type
const BLOCK_STYLE = {
  study: {
    border: "",        // overridden per-block by priority color
    bg: "bg-muted/30",
    icon: <BookOpen className="h-3 w-3 shrink-0" />,
    iconColor: "text-primary",
  },
  job: {
    border: "border-sky-500/50",
    bg: "bg-sky-500/5",
    icon: <Briefcase className="h-3 w-3 shrink-0" />,
    iconColor: "text-sky-500",
  },
  recreation: {
    border: "border-amber-500/50",
    bg: "bg-amber-500/5",
    icon: <Activity className="h-3 w-3 shrink-0" />,
    iconColor: "text-amber-500",
  },
}

export function SuggestedSchedule({ assignments }: Props) {
  const [timetable, setTimetable]         = useState<TimetableEntry[]>([])
  const [timeAllocation, setTimeAllocation] = useState<TimeAllocation | null>(null)
  const [now]     = useState(() => new Date())
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    setTimetable(getTimetable() ?? [])
    setTimeAllocation(getTimeAllocation())
    setLoaded(true)
  }, [])

  const assignmentMap = useMemo(
    () => new Map(assignments.map((a) => [a.id, a])),
    [assignments]
  )

  const schedule = useMemo(() => {
    if (!loaded) return []
    return buildSchedule({ assignments, timetable, timeAllocation, now })
  }, [loaded, assignments, timetable, timeAllocation, now])

  const days = useMemo(() => {
    const map = new Map<string, { label: string; blocks: ScheduledBlock[] }>()
    for (const block of schedule) {
      const key = block.startTime.toDateString()
      if (!map.has(key))
        map.set(key, { label: dayLabel(block.startTime, now), blocks: [] })
      map.get(key)!.blocks.push(block)
    }
    return [...map.values()]
  }, [schedule, now])

  if (!loaded || days.length === 0) return null

  const studyH  = totalHoursForType(schedule, "study")
  const jobH    = totalHoursForType(schedule, "job")
  const recH    = totalHoursForType(schedule, "recreation")

  function fmtH(h: number) {
    return Number.isInteger(h) ? `${h}h` : `${h.toFixed(1)}h`
  }

  const summaryParts = [
    studyH > 0 && `${fmtH(studyH)} study`,
    jobH   > 0 && `${fmtH(jobH)} work`,
    recH   > 0 && `${fmtH(recH)} recreation`,
  ].filter(Boolean).join(" · ")

  return (
    <div className="mb-6">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-medium">Suggested Schedule</h2>
        </div>
        <span className="text-xs text-muted-foreground">{summaryParts}</span>
      </div>

      <div className="flex flex-col gap-3">
        {days.map((day) => (
          <div key={day.label} className="rounded-xl border p-3">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              {day.label}
            </p>
            <div className="flex flex-col gap-1.5">
              {day.blocks.map((block, i) => {
                const style = BLOCK_STYLE[block.type]

                // For study blocks, use the priority border colour
                let borderClass = style.border
                let labelEl: React.ReactNode = null
                if (block.type === "study") {
                  const priority = calculatePriority(block.dueAt)
                  const cfg = priorityConfig[priority]
                  borderClass = cfg.border
                  labelEl = (
                    <span
                      className={cn(
                        "rounded px-1.5 py-0.5 text-[10px] font-medium",
                        cfg.bg,
                        cfg.color
                      )}
                    >
                      {cfg.label}
                    </span>
                  )
                }

                return (
                  <div
                    key={`${block.id}-${i}`}
                    className={cn(
                      "flex items-center gap-3 rounded-md border-l-2 px-3 py-2",
                      borderClass,
                      style.bg
                    )}
                  >
                    {/* Time */}
                    <span className="shrink-0 tabular-nums text-xs text-muted-foreground">
                      {fmtTime(block.startTime)}–{fmtTime(block.endTime)}
                    </span>

                    {/* Icon + title */}
                    <div className="flex min-w-0 flex-1 items-center gap-1.5">
                      <span className={style.iconColor}>{style.icon}</span>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-medium">
                          {block.title}
                        </p>
                        {block.courseCode && (
                          <p className="text-[10px] text-muted-foreground">
                            {block.courseCode}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Duration + priority badge */}
                    <div className="flex shrink-0 items-center gap-1.5">
                      <span className="text-xs tabular-nums text-muted-foreground">
                        {fmtMins(block.startTime, block.endTime)}
                      </span>
                      {labelEl}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
        {studyH > 0 && (
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <BookOpen className="h-3 w-3 text-primary" /> Study
          </span>
        )}
        {jobH > 0 &&
          [...new Set(schedule.filter((b) => b.type === "job").map((b) => b.title))].map(
            (title) => (
              <span key={title} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Briefcase className="h-3 w-3 text-sky-500" />
                {title}
              </span>
            )
          )}
        {recH > 0 && (
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Activity className="h-3 w-3 text-amber-500" /> Recreation
          </span>
        )}
        <span className="ml-auto text-xs text-muted-foreground">
          sessions capped at 2h · fits around your classes
        </span>
      </div>
    </div>
  )
}
