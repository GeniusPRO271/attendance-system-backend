import { zValidator } from "@hono/zod-validator"
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js"
import { Hono } from "hono"
import { insertStudentAttendanceSchema, StudentAttendanceTable } from "../db/schema/tables"
import { StudentAttendanceBuilder } from "../builders/studentAttendance"
import { createStudentAttendanceSchema } from "../zod/create_schema"
import { validateUUID } from "../zod/select_schema"
import { updateStudentAttendanceSchema } from "../zod/update_schema"
import { AttendanceProcessServiceClass, StudentAttendanceServiceClass, type AttendanceProcessService, type StudentAttendanceService } from "../service"
import { db } from "../db"
import { AttendanceStatus } from "../dto/studentAttendance"


function startStudentAttendanceRoute(service: StudentAttendanceService, db: PostgresJsDatabase<Record<string, never>>, serviceAttendanceProcess: AttendanceProcessService) {
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
  api.get("/attendance-process/:uuid", zValidator("param", validateUUID), async (c) => {
    const lessonId = c.req.valid("param").uuid
    const attendances = await service.getAllFromAttendanceProcessUUID(lessonId)
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

  // New endpoint: Mark attendance as present
  api.put("/mark/:uuid", zValidator("param", validateUUID), async (c) => {
    const attendanceId = c.req.valid("param").uuid;

    // Retrieve the student attendance record
    const attendance = await service.getSpecificFromUUID(attendanceId);
    if (!attendance) {
      return c.json({ error: "Attendance record not found" }, 404);
    }

    // Check if attendance is already marked as present
    if (attendance.status === AttendanceStatus.Present) {
      return c.json({ error: "Attendance is already marked as present" }, 400);
    }

    // Assuming that the attendance record has an attendanceProcessId field,
    // and the serviceAttendanceProcess can fetch the corresponding attendance process.
    const attendanceProcess = await serviceAttendanceProcess.getSpecificFromUUID(attendance.attendace_process_id);
    if (!attendanceProcess) {
      return c.json({ error: "Attendance process not found" }, 404);
    }

    // Check if the current time is before endTime and the process is started.
    const currentTime = new Date();
    const processEndTime = attendanceProcess.end_time!;
    if (currentTime > processEndTime || attendanceProcess.status !== "started") {
      return c.json({ error: "Attendance marking not allowed. Either the process has ended or is not active." }, 400);
    }

    // Update the student attendance status to "present"
    const updatedAttendance = await service.updateSpecificFromUUID(attendanceId, { status: AttendanceStatus.Present });

    return c.json({
      message: "Attendance marked as present",
      data: updatedAttendance
    });
  });

  return api
}

const service = new StudentAttendanceServiceClass(db)
const serviceAttendanceProcess = new AttendanceProcessServiceClass(db)
const StudentAttendanceRoute = startStudentAttendanceRoute(service, db, serviceAttendanceProcess)

export { StudentAttendanceRoute }

