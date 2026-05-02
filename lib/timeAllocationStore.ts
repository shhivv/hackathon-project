import type { TimeAllocation } from "@/types/timeAllocation"

const KEY = "planora.timeAllocation"

function isLegacyFormat(data: unknown): boolean {
  return (
    typeof data === "object" &&
    data !== null &&
    "job" in (data as Record<string, unknown>)
  )
}

export function getTimeAllocation(): TimeAllocation | null {
  if (typeof window === "undefined") return null
  const raw = localStorage.getItem(KEY)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw)
    if (isLegacyFormat(parsed)) {
      localStorage.removeItem(KEY)
      return null
    }
    return parsed as TimeAllocation
  } catch {
    return null
  }
}

export function saveTimeAllocation(value: TimeAllocation): void {
  localStorage.setItem(KEY, JSON.stringify(value))
}

export function hasCompletedTimeAllocation(): boolean {
  if (typeof window === "undefined") return false
  const raw = localStorage.getItem(KEY)
  if (!raw) return false
  try {
    const parsed = JSON.parse(raw)
    if (isLegacyFormat(parsed)) {
      localStorage.removeItem(KEY)
      return false
    }
    return true
  } catch {
    return false
  }
}
