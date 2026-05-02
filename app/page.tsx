"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { GraduationCap } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function LoginPage() {
  const [token, setToken] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [checking, setChecking] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetch("/api/canvas/auth")
      .then((res) => {
        if (res.ok) router.replace("/dashboard")
        else setChecking(false)
      })
      .catch(() => setChecking(false))
  }, [router])

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

      router.push("/dashboard")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  if (checking) {
    return (
      <div className="flex min-h-svh items-center justify-center p-6">
        <div className="flex items-center gap-3">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <div className="flex w-full max-w-md flex-col gap-8">
        {/* Header */}
        <div className="flex flex-col gap-1.5">
          <h1 className="text-2xl font-semibold tracking-tight">
            Connect to Canvas
          </h1>
          <p className="text-sm text-muted-foreground">
            Generate a personal access token from ANU Canvas — it takes about a
            minute.
          </p>
        </div>

        {/* Step-by-step guide */}
        <div className="flex flex-col">
          {/* Step 1 */}
          <div className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                1
              </div>
              <div className="mt-2 w-px flex-1 bg-border" />
            </div>
            <div className="flex flex-col gap-1 pb-6">
              <p className="text-sm leading-none font-medium">
                Open Canvas Settings
              </p>
              <p className="text-sm text-muted-foreground">
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
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                2
              </div>
              <div className="mt-2 w-px flex-1 bg-border" />
            </div>
            <div className="flex flex-col gap-1 pb-6">
              <p className="text-sm leading-none font-medium">
                Find Approved Integrations
              </p>
              <p className="text-sm text-muted-foreground">
                Scroll to the{" "}
                <span className="font-medium text-foreground">
                  Approved Integrations
                </span>{" "}
                section near the bottom of the page.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                3
              </div>
              <div className="mt-2 w-px flex-1 bg-border" />
            </div>
            <div className="flex flex-col gap-1 pb-6">
              <p className="text-sm leading-none font-medium">
                Generate a new token
              </p>
              <p className="text-sm text-muted-foreground">
                Click{" "}
                <span className="font-medium text-foreground">
                  + New Access Token
                </span>
                , enter a purpose like{" "}
                <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
                  Study Planner
                </code>
                , then click{" "}
                <span className="font-medium text-foreground">
                  Generate Token
                </span>
                .
              </p>
            </div>
          </div>

          {/* Step 4 — no connector line */}
          <div className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                4
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-sm leading-none font-medium">Copy the token</p>
              <p className="text-sm text-muted-foreground">
                Copy the token shown in the dialog — it won&apos;t be displayed
                again after you close it.
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
              className="rounded-md border border-input bg-background px-3 py-2 font-mono text-sm ring-offset-background outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              onKeyDown={(e) => e.key === "Enter" && token && handleLogin()}
            />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button
            onClick={handleLogin}
            disabled={!token || loading}
            className="w-full"
          >
            {loading ? "Connecting..." : "Connect"}
          </Button>
        </div>
      </div>
    </div>
  )
}
