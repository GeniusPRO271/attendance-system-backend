import { Hono } from "hono"
import { db } from "../db"
import { zValidator } from "@hono/zod-validator"
import { createGroupSchema } from "../zod/create_schema"
import { GroupBuilder } from "../builders"
import { DirectionTable, GroupTable, insertGroupSchema, insertSubjectToGroupSchema, subjectsToGroupsTable } from "../db/schema/tables"
import { validateUUID } from "../zod/select_schema"
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js"
import { GroupServiceClass, type GroupService } from "../service"
import { updateGroup } from "../zod/update_schema"
import { eq } from "drizzle-orm"
function startGroupRoute(service: GroupService, db: PostgresJsDatabase<Record<string, never>>) {

  const api = new Hono()

  // Create a new group
  api.post('/', zValidator("json", createGroupSchema), async (c) => {
    const body = c.req.valid("json")

    const new_group = insertGroupSchema.parse(new GroupBuilder(body));
    await db.insert(GroupTable).values(new_group);

    // Then create the relations for subjects_to_groups.
    if (body.subject_id.length > 0) {
      const relations = body.subject_id.map((subjectId) =>
        insertSubjectToGroupSchema.parse({
          group_id: new_group.id,  // Use the group id from the inserted group.
          subject_id: subjectId
        })
      );

      await db.insert(subjectsToGroupsTable).values(relations);
    }


    return c.json({
      "message": "new group added",
      "data": new_group
    })
  })

  // Get all groups 
  api.get('/all', async (c) => {
    const groups = await db.select({
      id: GroupTable.id,
      year: GroupTable.year,
      groupName: GroupTable.groupName,
      direction: {
        id: DirectionTable.id,
        name: DirectionTable.name,
      }
    })
      .from(GroupTable)
      .leftJoin(DirectionTable, eq(GroupTable.direction, DirectionTable.id))

    return c.json({
      message: "groups requested",
      data: groups
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





