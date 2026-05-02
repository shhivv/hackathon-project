import type { TimeAllocation } from "@/types/timeAllocation"

const KEY = "planora.timeAllocation"

export function getTimeAllocation(): TimeAllocation | null {
  if (typeof window === "undefined") return null
  const raw = localStorage.getItem(KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as TimeAllocation
  } catch {
    return null
  }
}

export function saveTimeAllocation(value: TimeAllocation): void {
  localStorage.setItem(KEY, JSON.stringify(value))
}

export function hasCompletedTimeAllocation(): boolean {
  if (typeof window === "undefined") return false
  return localStorage.getItem(KEY) !== null
}
