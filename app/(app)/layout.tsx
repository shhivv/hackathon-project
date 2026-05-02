"use client"

import { useState, useEffect } from "react"
import { AuthProvider, useAuth } from "@/components/auth-provider"
import { AppSidebar } from "@/components/app-sidebar"
import { TimeAllocationFlow } from "@/components/TimeAllocationFlow"
import {
  hasCompletedTimeAllocation,
  getTimeAllocation,
} from "@/lib/timeAllocationStore"

function AuthGate({ children }: { children: React.ReactNode }) {
  const { loading } = useAuth()
  // null = not yet checked (defer until after auth resolves to avoid SSR mismatch)
  const [allocationDone, setAllocationDone] = useState<boolean | null>(null)

  useEffect(() => {
    if (!loading) {
      setAllocationDone(hasCompletedTimeAllocation())
    }
  }, [loading])

  if (loading || allocationDone === null) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!allocationDone) {
    return (
      <TimeAllocationFlow
        initialData={getTimeAllocation()}
        onComplete={() => setAllocationDone(true)}
      />
    )
  }

  return (
    <div className="flex min-h-svh">
      <AppSidebar />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AuthGate>{children}</AuthGate>
    </AuthProvider>
  )
}
