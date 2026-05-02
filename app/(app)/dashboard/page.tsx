"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  BookOpen,
  ClipboardList,
  AlertTriangle,
  ArrowRight,
  Loader2,
  Calendar,
  Clock,
  MapPin,
  Wrench,
  Check,
} from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  type TrackedAssignment,
  calculatePriority,
  canvasToTracked,
  getCustomAssignments,
  saveCustomAssignments,
  setProgressOverride,
  sortByPriority,
  formatDueDate,
  priorityConfig,
} from "@/lib/assignments"
import type { CanvasAssignment } from "@/lib/canvas"
import { cn } from "@/lib/utils"
import { YourWeekPanel } from "@/components/YourWeekPanel"
import { getTimetable } from "@/lib/timetableStore"
import {
  getNextClassDay,
  getSubjectShortName,
  getActivityLabel,
  isWorkshopOrTutorial,
} from "@/lib/timetableParser"
import type { TimetableEntry } from "@/types/timetable"

export default function DashboardPage() {
  const { user, courses } = useAuth()
  const [assignments, setAssignments] = useState<TrackedAssignment[]>([])
  const [loadingAssignments, setLoadingAssignments] = useState(true)
  const [nextClasses, setNextClasses] = useState<TimetableEntry[]>([])
  const [nextClassLabel, setNextClassLabel] = useState("")
  const [nextClassDateKey, setNextClassDateKey] = useState("")
  const [skippedIndices, setSkippedIndices] = useState<Set<number>>(new Set())

  useEffect(() => {
    const timetable = getTimetable()
    if (timetable && timetable.length > 0) {
      const result = getNextClassDay(timetable)
      if (result) {
        const today = new Date()
        const diffDays = Math.round(
          (result.date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        )
        const prefix = diffDays === 1 ? "Tomorrow" : result.date.toLocaleDateString("en-AU", { weekday: "long" })
        setNextClassLabel(
          `${prefix} — ${result.date.toLocaleDateString("en-AU", {
            month: "short",
            day: "numeric",
          })}`
        )
        setNextClasses(result.entries)

        const dateKey = result.date.toISOString().slice(0, 10)
        setNextClassDateKey(dateKey)
        try {
          const stored = JSON.parse(
            localStorage.getItem("planora.skippedClasses") || "{}"
          )
          if (stored.date === dateKey && Array.isArray(stored.indices)) {
            setSkippedIndices(new Set(stored.indices))
          } else {
            localStorage.removeItem("planora.skippedClasses")
          }
        } catch {
          localStorage.removeItem("planora.skippedClasses")
        }
      }
    }
  }, [])

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/canvas/assignments")
        let canvas: TrackedAssignment[] = []
        if (res.ok) {
          const data: (CanvasAssignment & {
            course_name?: string
            course_code?: string
          })[] = await res.json()
          canvas = data.map(canvasToTracked)
        }
        const custom = getCustomAssignments()
        setAssignments(sortByPriority([...canvas, ...custom]))
      } catch {
        setAssignments(sortByPriority(getCustomAssignments()))
      } finally {
        setLoadingAssignments(false)
      }
    }
    load()
  }, [])

  function handleProgressChange(id: string, progress: number) {
    setAssignments((prev) =>
      sortByPriority(prev.map((a) => (a.id === id ? { ...a, progress } : a)))
    )
    if (id.startsWith("canvas-")) {
      setProgressOverride(id, progress)
    } else {
      const custom = getCustomAssignments()
      saveCustomAssignments(
        custom.map((a) => (a.id === id ? { ...a, progress } : a))
      )
    }
  }

  const activeCourses = courses.filter((c) => c.workflow_state === "available")
  const urgent = assignments.filter(
    (a) =>
      a.progress < 100 &&
      (calculatePriority(a.dueAt) === "critical" ||
        calculatePriority(a.dueAt) === "high")
  )
  const completedCount = assignments.filter((a) => a.progress >= 100).length
  const overallProgress =
    assignments.length > 0
      ? Math.round((completedCount / assignments.length) * 100)
      : 0

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="mb-6">
        <h1 className="text-lg font-semibold">
          Welcome back{user?.name ? `, ${user.name}` : ""}
        </h1>
        <p className="text-sm text-muted-foreground">
          Here&apos;s your study overview
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left column */}
        <div className="flex flex-col gap-6">
          <YourWeekPanel />

          {/* Overall progress */}
          <div className="rounded-xl border p-5">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-medium">Overall Progress</span>
              <span className="text-sm text-muted-foreground tabular-nums">
                {completedCount}/{assignments.length} assignments
              </span>
            </div>
            <Progress value={overallProgress} className="mb-2 h-3" />
            <p className="text-xs text-muted-foreground">
              {overallProgress}% complete
            </p>
          </div>

          {/* Urgent assignments */}
          {urgent.length > 0 && (
            <div>
              <div className="mb-3 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-500" />
                <h2 className="text-sm font-medium">Needs Attention</h2>
              </div>
              <div className="flex flex-col gap-2">
                {urgent.slice(0, 5).map((a) => {
                  const priority = calculatePriority(a.dueAt)
                  const config = priorityConfig[priority]
                  return (
                    <div
                      key={a.id}
                      className={cn(
                        "flex items-center justify-between rounded-lg border p-3",
                        config.border
                      )}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {a.title}
                        </p>
                        <div className="flex items-center gap-2">
                          {a.courseName && (
                            <span className="text-xs text-muted-foreground">
                              {a.courseCode || a.courseName}
                            </span>
                          )}
                          <span
                            className={cn("text-xs font-medium", config.color)}
                          >
                            {formatDueDate(a.dueAt)}
                          </span>
                        </div>
                      </div>
                      <div className="ml-3 flex items-center gap-2">
                        <Progress value={a.progress} className="h-1.5 w-16" />
                        <span className="text-xs text-muted-foreground tabular-nums">
                          {a.progress}%
                        </span>
                        <button
                          onClick={() => handleProgressChange(a.id, 100)}
                          title="Mark complete"
                          className="text-muted-foreground transition-colors hover:text-green-500"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
              <Link href="/assignments" className="mt-2 inline-block">
                <Button variant="ghost" size="sm" className="gap-1.5 text-xs">
                  View all assignments
                  <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>
          )}

          {loadingAssignments && (
            <div className="flex items-center gap-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                Loading assignments...
              </span>
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-6">
          {/* Next day's schedule */}
          {nextClasses.length > 0 &&
            nextClasses.some((_, i) => !skippedIndices.has(i)) && (
              <div>
                <div className="mb-3 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  <h2 className="text-sm font-medium">{nextClassLabel}</h2>
                </div>
                <div className="flex flex-col gap-2">
                  {nextClasses.map((entry, i) => {
                    if (skippedIndices.has(i)) return null
                    const needsPrep = isWorkshopOrTutorial(entry)
                    return (
                      <div
                        key={i}
                        className={cn(
                          "rounded-lg border p-3",
                          needsPrep && "border-amber-500/40 bg-amber-500/5"
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium">
                              {getSubjectShortName(entry.description)}
                            </p>
                            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {entry.time} &middot; {entry.duration}
                              </span>
                              <span className="rounded bg-muted px-1.5 py-0.5 text-xs font-medium">
                                {getActivityLabel(entry.group)}
                              </span>
                              {entry.location && entry.location !== "-" && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {entry.location
                                    .split("_")
                                    .slice(0, 2)
                                    .join(" ")}
                                </span>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              setSkippedIndices((prev) => {
                                const next = new Set(prev)
                                next.add(i)
                                localStorage.setItem(
                                  "planora.skippedClasses",
                                  JSON.stringify({
                                    date: nextClassDateKey,
                                    indices: [...next],
                                  })
                                )
                                return next
                              })
                            }}
                            className="shrink-0 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                          >
                            Skip
                          </button>
                        </div>
                        {needsPrep && (
                          <div className="mt-2 flex items-center gap-1.5 text-xs font-medium text-amber-600 dark:text-amber-400">
                            <Wrench className="h-3 w-3" />
                            Complete pre-req work before this{" "}
                            {getActivityLabel(entry.group).toLowerCase()}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

          {/* Courses */}
          <div>
            <div className="mb-3 flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-medium">
                Your Courses ({activeCourses.length})
              </h2>
            </div>
            {activeCourses.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No active courses.
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {activeCourses.map((course) => {
                  const courseAssignments = assignments.filter(
                    (a) => a.courseId === course.id
                  )
                  const done = courseAssignments.filter(
                    (a) => a.progress >= 100
                  ).length
                  return (
                    <Link
                      key={course.id}
                      href={`/courses/${course.id}`}
                      className="rounded-xl border p-4 transition-colors hover:bg-muted/50"
                    >
                      <p className="mb-1 text-sm font-medium">{course.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {course.course_code}
                      </p>
                      {courseAssignments.length > 0 && (
                        <div className="mt-2 flex items-center gap-2">
                          <ClipboardList className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {done}/{courseAssignments.length} done
                          </span>
                        </div>
                      )}
                      {course.term && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {course.term.name}
                        </p>
                      )}
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
