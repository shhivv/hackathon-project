"use client"

import { useState, useEffect } from "react"
import {
  ClipboardList,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Filter,
  Loader2,
} from "lucide-react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AssignmentCard } from "@/components/assignment-card"
import { AddAssignmentDialog } from "@/components/add-assignment-dialog"
import type { CanvasAssignment } from "@/lib/canvas"
import {
  type TrackedAssignment,
  calculatePriority,
  canvasToTracked,
  getCustomAssignments,
  saveCustomAssignments,
  setProgressOverride,
  sortByPriority,
  checkDueReminders,
  requestNotificationPermission,
  deleteCustomAssignment,
} from "@/lib/assignments"

type TabFilter = "all" | "upcoming" | "overdue" | "completed"

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState<TrackedAssignment[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<TabFilter>("all")

  useEffect(() => {
    let ignore = false

    async function load() {
      try {
        const res = await fetch("/api/canvas/assignments")
        if (ignore) return

        let canvasAssignments: TrackedAssignment[] = []
        if (res.ok) {
          const data: (CanvasAssignment & {
            course_name?: string
            course_code?: string
          })[] = await res.json()
          canvasAssignments = data.map(canvasToTracked)
        }

        const custom = getCustomAssignments()
        const all = sortByPriority([...canvasAssignments, ...custom])
        if (!ignore) {
          setAssignments(all)
          setLoading(false)
          requestNotificationPermission().then(() => checkDueReminders(all))
        }
      } catch {
        if (!ignore) {
          setAssignments(sortByPriority(getCustomAssignments()))
          setLoading(false)
        }
      }
    }

    load()
    return () => {
      ignore = true
    }
  }, [])

  function handleProgressChange(id: string, progress: number) {
    setAssignments((prev) =>
      sortByPriority(prev.map((a) => (a.id === id ? { ...a, progress } : a)))
    )

    if (id.startsWith("canvas-")) {
      setProgressOverride(id, progress)
    } else {
      const custom = getCustomAssignments()
      const updated = custom.map((a) => (a.id === id ? { ...a, progress } : a))
      saveCustomAssignments(updated)
    }
  }

  function handleAdd(assignment: TrackedAssignment) {
    setAssignments((prev) => sortByPriority([...prev, assignment]))
  }

  function handleDelete(id: string) {
    deleteCustomAssignment(id)
    setAssignments((prev) => prev.filter((a) => a.id !== id))
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

  const stats = {
    total: assignments.length,
    overdue: assignments.filter(
      (a) => calculatePriority(a.dueAt) === "critical" && a.progress < 100
    ).length,
    dueSoon: assignments.filter(
      (a) => calculatePriority(a.dueAt) === "high" && a.progress < 100
    ).length,
    completed: assignments.filter((a) => a.progress >= 100).length,
  }

  if (loading) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <div className="flex items-center gap-3">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            Loading assignments...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Assignment Tracker</h1>
          <p className="text-sm text-muted-foreground">
            Track deadlines and progress across all your courses
          </p>
        </div>
        <AddAssignmentDialog onAdd={handleAdd} />
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-4 gap-3">
        <StatCard
          icon={<ClipboardList className="h-4 w-4" />}
          label="Total"
          value={stats.total}
          color="text-foreground"
        />
        <StatCard
          icon={<AlertTriangle className="h-4 w-4" />}
          label="Overdue"
          value={stats.overdue}
          color="text-red-500"
        />
        <StatCard
          icon={<Clock className="h-4 w-4" />}
          label="Due Soon"
          value={stats.dueSoon}
          color="text-orange-500"
        />
        <StatCard
          icon={<CheckCircle2 className="h-4 w-4" />}
          label="Done"
          value={stats.completed}
          color="text-green-500"
        />
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
            {tab === "all" ? "No assignments yet" : `No ${tab} assignments`}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((assignment) => (
            <AssignmentCard
              key={assignment.id}
              assignment={assignment}
              onProgressChange={handleProgressChange}
              onDelete={!assignment.isCanvas ? handleDelete : undefined}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode
  label: string
  value: number
  color: string
}) {
  return (
    <div className="rounded-xl border p-3">
      <div className={`mb-1 flex items-center gap-1.5 ${color}`}>
        {icon}
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p className="text-2xl font-semibold tabular-nums">{value}</p>
    </div>
  )
}
