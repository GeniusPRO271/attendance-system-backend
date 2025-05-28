import { zValidator } from "@hono/zod-validator"
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js"
import { Hono } from "hono"
import { insertStudentAttendanceSchema, StudentAttendanceTable } from "../db/schema/tables"
import { StudentAttendanceBuilder } from "../builders/studentAttendance"
import { createStudentAttendanceSchema } from "../zod/create_schema"
import { validateAttendanceUUID, validateUUID } from "../zod/select_schema"
import { updateStudentAttendanceSchema } from "../zod/update_schema"
import { AttendanceProcessServiceClass, StudentAttendanceServiceClass, type AttendanceProcessService, type StudentAttendanceService } from "../service"
import { db } from "../db"
import { AttendanceStatus } from "../dto/studentAttendance"
import { z } from "zod"
import { roomManager } from "../.."


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


  api.get("/allowed/device/:uuid", zValidator("param", validateAttendanceUUID), async (c) => {
    const attendanceId = c.req.valid("param").attendance_process
    const devices = await service.getAllAllowedDevices(attendanceId)
    return c.json({
      message: "All devices allowed requested",
      data: devices
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
    const attendance_process_id = c.req.valid("param").uuid
    const update = c.req.valid("json")

    const updatedAttendance = await service.updateSpecificFromUUID(attendance_process_id, update)

    return c.json({
      message: "Lesson has been updated",
      data: updatedAttendance
    })
  })

  // New endpoint: Mark attendance as present
  api.put("/mark/:uuid", zValidator("param", validateUUID), zValidator("json", z.object({
    attendance_process_id: z.string().uuid(),
  })), async (c) => {
    const { attendance_process_id } = c.req.valid("json");
    const uuid = c.req.valid("param").uuid;

    console.log("recived: ", uuid, attendance_process_id)
    console.log("calling service")
    const studentAttendance = await service.getSpecificFromStudentUUID(uuid, attendance_process_id)
    console.log("response: ", studentAttendance)

    if (!studentAttendance) {
      console.log("Attendance record not found or not started")
      return c.json({ error: "Attendance record not found or not started" }, 404);
    }

    if (studentAttendance.status === AttendanceStatus.Present) {
      console.log("Attendance is already marked as present")
      return c.json({ error: "Attendance is already marked as present" }, 400);
    }


    const updatedAttendance = await service.markStudentAttendanceFromUUID(attendance_process_id, uuid, {
      status: AttendanceStatus.Present,
      lastUpdate: new Date()
    });

    const studentList = await service.getAllFromAttendanceProcessUUID(attendance_process_id)

    console.log("SENDING MESSAGE WEBSCOKET")
    roomManager.broadcastStudentListUpdate(attendance_process_id, studentList)
    return c.json({
      message: "Attendance marked as present",
      data: updatedAttendance,
    });
  });

  return api
}

const service = new StudentAttendanceServiceClass(db)
const serviceAttendanceProcess = new AttendanceProcessServiceClass(db)
const StudentAttendanceRoute = startStudentAttendanceRoute(service, db, serviceAttendanceProcess)

export { StudentAttendanceRoute }

