import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { fetchCourses, fetchAssignments } from "@/lib/canvas"

export async function GET() {
  const cookieStore = await cookies()
  const token = cookieStore.get("canvas_token")?.value

  if (!token) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  try {
    const courses = await fetchCourses(token)
    const activeCourses = courses.filter(
      (c) => c.workflow_state === "available"
    )

    const results = await Promise.all(
      activeCourses.map(async (course) => {
        const assignments = await fetchAssignments(token, course.id)
        return assignments.map((a) => ({
          ...a,
          course_name: course.name,
          course_code: course.course_code,
        }))
      })
    )

    return NextResponse.json(results.flat())
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
