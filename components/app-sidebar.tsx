"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  ClipboardList,
  LogOut,
  GraduationCap,
  Bell,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { requestNotificationPermission } from "@/lib/assignments"

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/assignments", label: "Assignments", icon: ClipboardList },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { user, courses, logout } = useAuth()

  return (
    <aside className="bg-card border-border flex h-svh w-64 shrink-0 flex-col border-r">
      <div className="flex items-center gap-2 px-4 pt-5 pb-4">
        <GraduationCap className="text-primary h-6 w-6" />
        <span className="text-sm font-semibold tracking-tight">
          StudyTracker
        </span>
      </div>

      <Separator />

      <nav className="flex flex-col gap-1 px-3 pt-4">
        {navItems.map((item) => {
          const active = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <Separator className="mx-3 mt-4" />

      <div className="px-3 pt-3">
        <div className="flex items-center justify-between px-3 pb-2">
          <span className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
            Courses
          </span>
          <span className="text-muted-foreground text-xs">{courses.length}</span>
        </div>
        <ScrollArea className="h-48">
          <div className="flex flex-col gap-0.5">
            {courses
              .filter((c) => c.workflow_state === "available")
              .map((course) => (
                <div
                  key={course.id}
                  className="text-muted-foreground truncate rounded px-3 py-1.5 text-xs"
                  title={course.name}
                >
                  {course.course_code}
                </div>
              ))}
          </div>
        </ScrollArea>
      </div>

      <div className="mt-auto border-t p-3">
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground mb-1 w-full justify-start gap-2 text-xs"
          onClick={() => requestNotificationPermission()}
        >
          <Bell className="h-3.5 w-3.5" />
          Enable Notifications
        </Button>
        <Separator className="mb-2" />
        <div className="flex items-center justify-between px-2">
          <span className="text-muted-foreground truncate text-xs">
            {user?.name ?? "User"}
          </span>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={logout}
            title="Disconnect"
          >
            <LogOut className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </aside>
  )
}
