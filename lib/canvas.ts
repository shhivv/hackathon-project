const CANVAS_BASE_URL = "https://canvas.anu.edu.au"

// --- Types ---

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
  lock_at: string | null
  unlock_at: string | null
  points_possible: number
  course_id: number
  html_url: string
  submission_types: string[]
  has_submitted_submissions: boolean
  published: boolean
  assignment_group_id: number
  submission?: CanvasSubmission
  created_at: string
  updated_at: string
}

export interface CanvasSubmission {
  id: number
  assignment_id: number
  user_id: number
  grade: string | null
  score: number | null
  submitted_at: string | null
  workflow_state: string
  late: boolean
  missing: boolean
  attempt: number | null
  submission_type: string | null
}

export interface CanvasModule {
  id: number
  name: string
  position: number
  unlock_at: string | null
  require_sequential_progress: boolean
  items_count: number
  items_url: string
  state: string
  completed_at: string | null
  published: boolean
  items?: CanvasModuleItem[]
}

export interface CanvasModuleItem {
  id: number
  module_id: number
  position: number
  title: string
  indent: number
  type: string
  content_id: number | null
  html_url: string
  url: string | null
  external_url: string | null
  page_url: string | null
  completion_requirement?: {
    type: string
    completed: boolean
    min_score?: number
  }
  published: boolean
}

export interface CanvasPlannerItem {
  plannable_type: string
  plannable_id: number
  plannable_date: string
  plannable: {
    id: number
    title: string
    due_at?: string
    points_possible?: number
    course_id?: number
  }
  course_id: number | null
  html_url: string
  submissions:
    | false
    | {
        submitted: boolean
        excused: boolean
        graded: boolean
        late: boolean
        missing: boolean
        needs_grading: boolean
      }
  planner_override: {
    id: number
    marked_complete: boolean
    dismissed: boolean
  } | null
}

export interface CanvasCalendarEvent {
  id: number
  title: string
  description: string | null
  start_at: string | null
  end_at: string | null
  all_day: boolean
  all_day_date: string | null
  location_name: string | null
  workflow_state: string
  context_code: string
  assignment?: CanvasAssignment
  created_at: string
  updated_at: string
}

export interface CanvasAnnouncement {
  id: number
  title: string
  message: string
  posted_at: string
  context_code: string
  delayed_post_at: string | null
}

// --- API helpers ---

async function canvasFetch<T>(
  path: string,
  token: string,
  params?: Record<string, string | string[]>,
): Promise<T> {
  const url = new URL(`${CANVAS_BASE_URL}${path}`)
  if (params) {
    for (const [key, val] of Object.entries(params)) {
      if (Array.isArray(val)) {
        val.forEach((v) => url.searchParams.append(key, v))
      } else {
        url.searchParams.set(key, val)
      }
    }
  }

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Canvas API error (${res.status}): ${text}`)
  }

  return res.json()
}

// --- Endpoints ---

export function fetchCourses(token: string) {
  return canvasFetch<CanvasCourse[]>("/api/v1/courses", token, {
    per_page: "50",
    "include[]": ["term", "enrollments"],
  })
}

export function fetchAssignments(token: string, courseId: number) {
  return canvasFetch<CanvasAssignment[]>(
    `/api/v1/courses/${courseId}/assignments`,
    token,
    {
      per_page: "50",
      "include[]": ["submission"],
      order_by: "due_at",
    },
  )
}

export function fetchModules(token: string, courseId: number) {
  return canvasFetch<CanvasModule[]>(
    `/api/v1/courses/${courseId}/modules`,
    token,
    {
      per_page: "50",
      "include[]": ["items", "content_details"],
    },
  )
}

export function fetchPlannerItems(
  token: string,
  startDate?: string,
  endDate?: string,
) {
  const params: Record<string, string> = { per_page: "50" }
  if (startDate) params.start_date = startDate
  if (endDate) params.end_date = endDate
  return canvasFetch<CanvasPlannerItem[]>("/api/v1/planner/items", token, params)
}

export function fetchCalendarEvents(
  token: string,
  contextCodes: string[],
  startDate?: string,
  endDate?: string,
) {
  const params: Record<string, string | string[]> = {
    per_page: "50",
    type: "event",
    "context_codes[]": contextCodes,
  }
  if (startDate) params.start_date = startDate
  if (endDate) params.end_date = endDate
  return canvasFetch<CanvasCalendarEvent[]>(
    "/api/v1/calendar_events",
    token,
    params,
  )
}

export function fetchAnnouncements(
  token: string,
  contextCodes: string[],
  startDate?: string,
) {
  const params: Record<string, string | string[]> = {
    per_page: "50",
    "context_codes[]": contextCodes,
    active_only: "true",
  }
  if (startDate) params.start_date = startDate
  return canvasFetch<CanvasAnnouncement[]>(
    "/api/v1/announcements",
    token,
    params,
  )
}

export function fetchSubmissions(token: string, courseId: number) {
  return canvasFetch<CanvasSubmission[]>(
    `/api/v1/courses/${courseId}/students/submissions`,
    token,
    {
      per_page: "50",
      "student_ids[]": ["self"],
    },
  )
}
