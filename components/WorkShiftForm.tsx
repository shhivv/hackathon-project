"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  type WorkShift,
  type DayName,
  type BufferMins,
  ALL_DAYS,
  BUFFER_OPTIONS,
  shiftParseMin,
  blockedWindow,
} from "@/types/workSchedule"

interface Props {
  initialShift?: WorkShift
  onSave: (shift: WorkShift) => void
  onCancel: () => void
}

function minToTime(min: number): string {
  const c = Math.max(0, Math.min(1439, min))
  return `${String(Math.floor(c / 60)).padStart(2, "0")}:${String(c % 60).padStart(2, "0")}`
}

export function WorkShiftForm({ initialShift, onSave, onCancel }: Props) {
  const [title, setTitle]               = useState(initialShift?.title ?? "")
  const [workDays, setWorkDays]         = useState<DayName[]>(initialShift?.workDays ?? [])
  const [shiftStart, setShiftStart]     = useState(initialShift?.shiftStart ?? "09:00")
  const [shiftEnd, setShiftEnd]         = useState(initialShift?.shiftEnd ?? "17:00")
  const [commuteMins, setCommuteMins]   = useState(
    initialShift?.commuteMins != null ? String(initialShift.commuteMins) : "0"
  )
  const [postBuffer, setPostBuffer]     = useState<BufferMins>(
    initialShift?.postBufferMins ?? 30
  )
  const [errors, setErrors]             = useState<Record<string, string>>({})

  function toggleDay(day: DayName) {
    setWorkDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    )
    if (errors.workDays) setErrors((e) => ({ ...e, workDays: "" }))
  }

  function validate(): boolean {
    const errs: Record<string, string> = {}
    if (!title.trim()) errs.title = "Add a short title."
    if (workDays.length === 0) errs.workDays = "Select at least one work day."
    if (shiftParseMin(shiftEnd) <= shiftParseMin(shiftStart))
      errs.shiftEnd = "End must be after start."
    const comm = parseInt(commuteMins, 10)
    if (isNaN(comm) || comm < 0) errs.commuteMins = "Enter 0 or a positive number."
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  function handleSave() {
    if (!validate()) return
    onSave({
      id:             initialShift?.id ?? `job-${Date.now()}`,
      title:          title.trim(),
      workDays,
      shiftStart,
      shiftEnd,
      commuteMins:    Math.max(0, parseInt(commuteMins, 10) || 0),
      postBufferMins: postBuffer,
    })
  }

  // Preview of the full unavailable window
  const preview =
    workDays.length > 0 && shiftParseMin(shiftEnd) > shiftParseMin(shiftStart)
      ? (() => {
          const comm = Math.max(0, parseInt(commuteMins, 10) || 0)
          const { start, end } = blockedWindow({
            id: "",
            title: "",
            workDays,
            shiftStart,
            shiftEnd,
            commuteMins: comm,
            postBufferMins: postBuffer,
          })
          return `Unavailable ${minToTime(start)}–${minToTime(end)} on ${workDays.join(", ")}`
        })()
      : null

  return (
    <div className="flex flex-col gap-4">
      {/* Title */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="ws-title">Role title</Label>
        <Input
          id="ws-title"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value)
            if (errors.title) setErrors((er) => ({ ...er, title: "" }))
          }}
          placeholder="e.g. Part-time barista, Casual tutor"
          aria-invalid={!!errors.title || undefined}
        />
        {errors.title && (
          <p className="text-xs text-destructive">{errors.title}</p>
        )}
      </div>

      {/* Work days */}
      <div className="flex flex-col gap-1.5">
        <Label>Work days</Label>
        <div className="flex flex-wrap gap-1.5">
          {ALL_DAYS.map((day) => (
            <button
              key={day}
              type="button"
              onClick={() => toggleDay(day)}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                workDays.includes(day)
                  ? "bg-primary text-primary-foreground"
                  : "border border-input bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              {day}
            </button>
          ))}
        </div>
        {errors.workDays && (
          <p className="text-xs text-destructive">{errors.workDays}</p>
        )}
      </div>

      {/* Shift hours */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="ws-start">Shift start</Label>
          <Input
            id="ws-start"
            type="time"
            value={shiftStart}
            onChange={(e) => setShiftStart(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="ws-end">Shift end</Label>
          <Input
            id="ws-end"
            type="time"
            value={shiftEnd}
            onChange={(e) => {
              setShiftEnd(e.target.value)
              if (errors.shiftEnd) setErrors((er) => ({ ...er, shiftEnd: "" }))
            }}
            aria-invalid={!!errors.shiftEnd || undefined}
          />
          {errors.shiftEnd && (
            <p className="text-xs text-destructive">{errors.shiftEnd}</p>
          )}
        </div>
      </div>

      {/* Commute + buffer */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="ws-commute">Commute (min, one-way)</Label>
          <Input
            id="ws-commute"
            type="number"
            min="0"
            step="5"
            value={commuteMins}
            onChange={(e) => {
              setCommuteMins(e.target.value)
              if (errors.commuteMins)
                setErrors((er) => ({ ...er, commuteMins: "" }))
            }}
            placeholder="0"
            aria-invalid={!!errors.commuteMins || undefined}
          />
          {errors.commuteMins ? (
            <p className="text-xs text-destructive">{errors.commuteMins}</p>
          ) : (
            <p className="text-xs text-muted-foreground">0 = remote</p>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="ws-buffer">Post-shift buffer</Label>
          <select
            id="ws-buffer"
            value={postBuffer}
            onChange={(e) => setPostBuffer(Number(e.target.value) as BufferMins)}
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm text-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            {BUFFER_OPTIONS.map((b) => (
              <option key={b} value={b}>
                {b} min
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground">
            Cool-down before study resumes
          </p>
        </div>
      </div>

      {/* Blocked window preview */}
      {preview && (
        <div className="rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
          {preview}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <Button type="button" onClick={handleSave} className="flex-1">
          Save shift
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  )
}
