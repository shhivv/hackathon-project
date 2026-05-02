import type { WorkShift } from "./workSchedule"

export interface TimeAllocation {
  jobs: WorkShift[]
  recreationHoursPerWeek: number
  updatedAt: string
}
