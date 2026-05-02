// Mounted in app/(app)/layout.tsx > AuthGate when !hasCompletedTimeAllocation().
"use client"

import { useState, useEffect, useRef } from "react"
import { Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { saveTimeAllocation } from "@/lib/timeAllocationStore"
import { saveTimetable } from "@/lib/timetableStore"
import {
  parseTimetable,
  getActivityLabel,
  getSubjectShortName,
} from "@/lib/timetableParser"
import { WorkShiftForm } from "@/components/WorkShiftForm"
import type { TimeAllocation } from "@/types/timeAllocation"
import type { WorkShift } from "@/types/workSchedule"
import { shiftHoursPerWeek } from "@/types/workSchedule"
import type { TimetableEntry } from "@/types/timetable"

type Step = 1 | 2 | 3 | "done"

function Shell({
  fadeKey,
  children,
}: {
  fadeKey: number
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <div
        key={fadeKey}
        className="flex w-full max-w-sm animate-in flex-col gap-6 duration-200 fade-in"
      >
        {children}
      </div>
    </div>
  )
}

interface Props {
  initialData?: TimeAllocation | null
  onComplete: () => void
}

export function TimeAllocationFlow({ initialData, onComplete }: Props) {
  const [step, setStep]       = useState<Step>(1)
  const [fadeKey, setFadeKey] = useState(0)

  // ── Step 1 state ──────────────────────────────────────────────
  const [hasJob, setHasJob]           = useState<boolean | null>(() =>
    initialData != null ? initialData.jobs.length > 0 : null
  )
  const [jobs, setJobs]               = useState<WorkShift[]>(
    initialData?.jobs ?? []
  )
  // null = list view; "new" = adding; WorkShift = editing existing
  const [editingShift, setEditingShift] = useState<WorkShift | "new" | null>(null)

  // ── Step 2 state ──────────────────────────────────────────────
  const [recHours, setRecHours]       = useState(
    initialData?.recreationHoursPerWeek != null
      ? String(initialData.recreationHoursPerWeek)
      : ""
  )
  const [recHoursError, setRecHoursError] = useState("")

  // ── Step 3 state (timetable) ──────────────────────────────────
  const [timetableText, setTimetableText]   = useState("")
  const [parsedEntries, setParsedEntries]   = useState<TimetableEntry[]>([])
  const [timetableError, setTimetableError] = useState("")
  const timetableRef = useRef<HTMLTextAreaElement>(null)

  // Done state
  const [savedData, setSavedData] = useState<TimeAllocation | null>(null)

  const yesButtonRef  = useRef<HTMLButtonElement>(null)
  const recInputRef   = useRef<HTMLInputElement>(null)
  const looksGoodRef  = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (step === 1) yesButtonRef.current?.focus()
    else if (step === 2) recInputRef.current?.focus()
    else if (step === 3) timetableRef.current?.focus()
    else if (step === "done") looksGoodRef.current?.focus()
  }, [step, fadeKey])

  function advance(next: Step) {
    setFadeKey((k) => k + 1)
    setStep(next)
  }

  // ── Step 1 helpers ────────────────────────────────────────────

  function handleToggleYes() {
    setHasJob(true)
    if (jobs.length === 0) setEditingShift("new")
  }

  function handleToggleNo() {
    setHasJob(false)
    setEditingShift(null)
  }

  function handleShiftSave(shift: WorkShift) {
    setJobs((prev) => {
      if (editingShift === "new") return [...prev, shift]
      return prev.map((j) => (j.id === shift.id ? shift : j))
    })
    setEditingShift(null)
  }

  function handleShiftDelete(id: string) {
    const next = jobs.filter((j) => j.id !== id)
    setJobs(next)
    if (next.length === 0) setEditingShift("new")
  }

  function handleStep1Continue() {
    if (editingShift !== null) return
    if (hasJob === false || (hasJob === true && jobs.length > 0)) advance(2)
  }

  const step1Enabled =
    editingShift === null &&
    (hasJob === false || (hasJob === true && jobs.length > 0))

  // ── Step 2 helpers ────────────────────────────────────────────

  function validateStep2(): boolean {
    const hrs = Number(recHours)
    if (recHours === "") { setRecHoursError("Enter the hours."); return false }
    if (hrs < 0)         { setRecHoursError("Hours can't be negative."); return false }
    return true
  }

  function handleSave() {
    if (!validateStep2()) return
    const data: TimeAllocation = {
      jobs: hasJob === true ? jobs : [],
      recreationHoursPerWeek: Number(recHours),
      updatedAt: new Date().toISOString(),
    }
    saveTimeAllocation(data)
    setSavedData(data)
    advance(3)
  }

  // ── Step 3 helpers ────────────────────────────────────────────

  function handleTimetableParse() {
    const entries = parseTimetable(timetableText)
    if (entries.length === 0) {
      setTimetableError(
        "No entries found. Paste the full table including all columns, separated by tabs."
      )
      return
    }
    setTimetableError("")
    setParsedEntries(entries)
  }

  function handleTimetableSave() {
    saveTimetable(parsedEntries)
    advance("done")
  }

  function handleTimetableSkip() {
    advance("done")
  }

  // ── Step 3 ────────────────────────────────────────────────────

  if (step === 3) {
    return (
      <Shell fadeKey={fadeKey}>
        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
            3 of 3
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">
            Your timetable
          </h1>
          <p className="text-sm text-muted-foreground">
            Export your timetable from{" "}
            <a
              href="https://mytimetable.anu.edu.au/even/student"
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground underline underline-offset-2"
            >
              mytimetable.anu.edu.au/even/student
            </a>{" "}
            — click <strong>Export</strong> then{" "}
            <strong>Export as text</strong>, then paste below.
          </p>
        </div>

        {parsedEntries.length === 0 ? (
          <>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="timetable-input" className="text-sm font-medium">
                Paste timetable
              </label>
              <textarea
                id="timetable-input"
                ref={timetableRef}
                value={timetableText}
                onChange={(e) => {
                  setTimetableText(e.target.value)
                  if (timetableError) setTimetableError("")
                }}
                placeholder="Subject Code&#9;Description&#9;Group&#9;Activity&#9;Day&#9;Time&#9;..."
                rows={6}
                className={cn(
                  "flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground",
                  "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-1",
                  "resize-y font-mono text-xs leading-relaxed",
                  timetableError && "border-destructive"
                )}
              />
              {timetableError && (
                <p className="text-xs text-destructive">{timetableError}</p>
              )}
            </div>
            <div className="flex items-center gap-4">
              <Button
                onClick={handleTimetableParse}
                disabled={timetableText.trim() === ""}
                className="flex-1"
              >
                Parse timetable
              </Button>
              <button
                onClick={handleTimetableSkip}
                className="text-sm text-muted-foreground underline underline-offset-2"
              >
                Skip
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="flex max-h-64 flex-col gap-1 overflow-y-auto rounded-lg bg-muted p-3">
              {parsedEntries.map((entry, i) => (
                <div
                  key={i}
                  className="flex items-baseline justify-between gap-2 py-1"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {getSubjectShortName(entry.description)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {getActivityLabel(entry.group)} &middot; {entry.day}{" "}
                      {entry.time} &middot; {entry.duration}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {entry.location && entry.location !== "-"
                      ? entry.location.split("_")[0]
                      : ""}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              {parsedEntries.length} classes found.
            </p>
            <div className="flex items-center gap-4">
              <Button onClick={handleTimetableSave} className="flex-1">
                Save timetable
              </Button>
              <button
                onClick={() => {
                  setParsedEntries([])
                  setTimetableText("")
                }}
                className="text-sm text-muted-foreground underline underline-offset-2"
              >
                Re-paste
              </button>
            </div>
          </>
        )}
      </Shell>
    )
  }

  // ── Done ──────────────────────────────────────────────────────

  if (step === "done" && savedData) {
    return (
      <Shell fadeKey={fadeKey}>
        <h1 className="text-2xl font-semibold tracking-tight">You&apos;re set.</h1>

        <div className="flex flex-col gap-2 rounded-lg bg-muted p-4">
          {savedData.jobs.length === 0 ? (
            <p className="text-sm">
              <span className="text-muted-foreground">Work: </span>No jobs added
            </p>
          ) : (
            savedData.jobs.map((j) => (
              <p key={j.id} className="text-sm">
                <span className="text-muted-foreground">Work: </span>
                {j.title} — {j.workDays.join(", ")} · {j.shiftStart}–{j.shiftEnd}
              </p>
            ))
          )}
          <p className="text-sm">
            <span className="text-muted-foreground">Recreation: </span>
            {savedData.recreationHoursPerWeek} hrs/week
          </p>
        </div>

        <div className="flex items-center gap-4">
          <Button ref={looksGoodRef} onClick={onComplete} className="flex-1">
            Looks good
          </Button>
          <button
            onClick={() => advance(1)}
            className="text-sm text-muted-foreground underline underline-offset-2"
          >
            Edit
          </button>
        </div>
      </Shell>
    )
  }

  // ── Step 2 ────────────────────────────────────────────────────

  if (step === 2) {
    const recHoursWarning =
      recHours !== "" && !recHoursError && Number(recHours) > 60
    return (
      <Shell fadeKey={fadeKey}>
        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
            2 of 3
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">
            Time for recreation
          </h1>
          <p className="text-sm text-muted-foreground">
            Block out time for the things that keep you well — sport, hobbies,
            friends, rest. We&apos;ll protect this time from study and work.
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="rec-hours" className="text-sm font-medium">
            Hours per week
          </label>
          <Input
            id="rec-hours"
            ref={recInputRef}
            type="number"
            min="0"
            max="60"
            step="0.5"
            value={recHours}
            onChange={(e) => {
              setRecHours(e.target.value)
              if (recHoursError) setRecHoursError("")
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && recHours !== "" && Number(recHours) >= 0)
                handleSave()
            }}
            placeholder="e.g. 8"
            aria-invalid={!!recHoursError || undefined}
          />
          {recHoursError ? (
            <p className="text-xs text-destructive">{recHoursError}</p>
          ) : recHoursWarning ? (
            <p className="text-xs text-muted-foreground">
              That&apos;s a lot — are you sure?
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              A typical student protects 5–10 hours, but it&apos;s your call.
            </p>
          )}
        </div>

        <div className="flex items-center gap-4">
          <Button
            onClick={handleSave}
            disabled={recHours === ""}
            className="flex-1"
          >
            Save
          </Button>
          <button
            onClick={() => advance(1)}
            className="text-sm text-muted-foreground underline underline-offset-2"
          >
            Back
          </button>
        </div>
      </Shell>
    )
  }

  // ── Step 1 ────────────────────────────────────────────────────

  return (
    <Shell fadeKey={fadeKey}>
      <div className="flex flex-col gap-2">
        <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
          1 of 3
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">
          Do you have a job?
        </h1>
        <p className="text-sm text-muted-foreground">
          Tell us your shift schedule and we&apos;ll block those hours out of
          your study plan automatically.
        </p>
      </div>

      {/* Yes / No toggle */}
      <div className="grid grid-cols-2 gap-2">
        <button
          ref={yesButtonRef}
          onClick={handleToggleYes}
          className={cn(
            "rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors",
            hasJob === true
              ? "border-primary bg-primary text-primary-foreground"
              : "border-input bg-background hover:bg-accent hover:text-accent-foreground"
          )}
        >
          Yes, I work
        </button>
        <button
          onClick={handleToggleNo}
          className={cn(
            "rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors",
            hasJob === false
              ? "border-primary bg-primary text-primary-foreground"
              : "border-input bg-background hover:bg-accent hover:text-accent-foreground"
          )}
        >
          Not right now
        </button>
      </div>

      {/* Work schedule builder */}
      {hasJob === true && (
        <div className="flex flex-col gap-4">
          {/* Saved shift list */}
          {jobs.length > 0 && editingShift === null && (
            <div className="flex flex-col gap-2">
              {jobs.map((shift) => (
                <div
                  key={shift.id}
                  className="flex items-start justify-between gap-2 rounded-lg border bg-muted/30 px-3 py-2.5"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{shift.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {shift.workDays.join(", ")} · {shift.shiftStart}–
                      {shift.shiftEnd}
                      {shift.commuteMins > 0 &&
                        ` · ${shift.commuteMins}min commute`}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {shiftHoursPerWeek(shift)} hrs/wk
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <button
                      onClick={() => setEditingShift(shift)}
                      className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                      title="Edit"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleShiftDelete(shift.id)}
                      className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      title="Remove"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
              <button
                onClick={() => setEditingShift("new")}
                className="text-left text-xs text-primary underline underline-offset-2"
              >
                + Add another job
              </button>
            </div>
          )}

          {/* Shift form */}
          {editingShift !== null && (
            <WorkShiftForm
              initialShift={editingShift === "new" ? undefined : editingShift}
              onSave={handleShiftSave}
              onCancel={() => {
                setEditingShift(null)
                if (jobs.length === 0) setHasJob(null)
              }}
            />
          )}
        </div>
      )}

      <Button onClick={handleStep1Continue} disabled={!step1Enabled}>
        Continue
      </Button>
    </Shell>
  )
}
