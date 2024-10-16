import type { PostgresJsDatabase } from "drizzle-orm/postgres-js"
import { Hono } from "hono"
import { zValidator } from "@hono/zod-validator"
import { createDirectionSchema } from "../zod/create_schema"
import { DirectionTable, insertDirectionSchema } from "../db/schema/tables"
import { DirectionBuilder } from "../builders"
import { validateUUID } from "../zod/select_schema"
import { db } from "../db"
import { DirectionServiceClass, type DirectionService } from "../service"
import { updateDirection } from "../zod/update_schema"

function startDirectionRoute(service: DirectionService, db: PostgresJsDatabase<Record<string, never>>) {
  const api = new Hono()

  // Create a new direction 
  api.post('/', zValidator("json", createDirectionSchema), async (c) => {
    const body = c.req.valid("json")

    const new_direction = insertDirectionSchema.parse(new DirectionBuilder(body))

    await db.insert(DirectionTable).values(new_direction)

    return c.json({
      "message": "new classes added",
      "data": new_direction
    })
  })

  // Get all direction
  api.get('/', async (c) => {
    const directions = await db.select().from(DirectionTable)
    return c.json({
      "message": "directions requested",
      "data": directions
    })
  })

  // Get specific direction
  api.get("/:uuid", zValidator("param", validateUUID), async (c) => {
    const directionId = c.req.valid("param").uuid
    const direction = await service.getSpecificFromUUID(directionId)
    return c.json({
      message: "specific direction data requested",
      data: direction
    })
  })


  // Delete specific direction
  api.delete("/:uuid", zValidator("param", validateUUID), async (c) => {
    const directionId = c.req.valid("param").uuid
    const directionDeleted = await service.deleteSpecificFromUUID(directionId)
    return c.json({
      message: "Direction has been deleted",
      data: directionDeleted
    })
  })

  // Update specific direction
  api.put("/:uuid", zValidator("param", validateUUID), zValidator("json", updateDirection), async (c) => {
    const directionId = c.req.valid("param").uuid
    const update = c.req.valid("json")
    const updatedDirection = await service.updateSpecificFromUUID(directionId, update)

    return c.json({
      message: "Direction has been updated",
      data: updatedDirection
    })
  })

  return api
}

const service = new DirectionServiceClass(db)
const DirectionRoute = startDirectionRoute(service, db)

export { DirectionRoute }



