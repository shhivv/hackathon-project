export interface AuraSession {
  id: string
  type: "study" | "task"
  points: number
  detail: string
  timestamp: number
  date: string
}

export interface AuraData {
  sessions: AuraSession[]
  streak: number
  lastActiveDate: string
}

const STORAGE_KEY = "planora-aura-data"

function getTodayStr(): string {
  return new Date().toISOString().split("T")[0]
}

function loadData(): AuraData {
  if (typeof window === "undefined")
    return { sessions: [], streak: 0, lastActiveDate: "" }
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return { sessions: [], streak: 0, lastActiveDate: "" }
  try {
    return JSON.parse(raw)
  } catch {
    return { sessions: [], streak: 0, lastActiveDate: "" }
  }
}

function saveData(data: AuraData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export function getAuraData(): AuraData {
  return loadData()
}

export function getTodayStudyHours(): number {
  const data = loadData()
  const today = getTodayStr()
  return data.sessions
    .filter((s) => s.date === today && s.type === "study")
    .reduce((sum, s) => sum + parseFloat(s.detail), 0)
}

function updateStreak(data: AuraData): void {
  const today = getTodayStr()
  if (data.lastActiveDate === today) return
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0]
  if (data.lastActiveDate === yesterday) {
    data.streak += 1
  } else {
    data.streak = 1
  }
  data.lastActiveDate = today
}

export function addStudySession(hours: number): AuraData {
  const data = loadData()
  const today = getTodayStr()
  const todayStudyHours = data.sessions
    .filter((s) => s.date === today && s.type === "study")
    .reduce((sum, s) => sum + parseFloat(s.detail), 0)

  const effectiveHours = Math.min(hours, 12 - todayStudyHours)
  if (effectiveHours <= 0) return data

  data.sessions.push({
    id: crypto.randomUUID(),
    type: "study",
    points: Math.round(effectiveHours * 3 * 10) / 10,
    detail: String(effectiveHours),
    timestamp: Date.now(),
    date: today,
  })

  updateStreak(data)
  saveData(data)
  return data
}

export function completeAssignment(
  assignmentId: string,
  title: string,
): AuraData {
  const data = loadData()
  const awardId = `assign-${assignmentId}`
  if (data.sessions.some((s) => s.id === awardId)) return data
  data.sessions.push({
    id: awardId,
    type: "task",
    points: 5,
    detail: title,
    timestamp: Date.now(),
    date: getTodayStr(),
  })
  updateStreak(data)
  saveData(data)
  return data
}

export function uncompleteAssignment(assignmentId: string): AuraData {
  const data = loadData()
  data.sessions = data.sessions.filter(
    (s) => s.id !== `assign-${assignmentId}`,
  )
  saveData(data)
  return data
}

export function getTotalPoints(data: AuraData): number {
  return (
    Math.round(data.sessions.reduce((sum, s) => sum + s.points, 0) * 10) / 10
  )
}

export function getPointsByType(data: AuraData) {
  const calc = (type: AuraSession["type"]) =>
    Math.round(
      data.sessions
        .filter((s) => s.type === type)
        .reduce((sum, s) => sum + s.points, 0) * 10,
    ) / 10
  return { study: calc("study"), assignment: calc("task") }
}

export interface RankInfo {
  name: string
  emoji: string
  label: string
  min: number
  max: number
}

const RANKS: RankInfo[] = [
  {
    name: "Delulu",
    emoji: "💀",
    label: "Delulu phase detected 💀",
    min: 0,
    max: 150,
  },
  {
    name: "Coping",
    emoji: "😤",
    label: "Coping but make it aesthetic 😤",
    min: 150,
    max: 300,
  },
  {
    name: "Locked In",
    emoji: "🔥",
    label: "You are locked in 🔥",
    min: 300,
    max: 600,
  },
  {
    name: "Built Different",
    emoji: "💪",
    label: "Built different fr fr 💪",
    min: 600,
    max: 1000,
  },
  {
    name: "Academic Maniac",
    emoji: "🧠",
    label: "Academic Maniac mode 🧠",
    min: 1000,
    max: 2000,
  },
  {
    name: "Sleep Deprived Demon",
    emoji: "😈",
    label: "Sleep Deprived Demon activated 😈",
    min: 2000,
    max: 3000,
  },
  {
    name: "Final Boss",
    emoji: "⚔️",
    label: "Final Boss Energy unlocked ⚔️",
    min: 3000,
    max: 5000,
  },
  {
    name: "God Mode",
    emoji: "👑",
    label: "GOD MODE ACTIVATED 👑",
    min: 5000,
    max: Infinity,
  },
]

export function getRank(points: number): RankInfo {
  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (points >= RANKS[i].min) return RANKS[i]
  }
  return RANKS[0]
}

export function getNextRank(points: number): RankInfo | null {
  const current = getRank(points)
  const idx = RANKS.indexOf(current)
  return idx < RANKS.length - 1 ? RANKS[idx + 1] : null
}

export function getProgressToNextRank(points: number): number {
  const current = getRank(points)
  const next = getNextRank(points)
  if (!next) return 100
  const range = next.min - current.min
  const progress = points - current.min
  return Math.min(100, Math.round((progress / range) * 1000) / 10)
}

export function resetAuraData(): AuraData {
  const empty: AuraData = { sessions: [], streak: 0, lastActiveDate: "" }
  saveData(empty)
  return empty
}

export const RANK_STYLES: Record<
  string,
  { gradient: string; glow: string; accent: string }
> = {
  Delulu: {
    gradient: "from-slate-500 to-slate-400",
    glow: "0 0 30px rgba(148,163,184,0.3)",
    accent: "#94a3b8",
  },
  Coping: {
    gradient: "from-blue-500 to-cyan-400",
    glow: "0 0 30px rgba(59,130,246,0.4)",
    accent: "#3b82f6",
  },
  "Locked In": {
    gradient: "from-orange-500 to-amber-400",
    glow: "0 0 30px rgba(249,115,22,0.4)",
    accent: "#f97316",
  },
  "Built Different": {
    gradient: "from-violet-600 to-fuchsia-400",
    glow: "0 0 30px rgba(139,92,246,0.4)",
    accent: "#8b5cf6",
  },
  "Academic Maniac": {
    gradient: "from-emerald-500 to-teal-300",
    glow: "0 0 30px rgba(16,185,129,0.4)",
    accent: "#10b981",
  },
  "Sleep Deprived Demon": {
    gradient: "from-red-600 to-rose-400",
    glow: "0 0 30px rgba(239,68,68,0.4)",
    accent: "#ef4444",
  },
  "Final Boss": {
    gradient: "from-amber-500 to-yellow-300",
    glow: "0 0 30px rgba(245,158,11,0.5)",
    accent: "#f59e0b",
  },
  "God Mode": {
    gradient: "from-yellow-400 via-pink-500 to-violet-500",
    glow: "0 0 40px rgba(234,179,8,0.5), 0 0 80px rgba(236,72,153,0.3)",
    accent: "#eab308",
  },
}
