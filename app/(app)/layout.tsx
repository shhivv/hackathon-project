"use client"

import { useState, useEffect } from "react"
import { Menu, GraduationCap } from "lucide-react"
import { AuthProvider, useAuth } from "@/components/auth-provider"
import { AppSidebar } from "@/components/app-sidebar"
import { TimeAllocationFlow } from "@/components/TimeAllocationFlow"
import {
  hasCompletedTimeAllocation,
  getTimeAllocation,
} from "@/lib/timeAllocationStore"

function AuthGate({ children }: { children: React.ReactNode }) {
  const { loading } = useAuth()
  const [allocationDone, setAllocationDone] = useState<boolean | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

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
    <div className="flex h-svh">
      <AppSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-12 shrink-0 items-center gap-3 border-b px-4 lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-md p-1 text-muted-foreground hover:text-foreground"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-primary" />
            <span className="text-sm font-semibold">Planora</span>
          </div>
        </header>
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
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
