import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"
import { fetchCalendarEvents } from "@/lib/canvas"

export async function GET(req: NextRequest) {
  const cookieStore = await cookies()
  const token = cookieStore.get("canvas_token")?.value

  if (!token) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const contextCodes = req.nextUrl.searchParams.getAll("context_codes[]")
  if (contextCodes.length === 0) {
    return NextResponse.json(
      { error: "context_codes[] is required" },
      { status: 400 }
    )
  }

  const startDate = req.nextUrl.searchParams.get("start_date") ?? undefined
  const endDate = req.nextUrl.searchParams.get("end_date") ?? undefined

  try {
    const events = await fetchCalendarEvents(
      token,
      contextCodes,
      startDate,
      endDate
    )
    return NextResponse.json(events)
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
