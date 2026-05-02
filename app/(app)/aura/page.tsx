"use client"

import { useState, useEffect, useCallback } from "react"
import {
  type AuraData,
  getAuraData,
  getTodayStudyHours,
  getTotalPoints,
  getPointsByType,
  getRank,
  getNextRank,
  getProgressToNextRank,
  resetAuraData,
  RANK_STYLES,
} from "@/lib/auraStore"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import {
  Flame,
  BookOpen,
  CheckCircle2,
  TrendingUp,
  RotateCcw,
  Sparkles,
  Clock,
  Trophy,
} from "lucide-react"

export default function AuraPage() {
  const [data, setData] = useState<AuraData | null>(null)
  const [todayHours, setTodayHours] = useState(0)

  useEffect(() => {
    setData(getAuraData())
    setTodayHours(getTodayStudyHours())
  }, [])

  const handleReset = useCallback(() => {
    setData(resetAuraData())
    setTodayHours(0)
  }, [])

  if (!data) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  const total = getTotalPoints(data)
  const rank = getRank(total)
  const nextRank = getNextRank(total)
  const progress = getProgressToNextRank(total)
  const breakdown = getPointsByType(data)
  const style = RANK_STYLES[rank.name] ?? RANK_STYLES["Delulu"]
  const recentSessions = [...data.sessions]
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 10)

  return (
    <div className="min-h-svh overflow-auto bg-background p-4 md:p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-bold tracking-tight">
              Planaura Points
            </h1>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="text-xs text-muted-foreground hover:text-destructive"
          >
            <RotateCcw className="mr-1.5 h-3 w-3" />
            Reset
          </Button>
        </div>

        {/* Rank Hero */}
        <Card
          className="aura-hero-card relative overflow-hidden border-0"
          style={{ boxShadow: style.glow }}
        >
          <div
            className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${style.gradient} opacity-10`}
          />
          <CardContent className="relative flex flex-col items-center gap-3 py-8 text-center">
            <div className="text-6xl">{rank.emoji}</div>
            <h2
              className={`bg-gradient-to-r bg-clip-text text-3xl font-black tracking-tight text-transparent ${style.gradient}`}
            >
              {rank.name}
            </h2>
            <p className="text-sm text-muted-foreground">{rank.label}</p>
            <div className="mt-2 flex items-baseline gap-1">
              <span
                className="text-5xl font-black tabular-nums"
                style={{ color: style.accent }}
              >
                {total}
              </span>
              <span className="text-sm font-medium text-muted-foreground">
                planaura pts
              </span>
            </div>
            {data.streak > 0 && (
              <Badge
                variant="secondary"
                className="mt-1 gap-1 border-0 bg-orange-500/15 text-orange-500"
              >
                <Flame className="h-3 w-3" />
                {data.streak} day streak
              </Badge>
            )}
          </CardContent>
        </Card>

        {/* Progress to Next Rank */}
        {nextRank && (
          <Card>
            <CardContent className="space-y-3 pt-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-muted-foreground">
                  {rank.emoji} {rank.name}
                </span>
                <span className="font-medium text-muted-foreground">
                  {nextRank.emoji} {nextRank.name}
                </span>
              </div>
              <Progress value={progress} className="h-2.5" />
              <p className="text-center text-xs text-muted-foreground">
                <span className="font-semibold" style={{ color: style.accent }}>
                  {Math.round((nextRank.min - total) * 10) / 10}
                </span>{" "}
                pts to next rank ({progress}%)
              </p>
            </CardContent>
          </Card>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card size="sm">
            <CardContent className="flex flex-col items-center gap-1 text-center">
              <Clock className="h-4 w-4 text-blue-500" />
              <span className="text-lg font-bold tabular-nums">
                {todayHours}/{12}
              </span>
              <span className="text-[10px] text-muted-foreground">
                Study hrs today
              </span>
            </CardContent>
          </Card>
          <Card size="sm">
            <CardContent className="flex flex-col items-center gap-1 text-center">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              <span className="text-lg font-bold tabular-nums">
                {data.sessions.length}
              </span>
              <span className="text-[10px] text-muted-foreground">
                Total sessions
              </span>
            </CardContent>
          </Card>
          <Card size="sm">
            <CardContent className="flex flex-col items-center gap-1 text-center">
              <Flame className="h-4 w-4 text-orange-500" />
              <span className="text-lg font-bold tabular-nums">
                {data.streak}
              </span>
              <span className="text-[10px] text-muted-foreground">
                Day streak
              </span>
            </CardContent>
          </Card>
        </div>

        {/* Points Breakdown */}
        <div className="grid grid-cols-2 gap-3">
          <Card size="sm">
            <CardContent className="flex flex-col items-center gap-1 text-center">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/15">
                <BookOpen className="h-4 w-4 text-blue-500" />
              </div>
              <span className="text-xl font-bold tabular-nums text-blue-500">
                {breakdown.study}
              </span>
              <span className="text-[10px] text-muted-foreground">
                Study pts
              </span>
            </CardContent>
          </Card>
          <Card size="sm">
            <CardContent className="flex flex-col items-center gap-1 text-center">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/15">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              </div>
              <span className="text-xl font-bold tabular-nums text-emerald-500">
                {breakdown.assignment}
              </span>
              <span className="text-[10px] text-muted-foreground">
                Assignment pts
              </span>
            </CardContent>
          </Card>
        </div>

        {/* Activity Log */}
        {recentSessions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Trophy className="h-4 w-4 text-amber-500" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {recentSessions.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 text-sm"
                  >
                    <div className="flex items-center gap-2.5">
                      {s.type === "study" && (
                        <BookOpen className="h-3.5 w-3.5 text-blue-500" />
                      )}
                      {s.type === "task" && (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                      )}
                      <span className="max-w-[200px] truncate text-xs text-muted-foreground md:max-w-none">
                        {s.type === "study" && `Studied ${s.detail}h`}
                        {s.type === "task" && `Completed: ${s.detail}`}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-semibold text-primary">
                        +{s.points} pts
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {formatTime(s.timestamp)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Rank Guide */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Rank Guide</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
              {[
                { name: "Delulu", emoji: "💀", range: "0-150" },
                { name: "Coping", emoji: "😤", range: "150-300" },
                { name: "Locked In", emoji: "🔥", range: "300-600" },
                { name: "Built Different", emoji: "💪", range: "600-1K" },
                { name: "Academic Maniac", emoji: "🧠", range: "1K-2K" },
                {
                  name: "Sleep Deprived Demon",
                  emoji: "😈",
                  range: "2K-3K",
                },
                { name: "Final Boss", emoji: "⚔️", range: "3K-5K" },
                { name: "God Mode", emoji: "👑", range: "5K+" },
              ].map((r) => {
                const isActive = rank.name === r.name
                const rs = RANK_STYLES[r.name]
                return (
                  <div
                    key={r.name}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs transition-all ${
                      isActive
                        ? "border-primary/30 bg-primary/5 font-semibold"
                        : "border-transparent bg-muted/30 text-muted-foreground"
                    }`}
                    style={isActive ? { boxShadow: rs?.glow } : undefined}
                  >
                    <span>{r.emoji}</span>
                    <div>
                      <div>{r.name}</div>
                      <div className="text-[10px] opacity-60">{r.range}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function formatTime(ts: number): string {
  const d = new Date(ts)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return "just now"
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  return d.toLocaleDateString()
}
