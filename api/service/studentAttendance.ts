import { eq } from 'drizzle-orm';
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js"
import { AttendanceStatus, type StudentAttendanceDTO } from "../dto/studentAttendance"
import type { updateStudentAttendanceType } from "../zod/update_schema"
import { StudentAttendanceTable, UserTable } from "../db/schema/tables"

export interface StudentAttendanceService {
  getSpecificFromUUID(uuid: string): Promise<StudentAttendanceDTO>
  getAllFromStudentUUID(uuid: string): Promise<StudentAttendanceDTO[]>
  getAllFromAttendanceProcessUUID(uuid: string): Promise<StudentAttendanceDTO[]>
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
        }
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

