"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  AlertTriangle,
  BookOpen,
  Calendar,
  CheckCircle2,
  ClipboardList,
  Clock,
  Filter,
  Loader2,
} from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { AssignmentCard } from "@/components/assignment-card"
import { GradeCalculator } from "@/components/grade-calculator"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  type TrackedAssignment,
  canvasToTracked,
  calculatePriority,
  sortByPriority,
  setProgressOverride,
} from "@/lib/assignments"
import type { CanvasAssignment } from "@/lib/canvas"

type TabFilter = "all" | "upcoming" | "overdue" | "completed"

export default function CoursePage() {
  const params = useParams<{ courseId: string }>()
  const courseId = Number(params.courseId)
  const { courses } = useAuth()
  const [assignments, setAssignments] = useState<TrackedAssignment[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<TabFilter>("upcoming")

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
          setAssignments(sortByPriority(courseAssignments))
        }
      } catch {}
      setLoading(false)
    }
    load()
  }, [courseId])

  function handleProgressChange(id: string, progress: number) {
    setAssignments((prev) =>
      sortByPriority(prev.map((a) => (a.id === id ? { ...a, progress } : a)))
    )
    if (id.startsWith("canvas-")) {
      setProgressOverride(id, progress)
    }
  }

  const completedCount = assignments.filter((a) => a.progress >= 100).length
  const progress =
    assignments.length > 0
      ? Math.round((completedCount / assignments.length) * 100)
      : 0

  const stats = {
    total: assignments.length,
    overdue: assignments.filter(
      (a) => calculatePriority(a.dueAt) === "critical" && a.progress < 100
    ).length,
    dueSoon: assignments.filter(
      (a) => calculatePriority(a.dueAt) === "high" && a.progress < 100
    ).length,
    completed: completedCount,
  }

  const filtered = assignments.filter((a) => {
    const priority = calculatePriority(a.dueAt)
    switch (tab) {
      case "upcoming":
        return (
          a.progress < 100 &&
          (priority === "high" || priority === "medium" || priority === "low")
        )
      case "overdue":
        return a.progress < 100 && priority === "critical"
      case "completed":
        return a.progress >= 100
      default:
        return true
    }
  })

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

      {/* Assignments */}
      {loading ? (
        <div className="mb-6 flex items-center gap-2">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
          <span className="text-xs text-muted-foreground">
            Loading assignments...
          </span>
        </div>
      ) : (
        <div className="mb-6">
          <h2 className="mb-3 text-sm font-semibold">Assignments</h2>

          {/* Stats */}
          <div className="mb-4 grid grid-cols-4 gap-3">
            <div className="rounded-xl border p-3">
              <div className="mb-1 flex items-center gap-1.5 text-foreground">
                <ClipboardList className="h-4 w-4" />
                <span className="text-xs font-medium">Total</span>
              </div>
              <p className="text-2xl font-semibold tabular-nums">
                {stats.total}
              </p>
            </div>
            <div className="rounded-xl border p-3">
              <div className="mb-1 flex items-center gap-1.5 text-red-500">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-xs font-medium">Overdue</span>
              </div>
              <p className="text-2xl font-semibold tabular-nums">
                {stats.overdue}
              </p>
            </div>
            <div className="rounded-xl border p-3">
              <div className="mb-1 flex items-center gap-1.5 text-orange-500">
                <Clock className="h-4 w-4" />
                <span className="text-xs font-medium">Due Soon</span>
              </div>
              <p className="text-2xl font-semibold tabular-nums">
                {stats.dueSoon}
              </p>
            </div>
            <div className="rounded-xl border p-3">
              <div className="mb-1 flex items-center gap-1.5 text-green-500">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-xs font-medium">Done</span>
              </div>
              <p className="text-2xl font-semibold tabular-nums">
                {stats.completed}
              </p>
            </div>
          </div>

          {/* Filter tabs */}
          <Tabs
            value={tab}
            onValueChange={(v) => setTab(v as TabFilter)}
            className="mb-4"
          >
            <TabsList className="w-full">
              <TabsTrigger value="all" className="flex-1 gap-1.5">
                <Filter className="h-3 w-3" />
                All
              </TabsTrigger>
              <TabsTrigger value="upcoming" className="flex-1 gap-1.5">
                <Clock className="h-3 w-3" />
                Upcoming
              </TabsTrigger>
              <TabsTrigger value="overdue" className="flex-1 gap-1.5">
                <AlertTriangle className="h-3 w-3" />
                Overdue
              </TabsTrigger>
              <TabsTrigger value="completed" className="flex-1 gap-1.5">
                <CheckCircle2 className="h-3 w-3" />
                Completed
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Assignment list */}
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-12">
              <ClipboardList className="mb-3 h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {tab === "all"
                  ? "No assignments yet"
                  : `No ${tab} assignments`}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {filtered.map((assignment) => (
                <AssignmentCard
                  key={assignment.id}
                  assignment={assignment}
                  onProgressChange={handleProgressChange}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Grade Calculator */}
      <GradeCalculator courseId={courseId} />
    </div>
  )
}
