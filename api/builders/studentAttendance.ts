
import type { AttendanceStatus } from '../dto/studentAttendance';
import type { createStudentAttendanceType } from '../zod/create_schema';

export class StudentAttendanceBuilder {
  id: string
  student_id: string
  lesson_id: string
  status: AttendanceStatus

  constructor(body: createStudentAttendanceType) {
    this.id = crypto.randomUUID()
    this.student_id = body.student_id;
    this.lesson_id = body.lesson_id
    this.status = body.status
  }
}

