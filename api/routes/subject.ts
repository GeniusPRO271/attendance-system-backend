import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { SubjectServiceClass, type SubjectService } from "../service/subject";
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { createSubjectSchema } from "../zod/create_schema";
import { insertSubjectSchema, insertSubjectToGroupSchema, subjectsToGroupsTable, SubjectTable } from "../db/schema/tables";
import { SubjectBuilder } from "../builders";
import { validateUUID } from "../zod/select_schema";
import { updateSubjectSchema } from "../zod/update_schema";
import { db } from "../db";

function startSubjectRoute(service: SubjectService, db: PostgresJsDatabase<Record<string, never>>) {

  const api = new Hono()

  // Create a new subject 
  api.post('/', zValidator("json", createSubjectSchema), async (c) => {
    const body = c.req.valid("json")

    const new_subject = insertSubjectSchema.parse(new SubjectBuilder(body))

    if (body.group_Id) {
      const relationSubjectGroupBody = {
        subject_id: new_subject.id,
        group_id: body.group_Id
      }

      const relationSubjectGroup = insertSubjectToGroupSchema.parse(relationSubjectGroupBody)
      await db.insert(subjectsToGroupsTable).values(relationSubjectGroup)

    }

    await db.insert(SubjectTable).values(new_subject)

    return c.json({
      "message": "new classes added",
      "data": new_subject
    })
  })

  // Get all subjects
  api.get('/', async (c) => {
    const subjects_data = await db.select().from(SubjectTable)
    return c.json({
      "message": "subjects requested",
      "data": subjects_data
    })
  })

  // Get a specific subject
  api.get("/:uuid", zValidator("param", validateUUID), async (c) => {
    const subjectId = c.req.valid("param").uuid
    const subject = await service.getSpecificFromUUID(subjectId)
    return c.json({
      message: "specific subject data requested",
      data: subject
    })
  })

  // Delete a specific subject
  api.delete("/:uuid", zValidator("param", validateUUID), async (c) => {
    const subjectId = c.req.valid("param").uuid
    const subjectDeleted = await service.deleteSpecificFromUUID(subjectId)
    return c.json({
      message: "Subject has been delete",
      data: subjectDeleted
    })
  })

  // Update an specific subject
  api.put("/:uuid", zValidator("param", validateUUID), zValidator("json", updateSubjectSchema), async (c) => {
    const subjectId = c.req.valid("param").uuid
    const update = c.req.valid("json")
    const updatedSubject = await service.updateSpecificFromUUID(subjectId, update)

    return c.json({
      message: "Subject has been updated",
      data: updatedSubject
    })
  })

  return api
}

const service = new SubjectServiceClass(db)
const SubjectRoute = startSubjectRoute(service, db)

export { SubjectRoute }
