"use client"

import { useState, useEffect, useRef } from "react"
import { Briefcase, CalendarDays, Check, Trash2, Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { getTimeAllocation, saveTimeAllocation } from "@/lib/timeAllocationStore"
import { getTimetable, saveTimetable } from "@/lib/timetableStore"
import {
  parseTimetable,
  getActivityLabel,
  getSubjectShortName,
} from "@/lib/timetableParser"
import type { TimeAllocation } from "@/types/timeAllocation"
import type { TimetableEntry } from "@/types/timetable"

// ── Job Section ────────────────────────────────────────────────────────────────

function JobSection() {
  const [allocation, setAllocation] = useState<TimeAllocation | null>(null)
  const [editing, setEditing] = useState(false)
  const [hasJob, setHasJob] = useState<boolean>(false)
  const [title, setTitle] = useState("")
  const [hours, setHours] = useState("")
  const [titleError, setTitleError] = useState("")
  const [hoursError, setHoursError] = useState("")
  const [saved, setSaved] = useState(false)
  const titleRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const a = getTimeAllocation()
    setAllocation(a)
    if (a?.job) {
      setHasJob(true)
      setTitle(a.job.title)
      setHours(String(a.job.hoursPerWeek))
    }
  }, [])

  useEffect(() => {
    if (editing && hasJob) titleRef.current?.focus()
  }, [editing, hasJob])

  function openEdit() {
    const a = getTimeAllocation()
    setHasJob(a?.job !== null && a?.job !== undefined)
    setTitle(a?.job?.title ?? "")
    setHours(a?.job?.hoursPerWeek !== undefined ? String(a.job!.hoursPerWeek) : "")
    setTitleError("")
    setHoursError("")
    setSaved(false)
    setEditing(true)
  }

  function cancel() {
    setEditing(false)
    setTitleError("")
    setHoursError("")
  }

  function save() {
    let ok = true
    if (hasJob) {
      if (title.trim() === "") {
        setTitleError("Add a short title.")
        ok = false
      }
      const h = Number(hours)
      if (hours === "" || h < 0) {
        setHoursError(h < 0 ? "Hours can't be negative." : "Enter the hours.")
        ok = false
      }
    }
    if (!ok) return

    const current = getTimeAllocation()!
    const updated: TimeAllocation = {
      ...current,
      job: hasJob ? { title: title.trim(), hoursPerWeek: Number(hours) } : null,
      updatedAt: new Date().toISOString(),
    }
    saveTimeAllocation(updated)
    setAllocation(updated)
    setEditing(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") save()
    if (e.key === "Escape") cancel()
  }

  const job = allocation?.job ?? null

  return (
    <div className="rounded-xl border p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Briefcase className="h-4 w-4 text-sky-500" />
          <h2 className="text-sm font-semibold">Job</h2>
        </div>
        {!editing && (
          <div className="flex items-center gap-2">
            {saved && (
              <span className="flex items-center gap-1 text-xs text-green-500">
                <Check className="h-3 w-3" />
                Saved
              </span>
            )}
            <Button variant="outline" size="sm" onClick={openEdit}>
              {job ? "Edit" : "Add job"}
            </Button>
          </div>
        )}
      </div>

      {!editing ? (
        job ? (
          <div className="text-sm">
            <p className="font-medium">{job.title}</p>
            <p className="text-muted-foreground">{job.hoursPerWeek} hrs/week</p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No job set.</p>
        )
      ) : (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setHasJob(true)}
              className={cn(
                "rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                hasJob
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-input bg-background hover:bg-accent hover:text-accent-foreground",
              )}
            >
              Yes, I work
            </button>
            <button
              onClick={() => setHasJob(false)}
              className={cn(
                "rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                !hasJob
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-input bg-background hover:bg-accent hover:text-accent-foreground",
              )}
            >
              Not right now
            </button>
          </div>

          {hasJob && (
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">Role title</label>
                <input
                  ref={titleRef}
                  type="text"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value)
                    if (titleError) setTitleError("")
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="e.g. Part-time barista"
                  className="border-input bg-background placeholder:text-muted-foreground focus-visible:ring-ring/50 w-full rounded-md border px-3 py-2 text-sm outline-none focus-visible:ring-[3px]"
                />
                {titleError && (
                  <p className="text-xs text-destructive">{titleError}</p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">Hours per week</label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={hours}
                    onChange={(e) => {
                      setHours(e.target.value)
                      if (hoursError) setHoursError("")
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder="0"
                    className="border-input bg-background placeholder:text-muted-foreground focus-visible:ring-ring/50 w-full rounded-md border py-2 pl-3 pr-16 text-sm outline-none focus-visible:ring-[3px]"
                  />
                  <span className="text-muted-foreground pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs">
                    hrs/wk
                  </span>
                </div>
                {hoursError && (
                  <p className="text-xs text-destructive">{hoursError}</p>
                )}
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button onClick={save} size="sm" className="flex-1">
              Save
            </Button>
            <Button variant="outline" size="sm" onClick={cancel}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Timetable Section ──────────────────────────────────────────────────────────

function TimetableSection() {
  const [current, setCurrent] = useState<TimetableEntry[] | null>(null)
  const [replacing, setReplacing] = useState(false)
  const [text, setText] = useState("")
  const [parsed, setParsed] = useState<TimetableEntry[]>([])
  const [parseError, setParseError] = useState("")
  const [saved, setSaved] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    setCurrent(getTimetable())
  }, [])

  useEffect(() => {
    if (replacing) textareaRef.current?.focus()
  }, [replacing])

  function openReplace() {
    setText("")
    setParsed([])
    setParseError("")
    setSaved(false)
    setReplacing(true)
  }

  function cancel() {
    setReplacing(false)
    setParsed([])
    setText("")
    setParseError("")
  }

  function handleParse() {
    const entries = parseTimetable(text)
    if (entries.length === 0) {
      setParseError(
        "No entries found. Paste the full table including all columns, separated by tabs.",
      )
      return
    }
    setParseError("")
    setParsed(entries)
  }

  function handleSave() {
    saveTimetable(parsed)
    setCurrent(parsed)
    setReplacing(false)
    setParsed([])
    setText("")
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function handleClear() {
    saveTimetable([])
    setCurrent([])
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const hasEntries = current && current.length > 0

  return (
    <div className="rounded-xl border p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold">Timetable</h2>
        </div>
        {!replacing && (
          <div className="flex items-center gap-2">
            {saved && (
              <span className="flex items-center gap-1 text-xs text-green-500">
                <Check className="h-3 w-3" />
                Saved
              </span>
            )}
            <Button variant="outline" size="sm" onClick={openReplace}>
              {hasEntries ? "Replace" : "Add timetable"}
            </Button>
            {hasEntries && (
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-destructive"
                onClick={handleClear}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        )}
      </div>

      {!replacing ? (
        hasEntries ? (
          <div className="flex max-h-56 flex-col gap-1 overflow-y-auto rounded-lg bg-muted p-3">
            {current!.map((entry, i) => (
              <div
                key={i}
                className="flex items-baseline justify-between gap-2 py-0.5"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {getSubjectShortName(entry.description)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {getActivityLabel(entry.group)} · {entry.day} {entry.time} ·{" "}
                    {entry.duration}
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
        ) : (
          <p className="text-sm text-muted-foreground">No timetable set.</p>
        )
      ) : (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">
            Export from{" "}
            <a
              href="https://mytimetable.anu.edu.au/even/student"
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground underline underline-offset-2"
            >
              mytimetable.anu.edu.au
            </a>{" "}
            — <strong>Export → Export as text</strong>, then paste below.
          </p>

          {parsed.length === 0 ? (
            <>
              <textarea
                ref={textareaRef}
                value={text}
                onChange={(e) => {
                  setText(e.target.value)
                  if (parseError) setParseError("")
                }}
                placeholder="Subject Code&#9;Description&#9;Group&#9;Activity&#9;Day&#9;Time&#9;..."
                rows={6}
                className={cn(
                  "flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground",
                  "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-1",
                  "resize-y font-mono text-xs leading-relaxed",
                  parseError && "border-destructive",
                )}
              />
              {parseError && (
                <p className="text-xs text-destructive">{parseError}</p>
              )}
              <div className="flex gap-2">
                <Button
                  onClick={handleParse}
                  disabled={text.trim() === ""}
                  size="sm"
                  className="flex-1"
                >
                  Parse timetable
                </Button>
                <Button variant="outline" size="sm" onClick={cancel}>
                  Cancel
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="flex max-h-56 flex-col gap-1 overflow-y-auto rounded-lg bg-muted p-3">
                {parsed.map((entry, i) => (
                  <div
                    key={i}
                    className="flex items-baseline justify-between gap-2 py-0.5"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {getSubjectShortName(entry.description)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {getActivityLabel(entry.group)} · {entry.day}{" "}
                        {entry.time} · {entry.duration}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                {parsed.length} classes found.
              </p>
              <div className="flex gap-2">
                <Button onClick={handleSave} size="sm" className="flex-1">
                  Save timetable
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setParsed([])
                    setText("")
                  }}
                >
                  Re-paste
                </Button>
                <Button variant="outline" size="sm" onClick={cancel}>
                  Cancel
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-2xl p-6">
      <div className="mb-6">
        <h1 className="text-lg font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Update your profile and schedule
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <JobSection />
        <TimetableSection />
      </div>
    </div>
  )
}
