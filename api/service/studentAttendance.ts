import { and, eq } from 'drizzle-orm';
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js"
import { type StudentAttendanceDTO } from "../dto/studentAttendance"
import type { updateStudentAttendanceType } from "../zod/update_schema"
import { AttendanceProcessTable, LessonTable, StudentAttendanceTable, UserTable } from "../db/schema/tables"

export interface StudentAttendanceService {
  getSpecificFromUUID(uuid: string): Promise<StudentAttendanceDTO>
  getAllFromStudentUUID(uuid: string): Promise<StudentAttendanceDTO[]>
  getAllFromAttendanceProcessUUID(uuid: string): Promise<StudentAttendanceDTO[]>
  deleteSpecificFromUUID(uuid: string): Promise<StudentAttendanceDTO>
  updateSpecificFromUUID(uuid: string, values: updateStudentAttendanceType): Promise<StudentAttendanceDTO>
  getAllAllowedDevices(attendanceProcessId: string): Promise<{ uuid: string }[]>
  getSpecificFromStudentUUID(uuid: string, attendanceProcessId: string): Promise<StudentAttendanceDTO>
  getSpecificFromAttendanceProcessUUID(uuid: string): Promise<StudentAttendanceDTO>
  markStudentAttendanceFromUUID(uuid: string, student_id: string, values: updateStudentAttendanceType): Promise<StudentAttendanceDTO | null>
}

export class StudentAttendanceServiceClass implements StudentAttendanceService {
  private db: PostgresJsDatabase<Record<string, never>>

  constructor(db: PostgresJsDatabase<Record<string, never>>) {
    this.db = db
  }

  async getSpecificFromStudentUUID(uuid: string, attendanceProcessId: string): Promise<StudentAttendanceDTO> {
    const attendance = await this.db.select().from(StudentAttendanceTable).where(and(eq(StudentAttendanceTable.student_id, uuid),
      eq(StudentAttendanceTable.attendace_process_id, attendanceProcessId),
    )).then(res => res[0])

    console.log("attendance process", attendance)
    const student = await this.db.select().from(UserTable).where(eq(UserTable.student_id, attendance.student_id)).then(res => res[0])


    return {
      ...attendance,
      student: {
        studentId: student.student_id ?? "",
        name: student.name,
        email: student.email,
      }
    }
  }
  async getSpecificFromAttendanceProcessUUID(uuid: string): Promise<StudentAttendanceDTO> {
    const attendance = await this.db.select().from(StudentAttendanceTable).where(eq(StudentAttendanceTable.attendace_process_id, uuid)).then(res => res[0])
    const student = await this.db.select().from(UserTable).where(eq(UserTable.student_id, attendance.student_id)).then(res => res[0])


    return {
      ...attendance,
      student: {
        studentId: student.student_id ?? "",
        name: student.name,
        email: student.email,
      }
    }
  }
  async getSpecificFromUUID(uuid: string): Promise<StudentAttendanceDTO> {
    const attendance = await this.db.select().from(StudentAttendanceTable).where(eq(StudentAttendanceTable.id, uuid)).then(res => res[0])
    const student = await this.db.select().from(UserTable).where(eq(UserTable.student_id, attendance.student_id)).then(res => res[0])


    return {
      ...attendance,
      student: {
        studentId: student.student_id ?? "",
        name: student.name,
        email: student.email,
      }
    }
  }

  async getAllFromAttendanceProcessUUID(uuid: string): Promise<StudentAttendanceDTO[]> {
    const attendances = await this.db.select().from(StudentAttendanceTable).where(eq(StudentAttendanceTable.attendace_process_id, uuid))
    let attendancesDetailed: StudentAttendanceDTO[] = []

    for (let index = 0; index < attendances.length; index++) {
      const student = await this.db.select().from(UserTable).where(eq(UserTable.student_id, attendances[index].student_id)).then(res => res[0])
      const values: StudentAttendanceDTO = {
        ...attendances[index],
        student: {
          studentId: student.student_id ?? "",
          name: student.name,
          email: student.email,
        },
      }
      attendancesDetailed.push(values)
    }

    return attendancesDetailed
  }

  async getAllFromStudentUUID(uuid: string): Promise<StudentAttendanceDTO[]> {
    const attendances = await this.db.select().from(StudentAttendanceTable).where(eq(StudentAttendanceTable.student_id, uuid))
    let attendancesDetailed: StudentAttendanceDTO[] = []

    for (let index = 0; index < attendances.length; index++) {
      const student = await this.db.select().from(UserTable).where(eq(UserTable.student_id, attendances[index].student_id)).then(res => res[0])
      const values: StudentAttendanceDTO = {
        ...attendances[index],
        student: {
          studentId: student.student_id ?? "",
          name: student.name,
          email: student.email,
        }
      }
      attendancesDetailed.push(values)
    }

    return attendancesDetailed
  }


  async getAllAllowedDevices(attendanceProcessId: string): Promise<{ uuid: string }[]> {
    const apRows = await this.db
      .select({ lessonId: AttendanceProcessTable.lesson_id })
      .from(AttendanceProcessTable)
      .where(eq(AttendanceProcessTable.id, attendanceProcessId))
      .limit(1);
    const ap = apRows[0];
    if (!ap) return [];

    const lessonRows = await this.db
      .select({ teacherUuid: LessonTable.teacher_id })
      .from(LessonTable)
      .where(eq(LessonTable.id, ap.lessonId))
      .limit(1);
    const lesson = lessonRows[0];
    if (!lesson) return [];

    const userRows = await this.db
      .select({ deviceUUID: UserTable.device_uuid })
      .from(UserTable)
      .where(eq(UserTable.teacher_id, lesson.teacherUuid))
      .limit(1);
    const user = userRows[0];
    if (!user?.deviceUUID) return [];

    return [{ uuid: user.deviceUUID }];
  }


  async deleteSpecificFromUUID(uuid: string): Promise<StudentAttendanceDTO> {
    const specificAttendance = await this.getSpecificFromUUID(uuid)
    await this.db.delete(StudentAttendanceTable).where(eq(StudentAttendanceTable.id, uuid))
    return specificAttendance
  }

  async markStudentAttendanceFromUUID(uuid: string, student_id: string, values: updateStudentAttendanceType): Promise<StudentAttendanceDTO | null> {
    const atteanceProcess = await this.db
      .select()
      .from(AttendanceProcessTable)
      .where(eq(AttendanceProcessTable.id, uuid))
      .limit(1);


    console.log("marking for process: ", atteanceProcess)
    if (atteanceProcess[0].status != "IN_PROCESS") {
      return null
    }
    await this.db.update(StudentAttendanceTable).set(values).where(and(eq(StudentAttendanceTable.attendace_process_id, uuid), eq(StudentAttendanceTable.student_id, student_id)))
    const specificAttendance = await this.getSpecificFromAttendanceProcessUUID(uuid)
    return specificAttendance
  }

  async updateSpecificFromUUID(uuid: string, values: updateStudentAttendanceType): Promise<StudentAttendanceDTO> {
    const val = {
      status: values.status,
      lastUpdate: new Date()
    }
    await this.db.update(StudentAttendanceTable).set(val).where(and(eq(StudentAttendanceTable.attendace_process_id, uuid), eq(StudentAttendanceTable.student_id, values.student_id!)))
    const specificAttendance = await this.getSpecificFromAttendanceProcessUUID(uuid)
    return specificAttendance
  }
}

