import type { TimetableEntry } from "@/types/timetable"

const KEY = "planora.timetable"

export function getTimetable(): TimetableEntry[] | null {
  if (typeof window === "undefined") return null
  const raw = localStorage.getItem(KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as TimetableEntry[]
  } catch {
    return null
  }
}

export function saveTimetable(entries: TimetableEntry[]): void {
  localStorage.setItem(KEY, JSON.stringify(entries))
}

export function hasCompletedTimetable(): boolean {
  if (typeof window === "undefined") return false
  return localStorage.getItem(KEY) !== null
}
