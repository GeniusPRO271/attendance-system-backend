import type { PostgresJsDatabase } from "drizzle-orm/postgres-js"
import { AttendanceProcessStatus } from "../dto/attendanceProcess"
import type { createAttendanceProcessType } from "../zod/create_schema"
import { AttendanceProcessTable, insertAttendanceProcess, insertStudentAttendanceSchema, StudentAttendanceTable, studentRelatons } from "../db/schema/tables"
import { StudentAttendanceBuilder } from "./studentAttendance"
import { GroupServiceClass } from "../service"


export class AttendanceProcessBuilder {
  id: string
  lesson_id: string
  status: AttendanceProcessStatus

  constructor(body: createAttendanceProcessType) {
    this.id = crypto.randomUUID()
    this.lesson_id = body.lesson_id
    this.status = AttendanceProcessStatus.Pending
  }

  static async create(body: createAttendanceProcessType, db: PostgresJsDatabase<Record<string, never>>, groupID: string): Promise<AttendanceProcessBuilder> {
    const attendance_process = new AttendanceProcessBuilder({ lesson_id: body.lesson_id })
    const groupService = new GroupServiceClass(db)
    const group = await groupService.getSpecificFromUUID(groupID)
    const studentList = group.students

    console.log("studentList: ", studentList)
    for (let index = 0; index < studentList.length; index++) {
      const studentAttendance = new StudentAttendanceBuilder({ student_id: studentList[index].studentId, attendace_process_id: attendance_process.id })
      const new_StudentAttendance = insertStudentAttendanceSchema.parse(studentAttendance)
      console.log("creating studentAttendance...")
      await db.insert(StudentAttendanceTable).values(new_StudentAttendance)
      console.log("done creating studentAttendance")
    }

    return attendance_process
  }

}

