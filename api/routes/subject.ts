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

  api.post('/', zValidator("json", createSubjectSchema), async (c) => {
    const body = c.req.valid("json");

    // Create the new subject using the body data
    const new_subject = new SubjectBuilder(body);
    const validated_subject = insertSubjectSchema.parse(new_subject);

    // Insert the new subject into the database
    await db.insert(SubjectTable).values(validated_subject);

    // If group_ids exist, insert the relations between subject and groups
    if (body.group_ids && body.group_ids.length > 0) {
      for (const groupId of body.group_ids) {
        const relationSubjectGroupBody = {
          subject_id: validated_subject.id,
          group_id: groupId
        };

        // Validate and insert the relation into the subjectsToGroupsTable
        const relationSubjectGroup = insertSubjectToGroupSchema.parse(relationSubjectGroupBody);
        await db.insert(subjectsToGroupsTable).values(relationSubjectGroup);
      }
    }

    return c.json({
      "message": "New subject added with associated groups",
      "data": validated_subject
    });
  });

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
