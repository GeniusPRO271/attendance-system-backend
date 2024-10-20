import { Hono } from "hono"
import { db } from "../db"
import { zValidator } from "@hono/zod-validator"
import { createGroupSchema } from "../zod/create_schema"
import { GroupBuilder } from "../builders"
import { GroupTable, insertGroupSchema, insertSubjectToGroupSchema, subjectsToGroupsTable } from "../db/schema/tables"
import { validateUUID } from "../zod/select_schema"
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js"
import { GroupServiceClass, type GroupService } from "../service"
import { updateGroup } from "../zod/update_schema"

function startGroupRoute(service: GroupService, db: PostgresJsDatabase<Record<string, never>>) {

  const api = new Hono()

  // Create a new group
  api.post('/', zValidator("json", createGroupSchema), async (c) => {
    const body = c.req.valid("json")

    const new_group = insertGroupSchema.parse(new GroupBuilder(body))

    if (body.subject_id) {
      const relationSubjectGroupBody = {
        subject_id: new_group.id,
        group_id: body.subject_id
      }

      const relationSubjectGroup = insertSubjectToGroupSchema.parse(relationSubjectGroupBody)
      await db.insert(subjectsToGroupsTable).values(relationSubjectGroup)
    }

    await db.insert(GroupTable).values(new_group)

    return c.json({
      "message": "new group added",
      "data": new_group
    })
  })

  // Get all groups 
  api.get('/', async (c) => {
    const groups = await db.select().from(GroupTable)
    return c.json({
      "message": "groups requested",
      "data": groups
    })
  })


  // Get a specific group 
  api.get("/:uuid", zValidator("param", validateUUID), async (c) => {
    const groupId = c.req.valid("param").uuid
    const group = await service.getSpecificFromUUID(groupId)

    if (!group) {
      return c.json({
        message: "Failed to get group due to invalid group number.",
        data: groupId
      }, { status: 400 });
    }

    return c.json({
      message: "specific group data requested",
      data: group
    })
  })

  // Delete an specific group 
  api.delete("/:uuid", zValidator("param", validateUUID), async (c) => {
    const groupId = c.req.valid("param").uuid
    const groupDeleted = await service.deleteSpecificFromUUID(groupId)

    return c.json({
      message: "Group has been delete",
      data: groupDeleted
    })
  })

  // Update an specific group 
  api.put("/:uuid", zValidator("param", validateUUID), zValidator("json", updateGroup), async (c) => {
    const groupId = c.req.valid("param").uuid
    const update = c.req.valid("json")
    const updatedGroup = await service.updateSpecificFromUUID(groupId, update)

    return c.json({
      message: "Group has been updated",
      data: updatedGroup
    })
  })

  return api
}

const service = new GroupServiceClass(db)
const GroupRoute = startGroupRoute(service, db)

export { GroupRoute }





