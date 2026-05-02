import type { TimetableEntry } from "@/types/timetable"

export function parseTimetable(raw: string): TimetableEntry[] {
  const lines = raw
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)

  if (lines.length < 2) return []

  const header = lines[0].toLowerCase()
  const isHeaderRow =
    header.includes("subject code") || header.includes("description")

  const dataLines = isHeaderRow ? lines.slice(1) : lines
  const entries: TimetableEntry[] = []

  for (const line of dataLines) {
    const cols = line.split("\t")
    if (cols.length < 11) continue

    entries.push({
      subjectCode: cols[0].trim(),
      description: cols[1].trim(),
      group: cols[2].trim(),
      activity: cols[3].trim(),
      day: cols[4].trim(),
      time: cols[5].trim(),
      campus: cols[6].trim(),
      location: cols[7].trim(),
      staff: cols[8].trim(),
      duration: cols[9].trim(),
      dates: cols[10].trim(),
    })
  }

  return entries
}

const DAY_MAP: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
}

export function getEntriesForDay(
  entries: TimetableEntry[],
  dayName: string,
): TimetableEntry[] {
  return entries
    .filter((e) => e.day === dayName)
    .sort((a, b) => {
      const [ah, am] = a.time.split(":").map(Number)
      const [bh, bm] = b.time.split(":").map(Number)
      return ah * 60 + am - (bh * 60 + bm)
    })
}

export function getDayName(date: Date): string {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
  return days[date.getDay()]
}

export function getSubjectShortName(description: string): string {
  const match = description.match(/^(.+?)(?:\s*\(Class:.*\))?$/)
  return match ? match[1].trim() : description
}

export function isWorkshopOrTutorial(entry: TimetableEntry): boolean {
  const g = entry.group.toLowerCase()
  return g.startsWith("wor") || g.startsWith("tut")
}

export function getActivityLabel(group: string): string {
  const g = group.toLowerCase()
  if (g.startsWith("lec")) return "Lecture"
  if (g.startsWith("tut")) return "Tutorial"
  if (g.startsWith("wor")) return "Workshop"
  if (g.startsWith("com")) return "Computer Lab"
  if (g.startsWith("con")) return "Consultation"
  if (g.startsWith("prelec")) return "Pre-lecture"
  return group
}

export function parseDuration(duration: string): number {
  const match = duration.match(/([\d.]+)\s*hr/)
  return match ? parseFloat(match[1]) : 1
}
