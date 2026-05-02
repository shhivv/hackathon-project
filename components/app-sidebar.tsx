"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  ClipboardList,
  LogOut,
  GraduationCap,
  Bell,
  Sun,
  Moon,
  Settings,
  Sparkles,
  X,
} from "lucide-react"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { requestNotificationPermission } from "@/lib/assignments"

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/assignments", label: "Assignments", icon: ClipboardList },
  { href: "/aura", label: "Planaura", icon: Sparkles },
  { href: "/settings", label: "Settings", icon: Settings },
]

export function AppSidebar({ open, onClose }: { open?: boolean; onClose?: () => void }) {
  const pathname = usePathname()
  const { user, courses, logout } = useAuth()
  const { resolvedTheme, setTheme } = useTheme()

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 flex w-64 shrink-0 flex-col border-r border-border bg-card transition-transform duration-200 lg:static lg:translate-x-0",
        open ? "translate-x-0" : "-translate-x-full"
      )}>
      <div className="flex items-center justify-between px-4 pt-5 pb-4">
        <div className="flex items-center gap-2">
          <GraduationCap className="h-6 w-6 text-primary" />
          <span className="text-sm font-semibold tracking-tight">
            Planora
          </span>
        </div>
        <button
          onClick={onClose}
          className="rounded-md p-1 text-muted-foreground hover:text-foreground lg:hidden"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <Separator />

      <nav className="flex flex-col gap-1 px-3 pt-4">
        {navItems.map((item) => {
          const active = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
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
          <span className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
            Courses
          </span>
          <span className="text-xs text-muted-foreground">
            {courses.length}
          </span>
        </div>
        <ScrollArea className="h-48">
          <div className="flex flex-col gap-0.5">
            {courses
              .filter((c) => c.workflow_state === "available")
              .map((course) => (
                <Link
                  key={course.id}
                  href={`/courses/${course.id}`}
                  className={cn(
                    "truncate rounded px-3 py-1.5 text-xs transition-colors",
                    pathname === `/courses/${course.id}`
                      ? "bg-primary/10 font-medium text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                  title={course.name}
                >
                  {course.course_code}
                </Link>
              ))}
          </div>
        </ScrollArea>
      </div>

      <div className="mt-auto border-t p-3">
        <Button
          variant="ghost"
          size="sm"
          className="mb-1 w-full justify-start gap-2 text-xs text-muted-foreground"
          onClick={() => requestNotificationPermission()}
        >
          <Bell className="h-3.5 w-3.5" />
          Enable Notifications
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="mb-1 w-full justify-start gap-2 text-xs text-muted-foreground"
          onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
        >
          {resolvedTheme === "dark" ? (
            <Sun className="h-3.5 w-3.5" />
          ) : (
            <Moon className="h-3.5 w-3.5" />
          )}
          {resolvedTheme === "dark" ? "Light mode" : "Dark mode"}
        </Button>
        <Separator className="mb-2" />
        <div className="flex items-center justify-between px-2">
          <span className="truncate text-xs text-muted-foreground">
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
    </>
  )
}
