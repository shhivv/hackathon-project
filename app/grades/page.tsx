"use client"

import { useState, useEffect } from "react"
import {
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  AlertCircle,
  TrendingUp,
  GraduationCap,
  ArrowLeft,
  RotateCcw,
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

// ─── Types ────────────────────────────────────────────────────────────────────

interface Assessment {
  id: string
  name: string
  type: string
  marks: number | null // null = not yet completed
  weight: number
}

type GradeKey = "HD" | "D" | "CR" | "P" | "F"
type TargetGrade = "HD" | "D" | "CR" | "P"

interface FormState {
  name: string
  type: string
  marks: string
  weight: string
  completed: boolean
}

// ─── Constants ────────────────────────────────────────────────────────────────

const GRADE_INFO: Record<GradeKey, { label: string; min: number; max: number }> = {
  HD: { label: "High Distinction", min: 80, max: 100 },
  D: { label: "Distinction", min: 70, max: 79 },
  CR: { label: "Credit", min: 60, max: 69 },
  P: { label: "Pass", min: 50, max: 59 },
  F: { label: "Fail", min: 0, max: 49 },
}

// All class strings must be static (no template literals) so Tailwind v4 picks them up
const GRADE_STYLES: Record<GradeKey, { text: string; bg: string; border: string; chip: string }> = {
  HD: {
    text: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
    chip: "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400",
  },
  D: {
    text: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
    chip: "bg-blue-500/10 border-blue-500/30 text-blue-700 dark:text-blue-400",
  },
  CR: {
    text: "text-violet-600 dark:text-violet-400",
    bg: "bg-violet-500/10",
    border: "border-violet-500/30",
    chip: "bg-violet-500/10 border-violet-500/30 text-violet-700 dark:text-violet-400",
  },
  P: {
    text: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    chip: "bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400",
  },
  F: {
    text: "text-red-600 dark:text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/30",
    chip: "bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-400",
  },
}

const ASSESSMENT_TYPES = [
  "Assignment",
  "Test",
  "Exam",
  "Tutorial",
  "Lab",
  "Project",
  "Quiz",
  "Other",
]

const DEFAULT_FORM: FormState = {
  name: "",
  type: "Assignment",
  marks: "",
  weight: "",
  completed: false,
}

const STORAGE_KEY = "grade-calculator-v1"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getGradeKey(score: number): GradeKey {
  if (score >= 80) return "HD"
  if (score >= 70) return "D"
  if (score >= 60) return "CR"
  if (score >= 50) return "P"
  return "F"
}

function calcStats(assessments: Assessment[]) {
  const completed = assessments.filter((a) => a.marks !== null)
  const incomplete = assessments.filter((a) => a.marks === null)
  const totalWeight = assessments.reduce((s, a) => s + a.weight, 0)
  const completedWeight = completed.reduce((s, a) => s + a.weight, 0)
  const remainingWeight = incomplete.reduce((s, a) => s + a.weight, 0)
  // Points earned toward the 100-point scale: Σ(marks × weight / 100)
  const earnedScore = completed.reduce((s, a) => s + (a.marks! * a.weight) / 100, 0)
  // Projected final grade if you maintain current average in remaining work
  const projected =
    completedWeight > 0 ? (earnedScore / completedWeight) * totalWeight : null
  return { completed, incomplete, totalWeight, completedWeight, remainingWeight, earnedScore, projected }
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function GradesPage() {
  const [assessments, setAssessments] = useState<Assessment[]>([])
  const [form, setForm] = useState<FormState>(DEFAULT_FORM)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [targetGrade, setTargetGrade] = useState<TargetGrade | "">("")
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})
  const [hydrated, setHydrated] = useState(false)

  // ── Persistence ──────────────────────────────────────────────────────────────

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const data = JSON.parse(raw)
        if (Array.isArray(data.assessments)) setAssessments(data.assessments)
        if (data.targetGrade) setTargetGrade(data.targetGrade)
      }
    } catch {}
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ assessments, targetGrade }))
  }, [assessments, targetGrade, hydrated])

  // ── Derived state ─────────────────────────────────────────────────────────────

  const { completed, totalWeight, completedWeight, remainingWeight, earnedScore, projected } =
    calcStats(assessments)

  const currentGrade = completed.length > 0 ? getGradeKey(earnedScore) : null
  const projectedGrade = projected !== null ? getGradeKey(projected) : null
  const weightWarning = assessments.length > 0 && Math.abs(totalWeight - 100) > 0.01

  // Target grade prediction
  const prediction = (() => {
    if (!targetGrade || assessments.length === 0) return null
    const targetMin = GRADE_INFO[targetGrade].min

    if (remainingWeight <= 0) {
      // All done — check if already achieved
      return { achievable: earnedScore >= targetMin, alreadyDone: true, requiredAvg: 0 }
    }

    const required = ((targetMin - earnedScore) * 100) / remainingWeight

    if (required <= 0) {
      return { achievable: true, alreadyDone: true, requiredAvg: 0 }
    }
    if (required > 100) {
      return { achievable: false, alreadyDone: false, requiredAvg: required }
    }
    return { achievable: true, alreadyDone: false, requiredAvg: required }
  })()

  // ── Form handlers ─────────────────────────────────────────────────────────────

  function validate(f: FormState): Partial<Record<keyof FormState, string>> {
    const e: Partial<Record<keyof FormState, string>> = {}
    if (!f.name.trim()) e.name = "Name is required"
    if (!f.weight.trim()) {
      e.weight = "Weight is required"
    } else if (isNaN(Number(f.weight)) || Number(f.weight) <= 0 || Number(f.weight) > 100) {
      e.weight = "Weight must be between 1 and 100"
    }
    if (f.completed) {
      if (f.marks.trim() === "") {
        e.marks = "Marks are required"
      } else if (isNaN(Number(f.marks)) || Number(f.marks) < 0 || Number(f.marks) > 100) {
        e.marks = "Marks must be between 0 and 100"
      }
    }
    return e
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate(form)
    if (Object.keys(errs).length) {
      setErrors(errs)
      return
    }
    setErrors({})

    const assessment: Assessment = {
      id: editingId ?? crypto.randomUUID(),
      name: form.name.trim(),
      type: form.type,
      marks: form.completed ? parseFloat(Number(form.marks).toFixed(2)) : null,
      weight: parseFloat(Number(form.weight).toFixed(2)),
    }

    if (editingId) {
      setAssessments((prev) => prev.map((a) => (a.id === editingId ? assessment : a)))
      setEditingId(null)
    } else {
      setAssessments((prev) => [...prev, assessment])
    }
    setForm(DEFAULT_FORM)
  }

  function handleEdit(a: Assessment) {
    setEditingId(a.id)
    setForm({
      name: a.name,
      type: a.type,
      marks: a.marks !== null ? String(a.marks) : "",
      weight: String(a.weight),
      completed: a.marks !== null,
    })
    setErrors({})
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  function handleDelete(id: string) {
    setAssessments((prev) => prev.filter((a) => a.id !== id))
    if (editingId === id) {
      setEditingId(null)
      setForm(DEFAULT_FORM)
    }
  }

  function handleCancel() {
    setEditingId(null)
    setForm(DEFAULT_FORM)
    setErrors({})
  }

  function handleClearAll() {
    if (confirm("Clear all assessments? This cannot be undone.")) {
      setAssessments([])
      setTargetGrade("")
      setEditingId(null)
      setForm(DEFAULT_FORM)
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-5xl px-4 py-8 space-y-6">

        {/* Nav */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Canvas Courses
          </Link>
          {assessments.length > 0 && (
            <button
              onClick={handleClearAll}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-red-500 transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Clear all
            </button>
          )}
        </div>

        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-primary/10 p-2.5">
            <GraduationCap className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Grade Calculator</h1>
            <p className="text-sm text-muted-foreground">
              Track assessments and plan your path to your target grade
            </p>
          </div>
        </div>

        {/* Weightage warning */}
        {weightWarning && (
          <div className="flex items-start gap-2.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>
              Total weightage is <strong>{totalWeight}%</strong> — should sum to 100%. Scores are
              calculated as-is; projected final grade is normalised proportionally.
            </span>
          </div>
        )}

        {/* Main grid */}
        <div className="grid gap-6 lg:grid-cols-5">

          {/* ── Form ──────────────────────────────────────────────────────── */}
          <div className="lg:col-span-2">
            <div className="rounded-xl border bg-card p-5 space-y-4 sticky top-6">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                {editingId ? "Edit Assessment" : "Add Assessment"}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-3" noValidate>
                {/* Name */}
                <div>
                  <label className="text-sm font-medium" htmlFor="f-name">
                    Name
                  </label>
                  <input
                    id="f-name"
                    className={cn(
                      "mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring",
                      errors.name && "border-red-500",
                    )}
                    placeholder="e.g. Assignment 1"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  />
                  {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
                </div>

                {/* Type */}
                <div>
                  <label className="text-sm font-medium" htmlFor="f-type">
                    Type
                  </label>
                  <select
                    id="f-type"
                    className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    value={form.type}
                    onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                  >
                    {ASSESSMENT_TYPES.map((t) => (
                      <option key={t}>{t}</option>
                    ))}
                  </select>
                </div>

                {/* Weight */}
                <div>
                  <label className="text-sm font-medium" htmlFor="f-weight">
                    Weight (%)
                  </label>
                  <input
                    id="f-weight"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    className={cn(
                      "mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring",
                      errors.weight && "border-red-500",
                    )}
                    placeholder="e.g. 20"
                    value={form.weight}
                    onChange={(e) => setForm((f) => ({ ...f, weight: e.target.value }))}
                  />
                  {errors.weight && <p className="mt-1 text-xs text-red-500">{errors.weight}</p>}
                </div>

                {/* Completed */}
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={form.completed}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, completed: e.target.checked, marks: "" }))
                    }
                    className="h-4 w-4 rounded accent-primary"
                  />
                  <span className="text-sm font-medium">Already marked / completed</span>
                </label>

                {/* Marks */}
                {form.completed && (
                  <div>
                    <label className="text-sm font-medium" htmlFor="f-marks">
                      Marks received (%)
                    </label>
                    <input
                      id="f-marks"
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      className={cn(
                        "mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring",
                        errors.marks && "border-red-500",
                      )}
                      placeholder="e.g. 75"
                      value={form.marks}
                      onChange={(e) => setForm((f) => ({ ...f, marks: e.target.value }))}
                    />
                    {errors.marks && <p className="mt-1 text-xs text-red-500">{errors.marks}</p>}
                  </div>
                )}

                {/* Buttons */}
                <div className="flex gap-2 pt-1">
                  <button
                    type="submit"
                    className="flex flex-1 items-center justify-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                  >
                    {editingId ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                    {editingId ? "Update" : "Add Assessment"}
                  </button>
                  {editingId && (
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="flex items-center justify-center gap-1.5 rounded-md border px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
                    >
                      <X className="h-4 w-4" />
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>

          {/* ── Results + Target ───────────────────────────────────────────── */}
          <div className="lg:col-span-3 space-y-4">

            {/* Results Panel */}
            <div className="rounded-xl border bg-card p-5">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
                Current Standing
              </h2>

              {assessments.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Add your first assessment to see results.
                </p>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <StatCard
                      label="Earned score"
                      value={`${earnedScore.toFixed(1)} pts`}
                      sub="out of 100 pts total"
                    />
                    <StatCard
                      label="Projected final"
                      value={projected !== null ? `${projected.toFixed(1)}%` : "—"}
                      sub={projectedGrade ? GRADE_INFO[projectedGrade].label : "no data yet"}
                      gradeKey={projectedGrade}
                    />
                    <StatCard
                      label="Completed"
                      value={`${completedWeight.toFixed(0)}%`}
                      sub={`${completed.length} assessment${completed.length !== 1 ? "s" : ""}`}
                    />
                    <StatCard
                      label="Remaining"
                      value={`${remainingWeight.toFixed(0)}%`}
                      sub={`${assessments.length - completed.length} pending`}
                    />
                  </div>

                  {/* Progress bar */}
                  <div>
                    <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                      <span>Progress</span>
                      <span>{completedWeight.toFixed(0)}% of {totalWeight}% assessed</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{
                          width: totalWeight > 0 ? `${(completedWeight / totalWeight) * 100}%` : "0%",
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Target Grade Planner */}
            <div className="rounded-xl border bg-card p-5 space-y-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Target Grade Planner
                </h2>
              </div>

              <div>
                <label className="text-sm font-medium" htmlFor="target-select">
                  I want to achieve...
                </label>
                <select
                  id="target-select"
                  className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  value={targetGrade}
                  onChange={(e) => setTargetGrade(e.target.value as TargetGrade | "")}
                >
                  <option value="">Select a target grade</option>
                  <option value="HD">HD – High Distinction (80–100%)</option>
                  <option value="D">D – Distinction (70–79%)</option>
                  <option value="CR">CR – Credit (60–69%)</option>
                  <option value="P">P – Pass (50–59%)</option>
                </select>
              </div>

              {/* Prediction box */}
              {targetGrade && assessments.length === 0 && (
                <p className="text-sm text-muted-foreground">Add assessments to see the prediction.</p>
              )}

              {targetGrade && prediction && (
                <PredictionBox
                  prediction={prediction}
                  targetGrade={targetGrade as TargetGrade}
                  remainingWeight={remainingWeight}
                />
              )}
            </div>

            {/* Grade Scale */}
            <div className="rounded-xl border bg-card p-5">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                Grade Scale
              </h2>
              <div className="flex flex-wrap gap-2">
                {(Object.entries(GRADE_INFO) as [GradeKey, typeof GRADE_INFO[GradeKey]][]).map(
                  ([key, info]) => (
                    <div
                      key={key}
                      className={cn(
                        "flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs",
                        GRADE_STYLES[key].chip,
                      )}
                    >
                      <span className="font-bold">{key}</span>
                      <span className="opacity-80">{info.label}</span>
                      <span className="opacity-60">
                        {info.min}–{info.max}%
                      </span>
                    </div>
                  ),
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Assessment Table ───────────────────────────────────────────────── */}
        {assessments.length > 0 && (
          <div className="rounded-xl border bg-card overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Assessments ({assessments.length})
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <Th align="left">Name</Th>
                    <Th align="left">Type</Th>
                    <Th align="right">Marks</Th>
                    <Th align="right">Weight</Th>
                    <Th align="right">Contribution</Th>
                    <Th align="right">Grade</Th>
                    <Th align="right" sr="Actions" />
                  </tr>
                </thead>
                <tbody>
                  {assessments.map((a) => {
                    const contribution =
                      a.marks !== null ? (a.marks * a.weight) / 100 : null
                    const gradeKey = a.marks !== null ? getGradeKey(a.marks) : null
                    return (
                      <tr
                        key={a.id}
                        className={cn(
                          "border-b last:border-0 transition-colors hover:bg-muted/20",
                          editingId === a.id && "bg-primary/5",
                        )}
                      >
                        <td className="px-4 py-3 font-medium">{a.name}</td>
                        <td className="px-4 py-3 text-muted-foreground">{a.type}</td>
                        <td className="px-4 py-3 text-right">
                          {a.marks !== null ? (
                            <span className="font-medium tabular-nums">{a.marks}%</span>
                          ) : (
                            <span className="text-xs italic text-muted-foreground">pending</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">{a.weight}%</td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          {contribution !== null ? (
                            <span className="font-medium">{contribution.toFixed(2)}</span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {gradeKey ? (
                            <span
                              className={cn(
                                "font-semibold",
                                GRADE_STYLES[gradeKey].text,
                              )}
                            >
                              {gradeKey}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleEdit(a)}
                              aria-label="Edit"
                              className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(a.id)}
                              aria-label="Delete"
                              className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-500"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t bg-muted/30 font-medium">
                    <td colSpan={3} className="px-4 py-3 text-xs text-muted-foreground">
                      Total
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">{totalWeight}%</td>
                    <td className="px-4 py-3 text-right tabular-nums font-semibold">
                      {earnedScore.toFixed(2)}
                    </td>
                    <td
                      className={cn(
                        "px-4 py-3 text-right font-bold",
                        currentGrade ? GRADE_STYLES[currentGrade].text : "text-muted-foreground",
                      )}
                    >
                      {currentGrade ?? "—"}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  gradeKey,
}: {
  label: string
  value: string
  sub?: string
  gradeKey?: GradeKey | null
}) {
  return (
    <div className="rounded-lg bg-muted/40 p-3 text-center">
      <div
        className={cn(
          "text-xl font-bold tabular-nums",
          gradeKey ? GRADE_STYLES[gradeKey].text : "",
        )}
      >
        {value}
      </div>
      <div className="mt-0.5 text-xs font-medium text-muted-foreground">{label}</div>
      {sub && <div className="mt-0.5 text-xs text-muted-foreground/70">{sub}</div>}
    </div>
  )
}

function PredictionBox({
  prediction,
  targetGrade,
  remainingWeight,
}: {
  prediction: { achievable: boolean; alreadyDone: boolean; requiredAvg: number }
  targetGrade: TargetGrade
  remainingWeight: number
}) {
  const gradeLabel = GRADE_INFO[targetGrade].label

  if (!prediction.achievable) {
    return (
      <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-400">
        <p className="font-medium">Target not achievable</p>
        <p className="mt-1 opacity-80">
          You would need <strong>{prediction.requiredAvg.toFixed(1)}%</strong> in the remaining{" "}
          {remainingWeight}% weight, which exceeds 100%. Consider aiming for a lower grade.
        </p>
      </div>
    )
  }

  if (prediction.alreadyDone && remainingWeight <= 0) {
    return (
      <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-400">
        <p className="font-medium">Congratulations!</p>
        <p className="mt-1 opacity-80">
          You have achieved <strong>{targetGrade} – {gradeLabel}</strong>.
        </p>
      </div>
    )
  }

  if (prediction.alreadyDone) {
    return (
      <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-400">
        <p className="font-medium">Already secured!</p>
        <p className="mt-1 opacity-80">
          Based on your completed assessments, you have already secured a{" "}
          <strong>{targetGrade} – {gradeLabel}</strong> even if you score 0 in remaining work.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 px-4 py-3 text-sm text-blue-700 dark:text-blue-400">
      <p className="font-medium">Here&apos;s what you need</p>
      <p className="mt-1 opacity-80">
        You need an average of{" "}
        <strong>{prediction.requiredAvg.toFixed(1)}%</strong> across the remaining{" "}
        <strong>{remainingWeight}%</strong> weight to achieve{" "}
        <strong>{targetGrade} – {gradeLabel}</strong>.
      </p>
    </div>
  )
}

function Th({
  children,
  align = "left",
  sr,
}: {
  children?: React.ReactNode
  align?: "left" | "right"
  sr?: string
}) {
  return (
    <th
      className={cn(
        "px-4 py-3 text-xs font-semibold text-muted-foreground",
        align === "right" ? "text-right" : "text-left",
      )}
    >
      {sr ? <span className="sr-only">{sr}</span> : children}
    </th>
  )
}
