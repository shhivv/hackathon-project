export interface TimeAllocation {
  job: { title: string; hoursPerWeek: number } | null
  recreationHoursPerWeek: number
  updatedAt: string // ISO
}
