export type DayName = "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun"
export type BufferMins = 15 | 30 | 45 | 60

export const ALL_DAYS: DayName[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
export const BUFFER_OPTIONS: BufferMins[] = [15, 30, 45, 60]

export interface WorkShift {
  id: string
  title: string
  workDays: DayName[]
  shiftStart: string     // "HH:MM" 24-hour
  shiftEnd: string       // "HH:MM" 24-hour
  commuteMins: number    // one-way; 0 = remote
  postBufferMins: BufferMins
}

/** Minutes since midnight for a "HH:MM" string. */
export function shiftParseMin(timeStr: string): number {
  const [h, m = "0"] = timeStr.split(":")
  return parseInt(h, 10) * 60 + parseInt(m, 10)
}

/** Computed weekly shift hours (shift duration × active days, excluding commute). */
export function shiftHoursPerWeek(shift: WorkShift): number {
  const durationH =
    (shiftParseMin(shift.shiftEnd) - shiftParseMin(shift.shiftStart)) / 60
  return Math.round(durationH * shift.workDays.length * 10) / 10
}

/** Full unavailable window: [shiftStart - commute, shiftEnd + commute + buffer] in minutes. */
export function blockedWindow(shift: WorkShift): { start: number; end: number } {
  return {
    start: Math.max(0, shiftParseMin(shift.shiftStart) - shift.commuteMins),
    end: Math.min(
      24 * 60,
      shiftParseMin(shift.shiftEnd) + shift.commuteMins + shift.postBufferMins
    ),
  }
}
