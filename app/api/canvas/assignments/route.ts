import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"
import { fetchAssignments } from "@/lib/canvas"

export async function GET(req: NextRequest) {
  const cookieStore = await cookies()
  const token = cookieStore.get("canvas_token")?.value

  if (!token) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const courseId = req.nextUrl.searchParams.get("course_id")
  if (!courseId) {
    return NextResponse.json(
      { error: "course_id is required" },
      { status: 400 },
    )
  }

  try {
    const assignments = await fetchAssignments(token, Number(courseId))
    return NextResponse.json(assignments)
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
