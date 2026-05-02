"use client"

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react"
import { useRouter } from "next/navigation"
import type { CanvasCourse } from "@/lib/canvas"

interface AuthState {
  user: { name: string; avatar_url: string } | null
  courses: CanvasCourse[]
  loading: boolean
  logout: () => Promise<void>
  refreshCourses: () => Promise<void>
}

const AuthContext = createContext<AuthState>({
  user: null,
  courses: [],
  loading: true,
  logout: async () => {},
  refreshCourses: async () => {},
})

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<{ name: string; avatar_url: string } | null>(
    null
  )
  const [courses, setCourses] = useState<CanvasCourse[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const refreshCourses = useCallback(async () => {
    try {
      const res = await fetch("/api/canvas/courses")
      if (res.ok) setCourses(await res.json())
    } catch {
      // silently fail
    }
  }, [])

  useEffect(() => {
    async function checkAuth() {
      try {
        const [profileRes, coursesRes] = await Promise.all([
          fetch("/api/canvas/auth"),
          fetch("/api/canvas/courses"),
        ])

        if (!profileRes.ok) {
          router.replace("/")
          return
        }

        const profile = await profileRes.json()
        setUser(profile)

        if (coursesRes.ok) {
          setCourses(await coursesRes.json())
        }
      } catch {
        router.replace("/")
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [router])

  async function logout() {
    await fetch("/api/canvas/auth", { method: "DELETE" })
    setUser(null)
    setCourses([])
    router.replace("/")
  }

  return (
    <AuthContext.Provider
      value={{ user, courses, loading, logout, refreshCourses }}
    >
      {children}
    </AuthContext.Provider>
  )
}
