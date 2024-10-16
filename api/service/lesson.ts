import type { PostgresJsDatabase } from "drizzle-orm/postgres-js"
import { isNextWeek, isThisWeek, isToday } from "../utils"
import { GroupTable, LessonTable, SubjectTable } from "../db/schema/tables"
import { eq } from 'drizzle-orm';
import type { updateLessonSchemaType } from "../zod/update_schema";
import type { LessonDetailDTO, LessonDTO, LessonDTOPagination } from "../dto/lesson";

export interface LessonService {
  getSpecificFromUUID(uuid: string): Promise<LessonDetailDTO>
  getFromTeacherUUID(uuid: string, limit: string, offset: string): Promise<LessonDTOPagination>
  deleteSpecificFromUUID(uuid: string): Promise<LessonDetailDTO>
  updateSpecificFromUUID(uuid: string, values: updateLessonSchemaType): Promise<LessonDetailDTO>
}

export class LessonServiceClass implements LessonService {
  private db: PostgresJsDatabase<Record<string, never>>

  constructor(db: PostgresJsDatabase<Record<string, never>>) {
    this.db = db
  }

  async getSpecificFromUUID(uuid: string): Promise<LessonDetailDTO> {
    const selectLesson = await this.db.select().from(LessonTable).where(eq(LessonTable.id, uuid)).then(res => res[0])
    const lessonSubject = await this.db.select().from(SubjectTable).where(eq(SubjectTable.id, selectLesson.subject_id)).then(res => res[0])
    const group = await this.db.select().from(GroupTable).where(eq(GroupTable.id, selectLesson.group_id)).then(res => res[0]);

    let specificLesson: LessonDetailDTO = {
      ...selectLesson,
      status: this.getLessonStatus(selectLesson),
      subject: lessonSubject,
      group: group

    }
    return specificLesson
  }

  async deleteSpecificFromUUID(uuid: string): Promise<LessonDetailDTO> {
    const specificLesson = this.getSpecificFromUUID(uuid)
    await this.db.delete(LessonTable).where(eq(LessonTable.id, uuid))
    return specificLesson
  }

  async updateSpecificFromUUID(uuid: string, values: updateLessonSchemaType): Promise<LessonDetailDTO> {

    let parsedValues = {
      ...values,
      start_time: values.start_time ? new Date(values.start_time) : undefined,
      end_time: values.end_time ? new Date(values.end_time) : undefined
    };

    await this.db.update(LessonTable).set(parsedValues).where(eq(LessonTable.id, uuid))
    const specificLesson = await this.getSpecificFromUUID(uuid)
    return specificLesson
  }

  async getFromTeacherUUID(uuid: string, limit: string = "10", offset: string = "0"): Promise<LessonDTOPagination> {

    const selectLessons = await this.db.select()
      .from(LessonTable).where(eq(LessonTable.teacher_id, uuid))
      .limit(Number(limit)).offset(Number(offset))
      .orderBy(LessonTable.start_time)


    let specificLessons: LessonDetailDTO[] = []

    for (let index = 0; index < selectLessons.length; index++) {

      const lessonSubject = await this.db.select().from(SubjectTable).where(eq(SubjectTable.id, selectLessons[index].subject_id)).then(res => res[0])
      const group = await this.db.select().from(GroupTable).where(eq(GroupTable.id, selectLessons[index].group_id)).then(res => res[0]);
      let lesson: LessonDetailDTO = {
        ...selectLessons[index],
        status: this.getLessonStatus(selectLessons[index]),
        subject: lessonSubject,
        group: group
      }

      specificLessons.push(lesson)
    }

    return {
      data: specificLessons,
      offset: Number(offset),
      limit: Number(limit),
      rowCount: specificLessons.length
    }
  }

  private getLessonStatus(lesson: LessonDTO): string {
    const currentDate = new Date(); // Get the current date
    let status = ""; // Initialize status

    // Create Date objects for start_time and end_time
    const startTime = new Date(lesson.start_time);
    const endTime = new Date(lesson.end_time);

    // Determine the status of the class
    if (currentDate >= startTime && currentDate <= endTime) {
      status = "Now";
    } else if (currentDate > endTime) {
      status = "Expired";
    } else if (isToday(startTime)) {
      status = "Today";
    } else if (isThisWeek(startTime)) {
      status = "This Week";
    } else if (isNextWeek(startTime)) {
      status = "Next Week";
    } else {
      status = "Upcoming";
    }

    return status
  }
}
