import { zValidator } from "@hono/zod-validator"
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js"
import { Hono } from "hono"
import { insertStudentAttendanceSchema, StudentAttendanceTable } from "../db/schema/tables"
import { StudentAttendanceBuilder } from "../builders/studentAttendance"
import { createStudentAttendanceSchema } from "../zod/create_schema"
import { validateUUID } from "../zod/select_schema"
import { updateStudentAttendanceSchema } from "../zod/update_schema"
import { StudentAttendanceServiceClass, type StudentAttendanceService } from "../service"
import { db } from "../db"


function startStudentAttendanceRoute(service: StudentAttendanceService, db: PostgresJsDatabase<Record<string, never>>) {
  const api = new Hono()

  // Create a new attendance record
  api.post('/', zValidator("json", createStudentAttendanceSchema), async (c) => {
    const body = c.req.valid("json")

    const new_attendance = insertStudentAttendanceSchema.parse(new StudentAttendanceBuilder(body))

    await db.insert(StudentAttendanceTable).values(new_attendance)

    return c.json({
      "message": "New attendance added",
      "data": new_attendance
    })
  })

  // Get all student attendances
  api.get("/:uuid", zValidator("param", validateUUID), async (c) => {
    const studentId = c.req.valid("param").uuid
    const attendances = await service.getAllFromStudentUUID(studentId)
    return c.json({
      message: "All student attendances requested",
      data: attendances
    })
  })

  // Get all lesson attendances
  api.get("/lesson/:uuid", zValidator("param", validateUUID), async (c) => {
    const lessonId = c.req.valid("param").uuid
    const attendances = await service.getAllFromLessonUUID(lessonId)
    return c.json({
      message: "All lesson attendances requested",
      data: attendances
    })
  })


  // Delete a specific student attendance
  api.delete("/:uuid", zValidator("param", validateUUID), async (c) => {
    const attendanceId = c.req.valid("param").uuid
    const attendanceDeleted = await service.deleteSpecificFromUUID(attendanceId)
    return c.json({
      message: "Attendance has been delete",
      data: attendanceDeleted
    })
  })

  // Update an specific lesson
  api.put("/:uuid", zValidator("param", validateUUID), zValidator("json", updateStudentAttendanceSchema), async (c) => {
    const attendanceId = c.req.valid("param").uuid
    const update = c.req.valid("json")
    const updatedAttendance = await service.updateSpecificFromUUID(attendanceId, update)

    return c.json({
      message: "Lesson has been updated",
      data: updatedAttendance
    })
  })

  return api
}

const service = new StudentAttendanceServiceClass(db)
const StudentAttendanceRoute = startStudentAttendanceRoute(service, db)

export { StudentAttendanceRoute }

