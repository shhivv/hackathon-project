"use client"

import { useState, useEffect, useRef } from "react"
import { Settings, Plus, Pencil, Trash2, Check, CalendarDays } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { WorkShiftForm } from "@/components/WorkShiftForm"
import { cn } from "@/lib/utils"
import { getTimeAllocation, saveTimeAllocation } from "@/lib/timeAllocationStore"
import { getTimetable, saveTimetable } from "@/lib/timetableStore"
import {
  parseTimetable,
  getActivityLabel,
  getSubjectShortName,
} from "@/lib/timetableParser"
import { shiftHoursPerWeek } from "@/types/workSchedule"
import type { TimeAllocation } from "@/types/timeAllocation"
import type { WorkShift } from "@/types/workSchedule"
import type { TimetableEntry } from "@/types/timetable"

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
    <section>
      <div className="mb-3 flex items-center justify-between">
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
    </section>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const [allocation, setAllocation] = useState<TimeAllocation | null>(null)
  const [loaded, setLoaded]         = useState(false)

  const [editingId, setEditingId] = useState<string | "new" | null>(null)

  const [recDraft, setRecDraft]   = useState("")
  const [recSaved, setRecSaved]   = useState(false)

  useEffect(() => {
    const data = getTimeAllocation()
    setAllocation(data)
    setRecDraft(String(data?.recreationHoursPerWeek ?? ""))
    setLoaded(true)
  }, [])

  function persist(updated: TimeAllocation) {
    setAllocation(updated)
    saveTimeAllocation(updated)
  }

  function base(): TimeAllocation {
    return allocation ?? { jobs: [], recreationHoursPerWeek: 0, updatedAt: "" }
  }

  function handleShiftSave(shift: WorkShift) {
    const prev = base()
    const jobs =
      editingId === "new"
        ? [...prev.jobs, shift]
        : prev.jobs.map((j) => (j.id === shift.id ? shift : j))
    persist({ ...prev, jobs, updatedAt: new Date().toISOString() })
    setEditingId(null)
  }

  function handleShiftDelete(id: string) {
    const prev = base()
    persist({
      ...prev,
      jobs: prev.jobs.filter((j) => j.id !== id),
      updatedAt: new Date().toISOString(),
    })
    if (editingId === id) setEditingId(null)
  }

  function handleRecSave() {
    const hrs = parseFloat(recDraft)
    if (isNaN(hrs) || hrs < 0) return
    const prev = base()
    persist({ ...prev, recreationHoursPerWeek: hrs, updatedAt: new Date().toISOString() })
    setRecSaved(true)
    setTimeout(() => setRecSaved(false), 2000)
  }

  if (!loaded) return null

  const jobs = allocation?.jobs ?? []

  return (
    <div className="mx-auto max-w-3xl p-6">
      <div className="mb-6 flex items-center gap-2">
        <Settings className="h-5 w-5 text-primary" />
        <h1 className="text-lg font-semibold">Settings</h1>
      </div>

      {/* Work schedule */}
      <section className="mb-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Work Schedule</h2>
          {editingId === null && (
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5"
              onClick={() => setEditingId("new")}
            >
              <Plus className="h-3.5 w-3.5" />
              Add job
            </Button>
          )}
        </div>

        <div className="flex flex-col gap-3">
          {jobs.length === 0 && editingId === null && (
            <div className="rounded-xl border border-dashed py-8 text-center">
              <p className="text-sm text-muted-foreground">No jobs added yet.</p>
              <button
                onClick={() => setEditingId("new")}
                className="mt-1 text-xs text-primary underline underline-offset-2"
              >
                Add your first job
              </button>
            </div>
          )}

          {editingId === "new" && (
            <div className="rounded-xl border p-4">
              <p className="mb-4 text-sm font-medium">New job</p>
              <WorkShiftForm
                onSave={handleShiftSave}
                onCancel={() => setEditingId(null)}
              />
            </div>
          )}

          {jobs.map((shift) =>
            editingId === shift.id ? (
              <div key={shift.id} className="rounded-xl border p-4">
                <p className="mb-4 text-sm font-medium">Edit — {shift.title}</p>
                <WorkShiftForm
                  initialShift={shift}
                  onSave={handleShiftSave}
                  onCancel={() => setEditingId(null)}
                />
              </div>
            ) : (
              <div
                key={shift.id}
                className="flex items-start gap-3 rounded-xl border p-4"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{shift.title}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {shift.workDays.join(", ")} · {shift.shiftStart}–{shift.shiftEnd}
                  </p>
                  <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                    <span>
                      {shiftHoursPerWeek(shift)} hrs/wk
                    </span>
                    {shift.commuteMins > 0 && (
                      <span>{shift.commuteMins}min commute each way</span>
                    )}
                    <span>{shift.postBufferMins}min post-shift buffer</span>
                  </div>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => setEditingId(shift.id)}
                    title="Edit"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => handleShiftDelete(shift.id)}
                    title="Delete"
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            )
          )}
        </div>
      </section>

      {/* Recreation */}
      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold">Recreation</h2>
        <div className="rounded-xl border p-4">
          <p className="mb-3 text-sm text-muted-foreground">
            Hours per week reserved for sport, hobbies, rest, and social life.
            This time won&apos;t be allocated to study or work in your schedule.
          </p>
          <div className="flex items-center gap-3">
            <div className="relative w-36">
              <Input
                type="number"
                min="0"
                step="0.5"
                value={recDraft}
                onChange={(e) => {
                  setRecDraft(e.target.value)
                  setRecSaved(false)
                }}
                onKeyDown={(e) => e.key === "Enter" && handleRecSave()}
                className="pr-14"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                hrs/wk
              </span>
            </div>
            <Button size="sm" onClick={handleRecSave} className="gap-1.5">
              {recSaved ? (
                <>
                  <Check className="h-3.5 w-3.5" /> Saved
                </>
              ) : (
                "Save"
              )}
            </Button>
          </div>
        </div>
      </section>

      {/* Timetable */}
      <TimetableSection />
    </div>
  )
}
