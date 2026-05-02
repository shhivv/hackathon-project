"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { GraduationCap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

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
          <div className="border-primary h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" />
          <p className="text-muted-foreground text-sm">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <div className="flex items-center gap-2">
          <GraduationCap className="text-primary h-7 w-7" />
          <span className="text-lg font-semibold tracking-tight">
            StudyTracker
          </span>
        </div>

        <div>
          <h1 className="mb-1 text-lg font-medium">Connect to Canvas</h1>
          <p className="text-muted-foreground text-sm">
            Paste your Canvas access token to get started. You can generate one
            at{" "}
            <a
              href="https://canvas.anu.edu.au/profile/settings"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline"
            >
              Canvas Settings
            </a>
            .
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <Input
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Canvas access token"
            onKeyDown={(e) => e.key === "Enter" && token && handleLogin()}
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button onClick={handleLogin} disabled={!token || loading}>
            {loading ? "Connecting..." : "Connect"}
          </Button>
        </div>
      </div>
    </div>
  )
}
