import { zValidator } from "@hono/zod-validator"
import { Hono } from "hono"
import { validateUUID, validDate } from "../zod/select_schema"
import { AttendanceProcessServiceClass, type AttendanceProcessService } from "../service/attendanceProcess"
import { db } from "../db"
import { updateAttendanceProcessSchema } from "../zod/update_schema"


function startAttendanceProcessRoute(service: AttendanceProcessService) {
  const api = new Hono()

  // Get specific attendance process
  api.get("/:uuid", zValidator("param", validateUUID), async (c) => {
    const attendanceProcessId = c.req.valid("param").uuid
    const attendanceProcess = await service.getSpecificFromUUID(attendanceProcessId)
    return c.json({
      message: "attendance process data requested",
      data: attendanceProcess
    })
  })

  // Start specific attendance process 
  api.get("/:uuid/start", zValidator("param", validateUUID), zValidator("query", validDate), async (c) => {
    const attendanceProcessId = c.req.valid("param").uuid
    const attendanceTimeValues = c.req.valid("query").date
    const attendanceProcess = await service.startSpecificFromUUID(attendanceProcessId, attendanceTimeValues)
    return c.json({
      message: "attendance process start",
      data: attendanceProcess
    })
  })


  // End specific attendance process 
  api.get("/:uuid/end", zValidator("param", validateUUID), async (c) => {
    const attendanceProcessId = c.req.valid("param").uuid
    const attendanceProcess = await service.endSpecificFromUUID(attendanceProcessId)
    return c.json({
      message: "attendance process end",
      data: attendanceProcess
    })
  })

  // Update specific attendance process
  api.put("/:uuid", zValidator("param", validateUUID), zValidator("json", updateAttendanceProcessSchema), async (c) => {
    const attendanceProcessId = c.req.valid("param").uuid
    const update = c.req.valid("json")
    const attendanceProcess = await service.updateSpecificFromUUID(attendanceProcessId, update)

    return c.json({
      message: "Attendance Process has been updated",
      data: attendanceProcess
    })
  })

  return api
}

const service = new AttendanceProcessServiceClass(db)
const AttendanceProcessRoute = startAttendanceProcessRoute(service)

export { AttendanceProcessRoute }



