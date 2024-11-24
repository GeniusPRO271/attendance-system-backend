
export enum AttendanceProcessStatus {
  InProcess = "IN_PROCESS",
  Completed = "COMPLETED",
  Pending = "PENDING",
  Canceled = "CANCELED",
  Closed = "CLOSED"
}

export interface AttendanceProcessDTO {
  id: string
  lesson_id: string
  status: string
  start_time: string | null
  end_time: string | null
}
