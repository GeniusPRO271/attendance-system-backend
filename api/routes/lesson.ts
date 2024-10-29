import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { LessonServiceClass, type LessonService } from "../service/lesson";
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { createLessonSchema } from "../zod/create_schema";
import { insertLessonSchema, LessonTable } from "../db/schema/tables";
import { LessonBuilder } from "../builders";
import { validateUUID, validPagination } from "../zod/select_schema";
import { updateLessonSchema } from "../zod/update_schema";
import { db } from "../db";

function startLessonRoute(service: LessonService, db: PostgresJsDatabase<Record<string, never>>) {
  const api = new Hono()

  // Create a new lesson
  api.post('/', zValidator("json", createLessonSchema), async (c) => {
    const body = c.req.valid("json")

    const new_lesson = insertLessonSchema.parse(new LessonBuilder(body))

    await db.insert(LessonTable).values(new_lesson)

    return c.json({
      "message": "New lesson added",
      "data": new_lesson
    })
  })

  // Get all lesson
  api.get('/', async (c) => {
    const lessons = await db.select().from(LessonTable)
    return c.json({
      "message": "Lesson requested",
      "data": lessons
    })
  })

  // Get a specific lesson
  api.get("/:uuid", zValidator("param", validateUUID), async (c) => {
    const lessonId = c.req.valid("param").uuid
    const lesson = await service.getSpecificFromUUID(lessonId)
    return c.json({
      message: "Specific lesson data requested",
      data: lesson
    })
  })

  // Get a specific lesson
  api.get("/teacher/:uuid", zValidator("param", validateUUID), zValidator("query", validPagination), async (c) => {
    const teacherId = c.req.valid("param").uuid
    const pagination = c.req.valid("query")
    const teacherLessons = await service.getFromTeacherUUID(teacherId, pagination.limit, pagination.offset, new Date(pagination.from))
    return c.json({
      message: "Specific lesson data requested",
      data: teacherLessons
    })
  })

  // Delete a specific lesson
  api.delete("/:uuid", zValidator("param", validateUUID), async (c) => {
    const lessonId = c.req.valid("param").uuid
    const lessonDeleted = await service.deleteSpecificFromUUID(lessonId)
    return c.json({
      message: "Lesson has been delete",
      data: lessonDeleted
    })
  })

  // Update an specific lesson
  api.put("/:uuid", zValidator("param", validateUUID), zValidator("json", updateLessonSchema), async (c) => {
    const lessonId = c.req.valid("param").uuid
    const update = c.req.valid("json")
    const updatedLesson = await service.updateSpecificFromUUID(lessonId, update)

    return c.json({
      message: "Lesson has been updated",
      data: updatedLesson
    })
  })

  return api
}

const service = new LessonServiceClass(db)
const LessonRoute = startLessonRoute(service, db)

export { LessonRoute }

