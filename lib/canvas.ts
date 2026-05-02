const CANVAS_BASE_URL = "https://canvas.anu.edu.au"

export interface CanvasCourse {
  id: number
  name: string
  course_code: string
  workflow_state: string
  enrollment_term_id: number
  start_at: string | null
  end_at: string | null
  enrollments?: { type: string; role: string }[]
  term?: { id: number; name: string }
}

export interface CanvasAssignment {
  id: number
  name: string
  description: string | null
  due_at: string | null
  points_possible: number | null
  submission_types: string[]
  html_url: string
  course_id: number
  has_submitted_submissions: boolean
  lock_at: string | null
  unlock_at: string | null
  submission?: {
    submitted_at: string | null
    workflow_state: string
    score: number | null
  }
}

export async function fetchAssignments(
  token: string,
  courseId: number,
): Promise<CanvasAssignment[]> {
  const res = await fetch(
    `${CANVAS_BASE_URL}/api/v1/courses/${courseId}/assignments?per_page=50&order_by=due_at&include[]=submission`,
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  )

  if (!res.ok) return []
  return res.json()
}

export async function fetchUserProfile(
  token: string,
): Promise<{ name: string; avatar_url: string }> {
  const res = await fetch(
    `${CANVAS_BASE_URL}/api/v1/users/self/profile`,
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  )

  if (!res.ok) throw new Error("Failed to fetch profile")
  const profile = await res.json()
  return { name: profile.name, avatar_url: profile.avatar_url }
}

export async function fetchCourses(token: string): Promise<CanvasCourse[]> {
  const res = await fetch(
    `${CANVAS_BASE_URL}/api/v1/courses?per_page=50&include[]=term&include[]=enrollments`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  )

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Canvas API error (${res.status}): ${text}`)
  }

  return res.json()
}
