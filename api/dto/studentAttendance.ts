import type { StudentDetailDTO } from "./user";

export enum AttendanceStatus {
  Present = "present",
  Absent = "absent",
  Late = "late",
}

export interface StudentAttendanceDTO {
  id: string,
  student: StudentDetailDTO,
  status: string
  attendace_process_id: string;
  lastUpdate: Date | null
}
