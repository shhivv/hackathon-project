"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  BookOpen,
  ClipboardList,
  AlertTriangle,
  ArrowRight,
  Loader2,
} from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  type TrackedAssignment,
  calculatePriority,
  canvasToTracked,
  getCustomAssignments,
  sortByPriority,
  formatDueDate,
  priorityConfig,
} from "@/lib/assignments"
import type { CanvasAssignment } from "@/lib/canvas"
import { cn } from "@/lib/utils"

export default function DashboardPage() {
  const { user, courses } = useAuth()
  const [assignments, setAssignments] = useState<TrackedAssignment[]>([])
  const [loadingAssignments, setLoadingAssignments] = useState(true)

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

  const activeCourses = courses.filter((c) => c.workflow_state === "available")
  const urgent = assignments.filter(
    (a) =>
      a.progress < 100 &&
      (calculatePriority(a.dueAt) === "critical" ||
        calculatePriority(a.dueAt) === "high"),
  )
  const completedCount = assignments.filter((a) => a.progress >= 100).length
  const overallProgress =
    assignments.length > 0
      ? Math.round((completedCount / assignments.length) * 100)
      : 0

  return (
    <div className="mx-auto max-w-3xl p-6">
      <div className="mb-6">
        <h1 className="text-lg font-semibold">
          Welcome back{user?.name ? `, ${user.name}` : ""}
        </h1>
        <p className="text-muted-foreground text-sm">
          Here&apos;s your study overview
        </p>
      </div>

      {/* Overall progress */}
      <div className="mb-6 rounded-xl border p-5">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm font-medium">Overall Progress</span>
          <span className="text-muted-foreground text-sm tabular-nums">
            {completedCount}/{assignments.length} assignments
          </span>
        </div>
        <Progress value={overallProgress} className="mb-2 h-3" />
        <p className="text-muted-foreground text-xs">
          {overallProgress}% complete
        </p>
      </div>

      {/* Urgent assignments */}
      {urgent.length > 0 && (
        <div className="mb-6">
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
                    config.border,
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{a.title}</p>
                    <div className="flex items-center gap-2">
                      {a.courseName && (
                        <span className="text-muted-foreground text-xs">
                          {a.courseCode || a.courseName}
                        </span>
                      )}
                      <span className={cn("text-xs font-medium", config.color)}>
                        {formatDueDate(a.dueAt)}
                      </span>
                    </div>
                  </div>
                  <div className="ml-3 flex items-center gap-2">
                    <Progress value={a.progress} className="h-1.5 w-16" />
                    <span className="text-muted-foreground text-xs tabular-nums">
                      {a.progress}%
                    </span>
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
        <div className="mb-6 flex items-center gap-2">
          <Loader2 className="text-muted-foreground h-3.5 w-3.5 animate-spin" />
          <span className="text-muted-foreground text-xs">
            Loading assignments...
          </span>
        </div>
      )}

      {/* Courses */}
      <div>
        <div className="mb-3 flex items-center gap-2">
          <BookOpen className="text-primary h-4 w-4" />
          <h2 className="text-sm font-medium">
            Your Courses ({activeCourses.length})
          </h2>
        </div>
        {activeCourses.length === 0 ? (
          <p className="text-muted-foreground text-sm">No active courses.</p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {activeCourses.map((course) => {
              const courseAssignments = assignments.filter(
                (a) => a.courseId === course.id,
              )
              const done = courseAssignments.filter(
                (a) => a.progress >= 100,
              ).length
              return (
                <div key={course.id} className="rounded-xl border p-4">
                  <p className="mb-1 text-sm font-medium">{course.name}</p>
                  <p className="text-muted-foreground text-xs">
                    {course.course_code}
                  </p>
                  {courseAssignments.length > 0 && (
                    <div className="mt-2 flex items-center gap-2">
                      <ClipboardList className="text-muted-foreground h-3 w-3" />
                      <span className="text-muted-foreground text-xs">
                        {done}/{courseAssignments.length} done
                      </span>
                    </div>
                  )}
                  {course.term && (
                    <p className="text-muted-foreground mt-1 text-xs">
                      {course.term.name}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
