import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { fetchCourses } from "@/lib/canvas"

export async function GET() {
  const cookieStore = await cookies()
  const token = cookieStore.get("canvas_token")?.value

  if (!token) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  try {
    const courses = await fetchCourses(token)
    return NextResponse.json(courses)
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
