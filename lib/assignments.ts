import type { CanvasAssignment } from "./canvas"

export type Priority = "critical" | "high" | "medium" | "low" | "none"

export interface TrackedAssignment {
  id: string
  title: string
  description?: string
  courseId?: number
  courseName?: string
  courseCode?: string
  dueAt: string | null
  progress: number
  isCanvas: boolean
  canvasId?: number
  pointsPossible?: number
  htmlUrl?: string
  submitted?: boolean
  createdAt: string
}

const PROGRESS_KEY = "assignment-progress"
const CUSTOM_KEY = "assignment-custom"

export function calculatePriority(dueAt: string | null): Priority {
  if (!dueAt) return "none"
  const now = new Date()
  const due = new Date(dueAt)
  const hours = (due.getTime() - now.getTime()) / (1000 * 60 * 60)

  if (hours < 0) return "critical"
  if (hours <= 24) return "high"
  if (hours <= 72) return "medium"
  if (hours <= 168) return "low"
  return "none"
}

export const priorityConfig: Record<
  Priority,
  { label: string; color: string; bg: string; border: string; dot: string }
> = {
  critical: {
    label: "Overdue",
    color: "text-red-500",
    bg: "bg-red-500/10",
    border: "border-red-500/30",
    dot: "bg-red-500",
  },
  high: {
    label: "Due Soon",
    color: "text-orange-500",
    bg: "bg-orange-500/10",
    border: "border-orange-500/30",
    dot: "bg-orange-500",
  },
  medium: {
    label: "Upcoming",
    color: "text-yellow-500",
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/30",
    dot: "bg-yellow-500",
  },
  low: {
    label: "Later",
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
    dot: "bg-blue-500",
  },
  none: {
    label: "No Due Date",
    color: "text-muted-foreground",
    bg: "bg-muted",
    border: "border-border",
    dot: "bg-muted-foreground",
  },
}

export function formatDueDate(dueAt: string | null): string {
  if (!dueAt) return "No due date"
  const due = new Date(dueAt)
  const now = new Date()
  const diff = due.getTime() - now.getTime()
  const hours = Math.abs(diff) / (1000 * 60 * 60)
  const days = Math.floor(hours / 24)

  if (diff < 0) {
    if (hours < 1) return "Just overdue"
    if (hours < 24) return `${Math.floor(hours)}h overdue`
    return `${days}d overdue`
  }

  if (hours < 1) return "Due in < 1h"
  if (hours < 24) return `Due in ${Math.floor(hours)}h`
  if (days === 1) return "Due tomorrow"
  if (days < 7) return `Due in ${days} days`
  return `Due ${due.toLocaleDateString("en-AU", { month: "short", day: "numeric" })}`
}

export function formatFullDate(dueAt: string | null): string {
  if (!dueAt) return "No due date"
  return new Date(dueAt).toLocaleDateString("en-AU", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

// --- localStorage helpers ---

export function getProgressOverrides(): Record<string, number> {
  if (typeof window === "undefined") return {}
  const stored = localStorage.getItem(PROGRESS_KEY)
  return stored ? JSON.parse(stored) : {}
}

export function setProgressOverride(id: string, progress: number) {
  const overrides = getProgressOverrides()
  overrides[id] = progress
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(overrides))
}

export function getCustomAssignments(): TrackedAssignment[] {
  if (typeof window === "undefined") return []
  const stored = localStorage.getItem(CUSTOM_KEY)
  return stored ? JSON.parse(stored) : []
}

export function saveCustomAssignments(assignments: TrackedAssignment[]) {
  localStorage.setItem(CUSTOM_KEY, JSON.stringify(assignments))
}

export function addCustomAssignment(
  assignment: Omit<TrackedAssignment, "id" | "isCanvas" | "createdAt" | "progress">,
): TrackedAssignment {
  const custom = getCustomAssignments()
  const newAssignment: TrackedAssignment = {
    ...assignment,
    id: `custom-${Date.now()}`,
    isCanvas: false,
    progress: 0,
    createdAt: new Date().toISOString(),
  }
  custom.push(newAssignment)
  saveCustomAssignments(custom)
  return newAssignment
}

export function deleteCustomAssignment(id: string) {
  const custom = getCustomAssignments().filter((a) => a.id !== id)
  saveCustomAssignments(custom)
}

export function canvasToTracked(
  assignment: CanvasAssignment & { course_name?: string; course_code?: string },
): TrackedAssignment {
  const overrides = getProgressOverrides()
  const submitted =
    assignment.submission?.workflow_state === "submitted" ||
    assignment.submission?.workflow_state === "graded" ||
    assignment.has_submitted_submissions

  return {
    id: `canvas-${assignment.id}`,
    title: assignment.name,
    description: assignment.description || undefined,
    courseId: assignment.course_id,
    courseName: assignment.course_name,
    courseCode: assignment.course_code,
    dueAt: assignment.due_at,
    progress: submitted ? 100 : (overrides[`canvas-${assignment.id}`] ?? 0),
    isCanvas: true,
    canvasId: assignment.id,
    pointsPossible: assignment.points_possible ?? undefined,
    htmlUrl: assignment.html_url,
    submitted,
    createdAt: new Date().toISOString(),
  }
}

export function sortByPriority(assignments: TrackedAssignment[]): TrackedAssignment[] {
  const order: Record<Priority, number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
    none: 4,
  }
  return [...assignments].sort((a, b) => {
    if (a.progress >= 100 && b.progress < 100) return 1
    if (a.progress < 100 && b.progress >= 100) return -1
    const pa = order[calculatePriority(a.dueAt)]
    const pb = order[calculatePriority(b.dueAt)]
    if (pa !== pb) return pa - pb
    if (a.dueAt && b.dueAt) return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime()
    if (a.dueAt) return -1
    if (b.dueAt) return 1
    return 0
  })
}

// --- Browser notifications ---

export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === "undefined" || !("Notification" in window)) return false
  if (Notification.permission === "granted") return true
  const result = await Notification.requestPermission()
  return result === "granted"
}

export function checkDueReminders(assignments: TrackedAssignment[]) {
  if (typeof window === "undefined" || !("Notification" in window)) return
  if (Notification.permission !== "granted") return

  const REMINDED_KEY = "assignment-reminded"
  const reminded: string[] = JSON.parse(
    localStorage.getItem(REMINDED_KEY) || "[]",
  )

  const newReminders: string[] = []

  assignments.forEach((a) => {
    if (!a.dueAt || a.progress >= 100 || reminded.includes(a.id)) return
    const priority = calculatePriority(a.dueAt)
    if (priority === "critical" || priority === "high") {
      new Notification(
        priority === "critical" ? "Assignment Overdue!" : "Assignment Due Soon!",
        {
          body: `${a.title}${a.courseName ? ` — ${a.courseName}` : ""}\n${formatDueDate(a.dueAt)}`,
          icon: "/favicon.ico",
        },
      )
      newReminders.push(a.id)
    }
  })

  if (newReminders.length > 0) {
    localStorage.setItem(
      REMINDED_KEY,
      JSON.stringify([...reminded, ...newReminders]),
    )
  }
}
