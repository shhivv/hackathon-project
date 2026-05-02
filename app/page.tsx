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
        <p className="text-muted-foreground text-sm">Loading...</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex min-h-svh items-center justify-center p-6">
        <div className="flex w-full max-w-sm flex-col gap-4">
          <h1 className="text-lg font-medium">Connect to Canvas</h1>
          <p className="text-muted-foreground text-sm">
            Paste your Canvas access token to get started. You can generate one
            at{" "}
            <a
              href="https://canvas.anu.edu.au/profile/settings"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              Canvas Settings
            </a>
            .
          </p>
          <input
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Canvas access token"
            className="border-input bg-background rounded-md border px-3 py-2 text-sm"
            onKeyDown={(e) => e.key === "Enter" && token && handleLogin()}
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button onClick={handleLogin} disabled={!token || loading}>
            {loading ? "Connecting..." : "Connect"}
          </Button>
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
              <div
                key={course.id}
                className="rounded-lg border p-4"
              >
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
