import type { TrackedAssignment } from "./assignments"
import type { TimetableEntry } from "@/types/timetable"
import type { TimeAllocation } from "@/types/timeAllocation"
import type { DayName } from "@/types/workSchedule"
import { blockedWindow } from "@/types/workSchedule"
import { calculateUrgency } from "./assignments"
import { getDayName, parseDuration } from "./timetableParser"

export type BlockType = "study" | "job" | "recreation"

export interface ScheduledBlock {
  id: string          // assignment id for "study"; shift id for "job"; "recreation" otherwise
  type: BlockType
  title: string
  courseCode?: string
  dueAt: string | null
  startTime: Date
  endTime: Date
}

export interface SchedulerInput {
  assignments: TrackedAssignment[]
  timetable: TimetableEntry[]
  timeAllocation: TimeAllocation | null
  now: Date
}

const STUDY_START       = 8 * 60   // 08:00 in minutes since midnight
const STUDY_END         = 22 * 60  // 22:00
const MAX_STUDY_SESSION = 120      // max 2 h per study block
const MIN_SESSION       = 30       // ignore slivers smaller than 30 min
const MAX_STUDY_PER_DAY = 8 * 60

interface Slot { start: number; end: number } // minutes since midnight

function parseMin(timeStr: string): number {
  const [h, m = "0"] = timeStr.split(":")
  return parseInt(h, 10) * 60 + parseInt(m, 10)
}

function subtractBusy(free: Slot[], busy: Slot[]): Slot[] {
  for (const b of busy) {
    const next: Slot[] = []
    for (const f of free) {
      if (b.end <= f.start || b.start >= f.end) {
        next.push(f)
      } else {
        if (f.start < b.start) next.push({ start: f.start, end: b.start })
        if (b.end < f.end)     next.push({ start: b.end,   end: f.end   })
      }
    }
    free = next
  }
  return free
}

function totalMin(slots: Slot[]): number {
  return slots.reduce((s, r) => s + r.end - r.start, 0)
}

function takeFromFront(
  slots: Slot[],
  minutes: number
): { taken: Slot[]; rest: Slot[] } {
  const rest = [...slots]
  const taken: Slot[] = []
  let left = Math.min(minutes, totalMin(rest))
  while (left > 0 && rest.length > 0) {
    const first = rest[0]
    const avail = first.end - first.start
    if (avail <= left) {
      taken.push(first)
      rest.shift()
      left -= avail
    } else {
      taken.push({ start: first.start, end: first.start + left })
      rest[0] = { start: first.start + left, end: first.end }
      left = 0
    }
  }
  return { taken, rest }
}

function makeBlock(
  dayDate: Date,
  slot: Slot,
  base: Omit<ScheduledBlock, "startTime" | "endTime">
): ScheduledBlock {
  const startTime = new Date(dayDate)
  startTime.setHours(Math.floor(slot.start / 60), slot.start % 60, 0, 0)
  const endTime = new Date(dayDate)
  endTime.setHours(Math.floor(slot.end / 60), slot.end % 60, 0, 0)
  return { ...base, startTime, endTime }
}

/**
 * Pure scheduler. Returns blocks for the next 7 days ordered by start time.
 *
 * Per-day layout:
 *   1. Class timetable blocks are removed from the 08:00–22:00 window.
 *   2. Each active work shift's full unavailable window
 *      (shift_start − commute … shift_end + commute + buffer)
 *      is also removed; the shift appears as a "job" block in the output.
 *   3. Study sessions fill the remaining free time (front = mornings).
 *   4. Recreation fills whatever study-pool time is left (afternoons).
 */
