import { eq } from 'drizzle-orm';
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js"
import { AttendanceStatus, type StudentAttendanceDTO } from "../dto/studentAttendance"
import type { updateStudentAttendanceType } from "../zod/update_schema"
import { StudentAttendanceTable } from "../db/schema/tables"

export interface StudentAttendanceService {
  getSpecificFromUUID(uuid: string): Promise<StudentAttendanceDTO>
  getAllFromStudentUUID(uuid: string): Promise<StudentAttendanceDTO[]>
  getAllFromLessonUUID(uuid: string): Promise<StudentAttendanceDTO[]>
  deleteSpecificFromUUID(uuid: string): Promise<StudentAttendanceDTO>
  updateSpecificFromUUID(uuid: string, values: updateStudentAttendanceType): Promise<StudentAttendanceDTO>
}

export class StudentAttendanceServiceClass implements StudentAttendanceService {
  private db: PostgresJsDatabase<Record<string, never>>

  constructor(db: PostgresJsDatabase<Record<string, never>>) {
    this.db = db
  }

  async getSpecificFromUUID(uuid: string): Promise<StudentAttendanceDTO> {
    const attendance = await this.db.select().from(StudentAttendanceTable).where(eq(StudentAttendanceTable.id, uuid)).then(res => res[0])

    return {
      ...attendance,
      status: AttendanceStatus[attendance.status as keyof typeof AttendanceStatus]
    }
  }

  async getAllFromStudentUUID(uuid: string): Promise<StudentAttendanceDTO[]> {
    const attendances = await this.db.select().from(StudentAttendanceTable).where(eq(StudentAttendanceTable.student_id, uuid))
    let attendancesDetailed: StudentAttendanceDTO[] = []

    for (let index = 0; index < attendances.length; index++) {
      const values: StudentAttendanceDTO = {
        ...attendances[index],
        status: AttendanceStatus[attendances[0].status as keyof typeof AttendanceStatus]
      }
      attendancesDetailed.push(values)
    }

    return attendancesDetailed
  }

  async getAllFromLessonUUID(uuid: string): Promise<StudentAttendanceDTO[]> {
    const attendances = await this.db.select().from(StudentAttendanceTable).where(eq(StudentAttendanceTable.lesson_id, uuid))
    let attendancesDetailed: StudentAttendanceDTO[] = []

    for (let index = 0; index < attendances.length; index++) {
      const values: StudentAttendanceDTO = {
        ...attendances[index],
        status: AttendanceStatus[attendances[0].status as keyof typeof AttendanceStatus]
      }
      attendancesDetailed.push(values)
    }

    return attendancesDetailed
  }

  async deleteSpecificFromUUID(uuid: string): Promise<StudentAttendanceDTO> {
    const specificAttendance = await this.getSpecificFromUUID(uuid)
    await this.db.delete(StudentAttendanceTable).where(eq(StudentAttendanceTable.id, uuid))
    return specificAttendance
  }

  async updateSpecificFromUUID(uuid: string, values: updateStudentAttendanceType): Promise<StudentAttendanceDTO> {
    await this.db.update(StudentAttendanceTable).set(values).where(eq(StudentAttendanceTable.id, uuid))
    const specificAttendance = await this.getSpecificFromUUID(uuid)
    return specificAttendance
  }
}

