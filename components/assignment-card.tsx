"use client"

import { useState } from "react"
import {
  ExternalLink,
  Trash2,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Clock,
  Info,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  type TrackedAssignment,
  type Priority,
  calculatePriority,
  priorityConfig,
  formatDueDate,
  formatFullDate,
  setProgressOverride,
  setEstimatedHoursOverride,
  getUrgencyReason,
  saveCustomAssignments,
  getCustomAssignments,
} from "@/lib/assignments"

interface AssignmentCardProps {
  assignment: TrackedAssignment
  onProgressChange: (id: string, progress: number) => void
  onEstimatedHoursChange?: (id: string, hours: number) => void
  onDelete?: (id: string) => void
}

export function AssignmentCard({
  assignment,
  onProgressChange,
  onEstimatedHoursChange,
  onDelete,
}: AssignmentCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [localEstimatedHours, setLocalEstimatedHours] = useState(
    assignment.estimatedHours
  )
  const priority: Priority = calculatePriority(assignment.dueAt)
  const config = priorityConfig[priority]
  const isComplete = assignment.progress >= 100
  const urgencyReason = getUrgencyReason(
    assignment.dueAt,
    localEstimatedHours,
    assignment.progress
  )

  function handleProgressClick(value: number) {
    if (assignment.isCanvas) {
      setProgressOverride(assignment.id, value)
    }
    onProgressChange(assignment.id, value)
  }

  function handleEstimatedHoursClick(hours: number) {
    setLocalEstimatedHours(hours)
    setEstimatedHoursOverride(assignment.id, hours)
    if (!assignment.isCanvas) {
      const custom = getCustomAssignments()
      saveCustomAssignments(
        custom.map((a) =>
          a.id === assignment.id ? { ...a, estimatedHours: hours } : a
        )
      )
    }
    onEstimatedHoursChange?.(assignment.id, hours)
  }

  return (
    <div
      className={cn(
        "rounded-xl border p-4 transition-all",
        isComplete ? "border-border bg-muted/30 opacity-70" : config.border
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            {assignment.courseName && (
              <span className="truncate rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium tracking-wide text-primary uppercase">
                {assignment.courseCode || assignment.courseName}
              </span>
            )}
            {!assignment.isCanvas && (
              <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                Custom
              </span>
            )}
          </div>

          <h3
            className={cn("text-sm font-medium", isComplete && "line-through")}
          >
            {assignment.title}
          </h3>

          <div className="mt-1 flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <Clock className="h-3 w-3 text-muted-foreground" />
              <span
                className={cn(
                  "text-xs",
                  priority === "critical"
                    ? "font-medium text-red-500"
                    : "text-muted-foreground"
                )}
              >
                {formatDueDate(assignment.dueAt)}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className={cn("h-1.5 w-1.5 rounded-full", config.dot)} />
              <span className={cn("text-xs font-medium", config.color)}>
                {config.label}
              </span>
            </div>
            {assignment.pointsPossible && (
              <span className="text-xs text-muted-foreground">
                {assignment.pointsPossible} pts
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          {assignment.htmlUrl && (
            <Button variant="ghost" size="icon-xs" asChild>
              <a
                href={assignment.htmlUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="Open in Canvas"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </Button>
          )}
          {!assignment.isCanvas && onDelete && (
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => onDelete(assignment.id)}
              title="Delete"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-3 flex items-center gap-3">
        <Progress value={assignment.progress} className="h-2 flex-1" />
        <div className="flex items-center gap-1">
          {isComplete ? (
            <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
          ) : null}
          <span
            className={cn(
              "text-xs font-medium tabular-nums",
              isComplete ? "text-green-500" : "text-muted-foreground"
            )}
          >
            {assignment.progress}%
          </span>
        </div>
      </div>

      {/* Expanded section */}
      {expanded && (
        <div className="mt-3 border-t pt-3">
          {assignment.description && (
            <p className="mb-3 text-xs leading-relaxed text-muted-foreground">
              {assignment.description.replace(/<[^>]*>/g, "").slice(0, 200)}
              {(assignment.description.length ?? 0) > 200 ? "..." : ""}
            </p>
          )}

          {assignment.dueAt && (
            <p className="mb-3 text-xs text-muted-foreground">
              {formatFullDate(assignment.dueAt)}
            </p>
          )}

          {urgencyReason && !isComplete && (
            <p className="mb-3 flex items-start gap-1.5 text-xs text-muted-foreground">
              <Info className="mt-0.5 h-3 w-3 shrink-0" />
              {urgencyReason}
            </p>
          )}

          {!assignment.submitted && (
            <div className="mb-3 flex flex-col gap-2">
              <span className="text-xs text-muted-foreground">
                Set progress:
              </span>
              <div className="flex gap-1.5">
                {[0, 25, 50, 75, 100].map((v) => (
                  <Button
                    key={v}
                    variant={assignment.progress === v ? "default" : "outline"}
                    size="xs"
                    onClick={() => handleProgressClick(v)}
                    className="tabular-nums"
                  >
                    {v}%
                  </Button>
                ))}
              </div>
            </div>
          )}

          {!isComplete && (
            <div className="flex flex-col gap-2">
              <span className="text-xs text-muted-foreground">
                Estimated hours:{" "}
                <span className="font-medium text-foreground">
                  {localEstimatedHours}h
                </span>
              </span>
              <div className="flex flex-wrap gap-1.5">
                {[0.5, 1, 2, 3, 4, 6, 8].map((h) => (
                  <Button
                    key={h}
                    variant={
                      localEstimatedHours === h ? "default" : "outline"
                    }
                    size="xs"
                    onClick={() => handleEstimatedHoursClick(h)}
                    className="tabular-nums"
                  >
                    {h}h
                  </Button>
                ))}
              </div>
            </div>
          )}

          {assignment.submitted && (
            <p className="flex items-center gap-1.5 text-xs text-green-500">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Submitted
            </p>
          )}
        </div>
      )}
    </div>
  )
}