export function buildSchedule({
  assignments,
  timetable,
  timeAllocation,
  now,
}: SchedulerInput): ScheduledBlock[] {
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  )
  const jobs        = timeAllocation?.jobs ?? []
  const recMinTotal = timeAllocation ? timeAllocation.recreationHoursPerWeek * 60 : 0
  let   recMinLeft  = recMinTotal

  const allBlocks: ScheduledBlock[] = []
  // Per-day pools of free time for study (mutated as sessions are booked).
  const studyPools: Slot[][] = []

  // ── Phase 1: build per-day free pools ───────────────────────────────────

  for (let d = 0; d < 7; d++) {
    const dayDate = new Date(startOfToday)
    dayDate.setDate(dayDate.getDate() + d)
    const dayName = getDayName(dayDate)

    // Class busy slots (exclude workshops, tutorials, and labs)
    const skipRe = /workshop|tutorial|lab/i
    const classBusy: Slot[] = timetable
      .filter((e) => e.day === dayName && !skipRe.test(e.group) && !skipRe.test(e.description) && !e.group.toLowerCase().startsWith("com"))
      .map((e) => {
        const start = parseMin(e.time)
        return { start, end: start + Math.round(parseDuration(e.duration) * 60) }
      })

    // Work shift busy slots — each produces both a display block and a busy slot
    const workBusy: Slot[] = []
    for (const shift of jobs) {
      if (!shift.workDays.includes(dayName as DayName)) continue

      const { start: bStart, end: bEnd } = blockedWindow(shift)
      workBusy.push({ start: bStart, end: bEnd })

      // Display block clamped to the visible 08:00–22:00 window
      const displayStart = Math.max(STUDY_START, bStart)
      const displayEnd   = Math.min(STUDY_END,   bEnd)
      if (displayEnd > displayStart) {
        allBlocks.push(
          makeBlock(dayDate, { start: displayStart, end: displayEnd }, {
            id:    shift.id,
            type:  "job",
            title: shift.title,
            dueAt: null,
          })
        )
      }
    }

    // Today: advance study window start to current time (rounded up 30 min)
    const windowStart =
      d === 0
        ? Math.max(
            STUDY_START,
            Math.ceil(
              (now.getHours() * 60 + now.getMinutes()) / 30
            ) * 30
          )
        : STUDY_START

    const base: Slot[] =
      windowStart < STUDY_END ? [{ start: windowStart, end: STUDY_END }] : []

    const freeSlots = subtractBusy(
      subtractBusy(base, classBusy),
      workBusy
    )

    studyPools.push(takeFromFront(freeSlots, MAX_STUDY_PER_DAY).taken)
  }

  // ── Phase 2: study sessions (most urgent first) ──────────────────────────

  const skipAssignmentRe = /workshop|tutorial|lab/i
  const eligible = [...assignments]
    .filter((a) => a.progress < 100 && !skipAssignmentRe.test(a.title))
    .sort(
      (a, b) =>
        calculateUrgency(b.dueAt, b.estimatedHours ?? 2, b.progress) -
        calculateUrgency(a.dueAt, a.estimatedHours ?? 2, a.progress)
    )

  for (const a of eligible) {
    let remainMin = Math.round(
      (a.estimatedHours ?? 2) * (1 - a.progress / 100) * 60
    )
    if (remainMin < MIN_SESSION) continue

    let lastDay = 6
    if (a.dueAt) {
      const due      = new Date(a.dueAt)
      const daysUntil = Math.floor(
        (due.getTime() - startOfToday.getTime()) / 86400000
      )
      lastDay = Math.min(6, Math.max(0, daysUntil))
    }

    for (let d = 0; d <= lastDay && remainMin >= MIN_SESSION; d++) {
      const pool = studyPools[d]
      const idx  = pool.findIndex((s) => s.end - s.start >= MIN_SESSION)
      if (idx === -1) continue

      const slot       = pool[idx]
      const sessionMin = Math.min(MAX_STUDY_SESSION, slot.end - slot.start, remainMin)

      const dayDate = new Date(startOfToday)
      dayDate.setDate(dayDate.getDate() + d)

      allBlocks.push(
        makeBlock(
          dayDate,
          { start: slot.start, end: slot.start + sessionMin },
          {
            id:         a.id,
            type:       "study",
            title:      a.title,
            courseCode: a.courseCode,
            dueAt:      a.dueAt,
          }
        )
      )

      remainMin -= sessionMin
      const after = { start: slot.start + sessionMin, end: slot.end }
      if (after.end - after.start >= MIN_SESSION) {
        pool[idx] = after
      } else {
        pool.splice(idx, 1)
      }
    }
  }

  // ── Phase 3: recreation in the afternoon gap ─────────────────────────────

  for (let d = 0; d < 7; d++) {
    if (recMinLeft <= 0) break
    const pool = studyPools[d]
    if (pool.length === 0) continue

    const dayDate = new Date(startOfToday)
    dayDate.setDate(dayDate.getDate() + d)

    const want = Math.min(recMinLeft, Math.round(recMinTotal / 7))
    const { taken: recSlots } = takeFromFront(pool, want)
    recMinLeft -= totalMin(recSlots)

    for (const slot of recSlots) {
      if (slot.end - slot.start >= MIN_SESSION) {
        allBlocks.push(
          makeBlock(dayDate, slot, {
            id:    "recreation",
            type:  "recreation",
            title: "Recreation",
            dueAt: null,
          })
        )
      }
    }
  }

  return allBlocks.sort(
    (a, b) => a.startTime.getTime() - b.startTime.getTime()
  )
}
