"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import type { CanvasCourse } from "@/lib/canvas"

export default function Page() {
  const [token, setToken] = useState("")
  const [user, setUser] = useState<{ name: string; avatar_url: string } | null>(
    null,
  )
  const [courses, setCourses] = useState<CanvasCourse[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    fetch("/api/canvas/courses")
      .then((res) => {
        if (res.ok) return res.json()
        throw new Error()
      })
      .then((data) => {
        setCourses(data)
        setUser({ name: "Canvas User", avatar_url: "" })
      })
      .catch(() => {})
      .finally(() => setChecking(false))
  }, [])

  async function handleLogin() {
    setLoading(true)
    setError("")

    try {
      const res = await fetch("/api/canvas/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Authentication failed")
      }

      const profile = await res.json()
      setUser(profile)

      const coursesRes = await fetch("/api/canvas/courses")
      if (coursesRes.ok) {
        setCourses(await coursesRes.json())
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  async function handleLogout() {
    await fetch("/api/canvas/auth", { method: "DELETE" })
    setUser(null)
    setCourses([])
    setToken("")
  }

  if (checking) {
    return (
      <div className="flex min-h-svh items-center justify-center p-6">
        <p className="text-muted-foreground text-sm">Loading…</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex min-h-svh items-center justify-center p-6">
        <div className="flex w-full max-w-md flex-col gap-8">
          {/* Header */}
          <div className="flex flex-col gap-1.5">
            <h1 className="text-2xl font-semibold tracking-tight">
              Connect to Canvas
            </h1>
            <p className="text-muted-foreground text-sm">
              Generate a personal access token from ANU Canvas — it takes about
              a minute.
            </p>
          </div>

          {/* Step-by-step guide */}
          <div className="flex flex-col">
            {/* Step 1 */}
            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="bg-primary text-primary-foreground flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
                  1
                </div>
                <div className="bg-border mt-2 w-px flex-1" />
              </div>
              <div className="flex flex-col gap-1 pb-6">
                <p className="text-sm font-medium leading-none">
                  Open Canvas Settings
                </p>
                <p className="text-muted-foreground text-sm">
                  Visit{" "}
                  <a
                    href="https://canvas.anu.edu.au/profile/settings"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline underline-offset-2"
                  >
                    canvas.anu.edu.au/profile/settings
                  </a>{" "}
                  and sign in with your ANU credentials if prompted.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="bg-primary text-primary-foreground flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
                  2
                </div>
                <div className="bg-border mt-2 w-px flex-1" />
              </div>
              <div className="flex flex-col gap-1 pb-6">
                <p className="text-sm font-medium leading-none">
                  Find Approved Integrations
                </p>
                <p className="text-muted-foreground text-sm">
                  Scroll to the{" "}
                  <span className="text-foreground font-medium">
                    Approved Integrations
                  </span>{" "}
                  section near the bottom of the page.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="bg-primary text-primary-foreground flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
                  3
                </div>
                <div className="bg-border mt-2 w-px flex-1" />
              </div>
              <div className="flex flex-col gap-1 pb-6">
                <p className="text-sm font-medium leading-none">
                  Generate a new token
                </p>
                <p className="text-muted-foreground text-sm">
                  Click{" "}
                  <span className="text-foreground font-medium">
                    + New Access Token
                  </span>
                  , enter a purpose like{" "}
                  <code className="bg-muted rounded px-1 py-0.5 font-mono text-xs">
                    Study Planner
                  </code>
                  , then click{" "}
                  <span className="text-foreground font-medium">
                    Generate Token
                  </span>
                  .
                </p>
              </div>
            </div>

            {/* Step 4 — no connector line */}
            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="bg-primary text-primary-foreground flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
                  4
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium leading-none">
                  Copy the token
                </p>
                <p className="text-muted-foreground text-sm">
                  Copy the token shown in the dialog — it won&apos;t be
                  displayed again after you close it.
                </p>
              </div>
            </div>
          </div>

          {/* Token input + CTA */}
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="token" className="text-sm font-medium">
                Paste your token
              </label>
              <input
                id="token"
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="canvas_token_…"
                className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring rounded-md border px-3 py-2 font-mono text-sm outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                onKeyDown={(e) => e.key === "Enter" && token && handleLogin()}
              />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button
              onClick={handleLogin}
              disabled={!token || loading}
              className="w-full"
            >
              {loading ? "Connecting…" : "Connect to Canvas"}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-svh p-6">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-medium">Your Courses</h1>
            <p className="text-muted-foreground text-sm">
              Logged in as {user.name}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            Disconnect
          </Button>
        </div>

        {courses.length === 0 ? (
          <p className="text-muted-foreground text-sm">No courses found.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {courses.map((course) => (
              <div key={course.id} className="rounded-lg border p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium">{course.name}</p>
                    <p className="text-muted-foreground text-sm">
                      {course.course_code}
                    </p>
                  </div>
                  <span className="bg-muted text-muted-foreground rounded px-2 py-0.5 text-xs">
                    {course.workflow_state}
                  </span>
                </div>
                {course.term && (
                  <p className="text-muted-foreground mt-1 text-xs">
                    {course.term.name}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
