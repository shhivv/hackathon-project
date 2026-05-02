import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { fetchCourses, fetchAnnouncements } from "@/lib/canvas"

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim()
}

export async function GET() {
  const cookieStore = await cookies()
  const token = cookieStore.get("canvas_token")?.value

  if (!token) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: "OpenRouter API key not configured" },
      { status: 500 }
    )
  }

  try {
    const courses = await fetchCourses(token)
    const active = courses.filter((c) => c.workflow_state === "available")

    if (active.length === 0) {
      return NextResponse.json({ summary: "No active courses found." })
    }

    const contextCodes = active.map((c) => `course_${c.id}`)
    const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10)

    const announcements = await fetchAnnouncements(
      token,
      contextCodes,
      twoWeeksAgo
    )

    if (announcements.length === 0) {
      return NextResponse.json({
        summary: "No recent announcements from your courses.",
      })
    }

    const courseMap = new Map(active.map((c) => [`course_${c.id}`, c.course_code]))

    const formatted = announcements
      .sort(
        (a, b) =>
          new Date(b.posted_at).getTime() - new Date(a.posted_at).getTime()
      )
      .slice(0, 20)
      .map((a) => {
        const course = courseMap.get(a.context_code) ?? "Unknown"
        const posted = new Date(a.posted_at).toLocaleDateString("en-AU", {
          weekday: "short",
          year: "numeric",
          month: "short",
          day: "numeric",
        })
        const body = stripHtml(a.message).slice(0, 500)
        return `[${course}] (posted ${posted}) ${a.title}: ${body}`
      })
      .join("\n\n")

    const today = new Date().toLocaleDateString("en-AU", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })

    const systemPrompt = `Today's date is ${today}. You summarize university course announcements for a student. Be direct and concise. Use bullet points only, no headers or extra formatting. Prioritize deadlines, due dates, and urgent action items first — frame them relative to today (e.g. "due in 3 days", "due tomorrow", "overdue"). Put the most important and time-sensitive information at the top.`
    const userPrompt = `Summarize these recent Canvas announcements into exactly 4 bullet points. Most urgent/deadline-related info first:\n\n${formatted}`

    const res = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "openai/gpt-4.1-mini",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          max_tokens: 300,
        }),
      }
    )

    if (!res.ok) {
      const text = await res.text()
      return NextResponse.json(
        { error: `OpenRouter error (${res.status}): ${text}` },
        { status: 502 }
      )
    }

    const data = await res.json()
    const summary =
      data.choices?.[0]?.message?.content?.trim() ??
      "Could not generate summary."

    return NextResponse.json({ summary })
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
