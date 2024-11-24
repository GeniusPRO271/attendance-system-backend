import type { StudentDetailDTO } from "./user";

export enum AttendanceStatus {
  Present = "present",
  Absent = "absent",
  Late = "late",
  Pending = "pending"
}

export interface StudentAttendanceDTO {
  id: string,
  student: StudentDetailDTO,
  status: string
}
