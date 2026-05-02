"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  ClipboardList,
  ExternalLink,
  Loader2,
} from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { GradeCalculator } from "@/components/grade-calculator"
import { Progress } from "@/components/ui/progress"
import {
  type TrackedAssignment,
  canvasToTracked,
  calculatePriority,
  formatDueDate,
  priorityConfig,
} from "@/lib/assignments"
import type { CanvasAssignment } from "@/lib/canvas"
import { cn } from "@/lib/utils"

export default function CoursePage() {
  const params = useParams<{ courseId: string }>()
  const courseId = Number(params.courseId)
  const { courses } = useAuth()
  const [assignments, setAssignments] = useState<TrackedAssignment[]>([])
  const [loading, setLoading] = useState(true)

  const course = courses.find((c) => c.id === courseId)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/canvas/assignments")
        if (res.ok) {
          const data: (CanvasAssignment & {
            course_name?: string
            course_code?: string
          })[] = await res.json()
          const courseAssignments = data
            .filter((a) => a.course_id === courseId)
            .map(canvasToTracked)
          setAssignments(courseAssignments)
        }
      } catch {}
      setLoading(false)
    }
    load()
  }, [courseId])

  const completedCount = assignments.filter((a) => a.progress >= 100).length
  const progress =
    assignments.length > 0
      ? Math.round((completedCount / assignments.length) * 100)
      : 0

  const upcoming = assignments
    .filter((a) => a.progress < 100 && a.dueAt)
    .sort((a, b) => new Date(a.dueAt!).getTime() - new Date(b.dueAt!).getTime())
    .slice(0, 5)

  if (!course) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <Link
          href="/dashboard"
          className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
        <p className="text-sm text-muted-foreground">Course not found.</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl p-6">
      {/* Back nav */}
      <Link
        href="/dashboard"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>

      {/* Course header */}
      <div className="mb-6">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-primary/10 p-2.5">
            <BookOpen className="h-6 w-6 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-semibold tracking-tight">
              {course.name}
            </h1>
            <p className="text-sm text-muted-foreground">
              {course.course_code}
            </p>
          </div>
        </div>
      </div>

      {/* Course info cards */}
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        {course.term && (
          <div className="rounded-xl border p-4">
            <div className="mb-1 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              Term
            </div>
            <p className="text-sm font-medium">{course.term.name}</p>
          </div>
        )}
        <div className="rounded-xl border p-4">
          <div className="mb-1 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <ClipboardList className="h-3.5 w-3.5" />
            Assignments
          </div>
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : (
            <p className="text-sm font-medium">
              {completedCount}/{assignments.length} completed
            </p>
          )}
        </div>
        <div className="rounded-xl border p-4">
          <div className="mb-2 text-xs font-medium text-muted-foreground">
            Progress
          </div>
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : (
            <>
              <Progress value={progress} className="mb-1 h-2" />
              <p className="text-xs text-muted-foreground">
                {progress}% complete
              </p>
            </>
          )}
        </div>
      </div>

      {/* Upcoming assignments */}
      {!loading && upcoming.length > 0 && (
        <div className="mb-6">
          <h2 className="mb-3 text-sm font-semibold">Upcoming Assignments</h2>
          <div className="flex flex-col gap-2">
            {upcoming.map((a) => {
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
                    <p className="truncate text-sm font-medium">{a.title}</p>
                    <span className={cn("text-xs font-medium", config.color)}>
                      {formatDueDate(a.dueAt)}
                    </span>
                  </div>
                  <div className="ml-3 flex items-center gap-2">
                    {a.htmlUrl && (
                      <a
                        href={a.htmlUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground transition-colors hover:text-foreground"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                    <Progress value={a.progress} className="h-1.5 w-16" />
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {a.progress}%
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {loading && (
        <div className="mb-6 flex items-center gap-2">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
          <span className="text-xs text-muted-foreground">
            Loading assignments...
          </span>
        </div>
      )}

      {/* Grade Calculator */}
      <GradeCalculator courseId={courseId} />
    </div>
  )
}
