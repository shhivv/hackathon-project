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
