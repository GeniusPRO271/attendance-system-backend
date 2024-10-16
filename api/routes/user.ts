import type { PostgresJsDatabase } from "drizzle-orm/postgres-js"
import { UserServiceClass, type UserService } from "../service"
import { Hono } from "hono"
import { zValidator } from "@hono/zod-validator"
import { createUserSchema } from "../zod/create_schema"
import { TeacherTable } from "../db/schema/tables"
import { UserBuilder } from "../builders"
import { validateUUID } from "../zod/select_schema"
import { updateStudentSchema, updateUserSchema } from "../zod/update_schema"
import { db } from "../db"

function startUserRoute(service: UserService, db: PostgresJsDatabase<Record<string, never>>) {

  const api = new Hono()

  // Create a new user
  api.post('/', zValidator("json", createUserSchema), async (c) => {
    const body = c.req.valid("json")

    const user = await UserBuilder.create(body, db)

    const userDetails = await service.getSpecificFromUUID(user.id)
    return c.json({
      "message": "new user added",
      "data": userDetails
    })
  })

  // Get all Users
  api.get('/', async (c) => {
    const users_data = await db.select().from(TeacherTable)
    return c.json({
      "message": "users requested",
      "data": users_data
    })
  })

  // Get a specific User
  api.get("/:uuid", zValidator("param", validateUUID), async (c) => {
    const userId = c.req.valid("param").uuid
    const user = await service.getSpecificFromUUID(userId)
    return c.json({
      message: "specific user data requested",
      data: user
    })
  })


  // Get a specific student
  api.get("/student/:uuid", zValidator("param", validateUUID), async (c) => {
    const studentId = c.req.valid("param").uuid
    const user = await service.getSpecificFromStudentUUID(studentId)
    return c.json({
      message: "specific user data requested",
      data: user
    })
  })

  // Get a specific teacher
  api.get("/teacher/:uuid", zValidator("param", validateUUID), async (c) => {
    const teacherId = c.req.valid("param").uuid
    const user = await service.getSpecificFromTeacherUUID(teacherId)
    return c.json({
      message: "specific user data requested",
      data: user
    })
  })

  // Delete a specific user
  api.delete("/:uuid", zValidator("param", validateUUID), async (c) => {
    const userId = c.req.valid("param").uuid
    const userDeleted = await service.deleteSpecificFromUUID(userId)
    return c.json({
      message: "Subject has been delete",
      data: userDeleted
    })
  })

  // Update an specific student
  api.put("/student/:uuid", zValidator("param", validateUUID), zValidator("json", updateStudentSchema), async (c) => {
    const studentId = c.req.valid("param").uuid
    const update = c.req.valid("json")
    const updatedUser = await service.updateSpecificStudentFromUUID(studentId, update)

    return c.json({
      message: "User has been updated",
      data: updatedUser
    })
  })

  // Update an specific user
  api.put("/:uuid", zValidator("param", validateUUID), zValidator("json", updateUserSchema), async (c) => {
    const userId = c.req.valid("param").uuid
    const update = c.req.valid("json")
    const updatedUser = await service.updateSpecificFromUUID(userId, update)

    return c.json({
      message: "User has been updated",
      data: updatedUser
    })
  })

  return api
}

const service = new UserServiceClass(db)
const UserRoute = startUserRoute(service, db)

export { UserRoute }
