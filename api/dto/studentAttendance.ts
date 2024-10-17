export enum AttendanceStatus {
  Present = "present",
  Absent = "absent",
  Late = "late"
}

export interface StudentAttendanceDTO {
  id: string,
  lesson_id: string,
  student_id: string,
  status: AttendanceStatus
}
