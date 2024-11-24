
import { AttendanceStatus } from '../dto/studentAttendance';
import type { createStudentAttendanceType } from '../zod/create_schema';

export class StudentAttendanceBuilder {
  id: string
  student_id: string
  status: AttendanceStatus
  attendace_process_id: string

  constructor(body: createStudentAttendanceType) {
    this.id = crypto.randomUUID()
    this.student_id = body.student_id;
    this.status = AttendanceStatus.Pending
    this.attendace_process_id = body.attendace_process_id
  }
}

