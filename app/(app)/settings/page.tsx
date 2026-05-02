"use client"

import { useState, useEffect } from "react"
import { Settings, Plus, Pencil, Trash2, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { WorkShiftForm } from "@/components/WorkShiftForm"
import { getTimeAllocation, saveTimeAllocation } from "@/lib/timeAllocationStore"
import { shiftHoursPerWeek } from "@/types/workSchedule"
import type { TimeAllocation } from "@/types/timeAllocation"
import type { WorkShift } from "@/types/workSchedule"

export default function SettingsPage() {
  const [allocation, setAllocation] = useState<TimeAllocation | null>(null)
  const [loaded, setLoaded]         = useState(false)

  // Which shift is being edited (id = editing existing; "new" = adding)
  const [editingId, setEditingId] = useState<string | "new" | null>(null)

  // Recreation editor
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

  // ── Shift handlers ────────────────────────────────────────────
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

  // ── Recreation handler ────────────────────────────────────────
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

      {/* ── Work schedule ───────────────────────────────────────── */}
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

          {/* Add-new form */}
          {editingId === "new" && (
            <div className="rounded-xl border p-4">
              <p className="mb-4 text-sm font-medium">New job</p>
              <WorkShiftForm
                onSave={handleShiftSave}
                onCancel={() => setEditingId(null)}
              />
            </div>
          )}

          {/* Existing shifts */}
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

      {/* ── Recreation ──────────────────────────────────────────── */}
      <section>
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
    </div>
  )
}
