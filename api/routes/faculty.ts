import type { PostgresJsDatabase } from "drizzle-orm/postgres-js"
import { Hono } from "hono"
import { zValidator } from "@hono/zod-validator"
import { createFacultySchema } from "../zod/create_schema"
import { FacultyBuilder } from "../builders"
import { FacultyTable, insertFacultySchema } from "../db/schema/tables"
import { validateUUID } from "../zod/select_schema"
import { db } from "../db"
import { FacultyServiceClass, type FacultyService } from "../service"
import { updateFaculty } from "../zod/update_schema"

function startFacultyRoute(service: FacultyService, db: PostgresJsDatabase<Record<string, never>>) {
  const api = new Hono()

  // Create a new faculty 
  api.post('/', zValidator("json", createFacultySchema), async (c) => {
    const body = c.req.valid("json")

    const new_faculty = insertFacultySchema.parse(new FacultyBuilder(body))

    await db.insert(FacultyTable).values(new_faculty)

    return c.json({
      "message": "new classes added",
      "data": new_faculty
    })
  })

  // Get all faculties
  api.get('/', async (c) => {
    const faculties = await db.select().from(FacultyTable)
    return c.json({
      "message": "faculties requested",
      "data": faculties
    })
  })

  // Get specific faculty
  api.get("/:uuid", zValidator("param", validateUUID), async (c) => {
    const facultyId = c.req.valid("param").uuid
    const faculty = await service.getSpecificFromUUID(facultyId)
    return c.json({
      message: "specific faculty data requested",
      data: faculty
    })
  })


  // Delete specific faculty
  api.delete("/:uuid", zValidator("param", validateUUID), async (c) => {
    const facultyId = c.req.valid("param").uuid
    const facultyDeleted = await service.deleteSpecificFromUUID(facultyId)
    return c.json({
      message: "Faculty has been deleted",
      data: facultyDeleted
    })
  })

  // Update specific faculty
  api.put("/:uuid", zValidator("param", validateUUID), zValidator("json", updateFaculty), async (c) => {
    const facultyId = c.req.valid("param").uuid
    const update = c.req.valid("json")
    const updatedFaculty = await service.updateSpecificFromUUID(facultyId, update)

    return c.json({
      message: "Faculty has been updated",
      data: updatedFaculty
    })
  })

  return api
}

const service = new FacultyServiceClass(db)
const FacultyRoute = startFacultyRoute(service, db)

export { FacultyRoute }



