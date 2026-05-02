import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"

export async function GET() {
  const cookieStore = await cookies()
  const token = cookieStore.get("canvas_token")?.value

  if (!token) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const res = await fetch(
    "https://canvas.anu.edu.au/api/v1/users/self/profile",
    { headers: { Authorization: `Bearer ${token}` } },
  )

  if (!res.ok) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 })
  }

  const profile = await res.json()
  return NextResponse.json({
    name: profile.name,
    avatar_url: profile.avatar_url,
  })
}

export async function POST(req: NextRequest) {
  const { token } = await req.json()

  if (!token || typeof token !== "string") {
    return NextResponse.json({ error: "Token is required" }, { status: 400 })
  }

  const res = await fetch(
    "https://canvas.anu.edu.au/api/v1/users/self/profile",
    { headers: { Authorization: `Bearer ${token}` } },
  )

  if (!res.ok) {
    return NextResponse.json(
      { error: "Invalid token" },
      { status: 401 },
    )
  }

  const profile = await res.json()

  const cookieStore = await cookies()
  cookieStore.set("canvas_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  })

  return NextResponse.json({
    name: profile.name,
    avatar_url: profile.avatar_url,
  })
}

export async function DELETE() {
  const cookieStore = await cookies()
  cookieStore.delete("canvas_token")
  return NextResponse.json({ ok: true })
}
