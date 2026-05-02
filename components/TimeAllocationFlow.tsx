// Mounted in app/(app)/layout.tsx > AuthGate when !hasCompletedTimeAllocation().
// Pass initialData={getTimeAllocation()} to pre-fill on re-entry via an Edit link.
"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { saveTimeAllocation } from "@/lib/timeAllocationStore"
import type { TimeAllocation } from "@/types/timeAllocation"

type Step = 1 | 2 | "done"

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
        className="animate-in fade-in flex w-full max-w-sm flex-col gap-6 duration-200"
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
  const [step, setStep] = useState<Step>(1)
  const [fadeKey, setFadeKey] = useState(0)

  // Step 1 state
  const [hasJob, setHasJob] = useState<boolean | null>(() =>
    initialData != null ? initialData.job !== null : null,
  )
  const [jobTitle, setJobTitle] = useState(initialData?.job?.title ?? "")
  const [jobHours, setJobHours] = useState(
    initialData?.job?.hoursPerWeek != null
      ? String(initialData.job.hoursPerWeek)
      : "",
  )
  const [jobTitleError, setJobTitleError] = useState("")
  const [jobHoursError, setJobHoursError] = useState("")

  // Step 2 state
  const [recHours, setRecHours] = useState(
    initialData?.recreationHoursPerWeek != null
      ? String(initialData.recreationHoursPerWeek)
      : "",
  )
  const [recHoursError, setRecHoursError] = useState("")

  // Done state
  const [savedData, setSavedData] = useState<TimeAllocation | null>(null)

  // Focus refs — React 19: ref passes through ...props without forwardRef
  const yesButtonRef = useRef<HTMLButtonElement>(null)
  const jobTitleRef = useRef<HTMLInputElement>(null)
  const recInputRef = useRef<HTMLInputElement>(null)
  const looksGoodRef = useRef<HTMLButtonElement>(null)

  // Focus first interactive element when step changes
  useEffect(() => {
    if (step === 1) yesButtonRef.current?.focus()
    else if (step === 2) recInputRef.current?.focus()
    else if (step === "done") looksGoodRef.current?.focus()
  }, [step, fadeKey])

  // When job toggle switches on, focus the title field
  useEffect(() => {
    if (hasJob === true) jobTitleRef.current?.focus()
  }, [hasJob])

  function advance(next: Step) {
    setFadeKey((k) => k + 1)
    setStep(next)
  }

  // ── Validation ───────────────────────────────────────────────

  function validateStep1(): boolean {
    if (hasJob !== true) return true
    let ok = true

    if (jobTitle.trim() === "") {
      setJobTitleError("Add a short title.")
      ok = false
    }

    const hrs = Number(jobHours)
    if (jobHours === "" || hrs < 0) {
      setJobHoursError(hrs < 0 ? "Hours can't be negative." : "Enter the hours.")
      ok = false
    }

    return ok
  }

  function validateStep2(): boolean {
    const hrs = Number(recHours)
    if (recHours === "") {
      setRecHoursError("Enter the hours.")
      return false
    }
    if (hrs < 0) {
      setRecHoursError("Hours can't be negative.")
      return false
    }
    return true
  }

  // ── Actions ──────────────────────────────────────────────────

  function handleContinue() {
    if (!validateStep1()) return
    advance(2)
  }

  function handleSave() {
    if (!validateStep2()) return
    const data: TimeAllocation = {
      job:
        hasJob === true
          ? { title: jobTitle.trim(), hoursPerWeek: Number(jobHours) }
          : null,
      recreationHoursPerWeek: Number(recHours),
      updatedAt: new Date().toISOString(),
    }
    saveTimeAllocation(data)
    setSavedData(data)
    advance("done")
  }

  // ── Derived ──────────────────────────────────────────────────

  const step1Enabled =
    hasJob === false ||
    (hasJob === true && jobTitle.trim() !== "" && jobHours !== "")

  const jobHoursWarning =
    jobHours !== "" && !jobHoursError && Number(jobHours) > 60
  const recHoursWarning =
    recHours !== "" && !recHoursError && Number(recHours) > 60

  // ── Done ──────────────────────────────────────────────────────

  if (step === "done" && savedData) {
    return (
      <Shell fadeKey={fadeKey}>
        <h1 className="text-2xl font-semibold tracking-tight">
          You&apos;re set.
        </h1>

        <div className="bg-muted flex flex-col gap-2 rounded-lg p-4">
          <p className="text-sm">
            <span className="text-muted-foreground">Job: </span>
            {savedData.job
              ? `${savedData.job.title}, ${savedData.job.hoursPerWeek} hrs/week`
              : "No job"}
          </p>
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
            className="text-muted-foreground text-sm underline underline-offset-2"
          >
            Edit
          </button>
        </div>
      </Shell>
    )
  }

  // ── Step 2 ────────────────────────────────────────────────────

  if (step === 2) {
    return (
      <Shell fadeKey={fadeKey}>
        <div className="flex flex-col gap-2">
          <p className="text-muted-foreground text-xs font-medium uppercase tracking-widest">
            2 of 2
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">
            Time for recreation
          </h1>
          <p className="text-muted-foreground text-sm">
            Block out time for the things that keep you well — sport, hobbies,
            friends, rest. No need to break it down. This is time we&apos;ll
            try not to let study or work eat into.
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
            <p className="text-destructive text-xs">{recHoursError}</p>
          ) : recHoursWarning ? (
            <p className="text-muted-foreground text-xs">
              That&apos;s a lot — are you sure?
            </p>
          ) : (
            <p className="text-muted-foreground text-xs">
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
            className="text-muted-foreground text-sm underline underline-offset-2"
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
        <p className="text-muted-foreground text-xs font-medium uppercase tracking-widest">
          1 of 2
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">
          Do you have a job?
        </h1>
        <p className="text-muted-foreground text-sm">
          If you work part-time or casually, tell us roughly how much.
          We&apos;ll factor it into your weekly plan.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          ref={yesButtonRef}
          onClick={() => setHasJob(true)}
          className={cn(
            "rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors",
            hasJob === true
              ? "border-primary bg-primary text-primary-foreground"
              : "border-input bg-background hover:bg-accent hover:text-accent-foreground",
          )}
        >
          Yes, I work
        </button>
        <button
          onClick={() => setHasJob(false)}
          className={cn(
            "rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors",
            hasJob === false
              ? "border-primary bg-primary text-primary-foreground"
              : "border-input bg-background hover:bg-accent hover:text-accent-foreground",
          )}
        >
          Not right now
        </button>
      </div>

      {hasJob === true && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="job-title" className="text-sm font-medium">
              What&apos;s the role?
            </label>
            <Input
              id="job-title"
              ref={jobTitleRef}
              type="text"
              value={jobTitle}
              onChange={(e) => {
                setJobTitle(e.target.value)
                if (jobTitleError) setJobTitleError("")
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && step1Enabled) handleContinue()
              }}
              placeholder="e.g. Part-time barista, Casual tutor, Research assistant"
              aria-invalid={!!jobTitleError || undefined}
            />
            {jobTitleError && (
              <p className="text-destructive text-xs">{jobTitleError}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="job-hours" className="text-sm font-medium">
              Hours per week (on average)
            </label>
            <Input
              id="job-hours"
              type="number"
              min="0"
              max="60"
              step="0.5"
              value={jobHours}
              onChange={(e) => {
                setJobHours(e.target.value)
                if (jobHoursError) setJobHoursError("")
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && step1Enabled) handleContinue()
              }}
              aria-invalid={!!jobHoursError || undefined}
            />
            {jobHoursError ? (
              <p className="text-destructive text-xs">{jobHoursError}</p>
            ) : jobHoursWarning ? (
              <p className="text-muted-foreground text-xs">
                That&apos;s a lot — are you sure?
              </p>
            ) : (
              <p className="text-muted-foreground text-xs">
                An average is fine — it doesn&apos;t have to be exact.
              </p>
            )}
          </div>
        </div>
      )}

      <Button onClick={handleContinue} disabled={!step1Enabled}>
        Continue
      </Button>
    </Shell>
  )
}
