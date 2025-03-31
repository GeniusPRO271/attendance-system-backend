import { zValidator } from "@hono/zod-validator"
import { Hono } from "hono"
import { validateUUID, validDate } from "../zod/select_schema"
import { AttendanceProcessServiceClass, type AttendanceProcessService } from "../service/attendanceProcess"
import { db } from "../db"
import { updateAttendanceProcessSchema } from "../zod/update_schema"
import CachedQRCodeGenerator from "../builders/qrCodeCache"


function startAttendanceProcessRoute(service: AttendanceProcessService, qrCodeGenerator: CachedQRCodeGenerator) {
  const api = new Hono()

  // Get specific attendance process
  api.get("/:uuid", zValidator("param", validateUUID), async (c) => {
    const attendanceProcessId = c.req.valid("param").uuid
    const attendanceProcess = await service.getSpecificFromUUID(attendanceProcessId)

    if (attendanceProcess.status === "PENDING") {
      return c.json(
        {
          message: "The attendance process needs to be started first.",
        },
        400 // HTTP status code for a bad request
      );
    }

    const locations = {
      MAIN_ENTRANCE: "main-entrance",
      SIDE_ENTRANCE: "side-entrance",
      BACK_ENTRANCE: "back-entrance",
      LOBBY: "lobby",
      CAFETERIA: "cafeteria"
    };

    const location = locations.MAIN_ENTRANCE;
    const qrCode = await qrCodeGenerator.getQRCode(attendanceProcessId, location);
    return c.json({
      message: "attendance process data requested",
      data: {
        id: attendanceProcessId,
        attendanceProcess,
        qrCode: qrCode,
        location: location,
        validUntil: attendanceProcess.end_time
      }
    })
  })

  // Start specific attendance process 
  api.post("/:uuid/start", zValidator("param", validateUUID), zValidator("query", validDate), async (c) => {
    const attendanceProcessId = c.req.valid("param").uuid
    const attendanceEndTime = c.req.valid("query").date

    const attendanceProcess = await service.startSpecificFromUUID(attendanceProcessId, attendanceEndTime)

    const locations = {
      MAIN_ENTRANCE: "main-entrance",
      SIDE_ENTRANCE: "side-entrance",
      BACK_ENTRANCE: "back-entrance",
      LOBBY: "lobby",
      CAFETERIA: "cafeteria"
    };

    const location = locations.MAIN_ENTRANCE;
    const qrCode = await qrCodeGenerator.getQRCode(attendanceProcessId, location);

    return c.json({
      message: "attendance process start",
      data: {
        id: attendanceProcessId,
        attendanceProcess,
        qrCode: qrCode,
        location: location,
        validUntil: attendanceEndTime
      }
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

const qrCodeGenerator = new CachedQRCodeGenerator(
  process.env.QR_SECRET_KEY || 'your-secret-key',
  process.env.QR_SALT || 'your-salt',
  600000,
  60000
);

const service = new AttendanceProcessServiceClass(db)
const AttendanceProcessRoute = startAttendanceProcessRoute(service, qrCodeGenerator)

export { AttendanceProcessRoute }



