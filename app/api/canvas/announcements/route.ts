import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"
import { fetchAnnouncements } from "@/lib/canvas"

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

  try {
    const announcements = await fetchAnnouncements(
      token,
      contextCodes,
      startDate
    )
    return NextResponse.json(announcements)
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
