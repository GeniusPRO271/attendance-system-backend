import type { PostgresJsDatabase } from "drizzle-orm/postgres-js"
import { isNextWeek, isThisWeek, isToday } from "../utils"
import { AttendanceProcessTable, GroupTable, LessonTable, SubjectTable, UserTable } from "../db/schema/tables"
import { and, count, eq, gt } from 'drizzle-orm';
import type { updateLessonSchemaType } from "../zod/update_schema";
import type { LessonDetailDTO, LessonDTO, LessonDTOPagination } from "../dto/lesson";

export interface LessonService {
  getSpecificFromUUID(uuid: string): Promise<LessonDetailDTO>
  getFromTeacherUUID(uuid: string, limit: string, offset: string, from: Date): Promise<LessonDTOPagination>
  deleteSpecificFromUUID(uuid: string): Promise<LessonDetailDTO>
  updateSpecificFromUUID(uuid: string, values: updateLessonSchemaType): Promise<LessonDetailDTO>
  getNextLessonFromGroupUUID(uuid: string): Promise<LessonDetailDTO | null>
  getLessonsFromGroupUUID(uuid: string): Promise<LessonDetailDTO[]>
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
    const teacher = await this.db.select().from(UserTable).where(eq(UserTable.teacher_id, selectLesson.teacher_id)).then(res => res[0]);
    const attendance_process = await this.db.select().from(AttendanceProcessTable).where(eq(AttendanceProcessTable.id, selectLesson.attendance_process_id)).then(res => res[0]);

    let specificLesson: LessonDetailDTO = {
      ...selectLesson,
      status: this.getLessonStatus(selectLesson),
      subject: lessonSubject,
      attendance_process,
      teacher: {
        id: teacher.id,
        name: teacher.name,
        email: teacher.email,
        teacher_id: teacher.teacher_id
      },
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

  async getFromTeacherUUID(uuid: string, limit: string = "10", offset: string = "0", from: Date = new Date("2023-01-01")): Promise<LessonDTOPagination> {

    console.log("calling getFromTeacherUUID...")
    const selectLessons = await this.db.select()
      .from(LessonTable)
      .where(and(eq(LessonTable.teacher_id, uuid), gt(LessonTable.start_time, from)))
      .limit(Number(limit)).offset(Number(offset))
      .orderBy(LessonTable.start_time)


    let specificLessons: LessonDetailDTO[] = []
    for (let index = 0; index < selectLessons.length; index++) {

      console.log("selectLessons attendance_process_id: ", selectLessons[index].attendance_process_id)

      console.log("selectLessons start_time: ", selectLessons[index].start_time)
      console.log("entered loop")
      const lessonSubject = await this.db.select().from(SubjectTable).where(eq(SubjectTable.id, selectLessons[index].subject_id)).then(res => res[0])
      console.log("lessonSubject ")
      const group = await this.db.select().from(GroupTable).where(eq(GroupTable.id, selectLessons[index].group_id)).then(res => res[0]);
      console.log("group")
      const teacher = await this.db.select().from(UserTable).where(eq(UserTable.teacher_id, selectLessons[index].teacher_id)).then(res => res[0]);
      console.log("teacher")
      const attendance_process = await this.db.select().from(AttendanceProcessTable).where(eq(AttendanceProcessTable.lesson_id, selectLessons[index].id)).then(res => res[0]);
      console.log("attendance_process: ", attendance_process)

      console.log("selectLessons ", index, ':', selectLessons[index].id)
      let lesson: LessonDetailDTO = {
        ...selectLessons[index],
        status: this.getLessonStatus(selectLessons[index]),
        attendance_process,
        teacher: {
          id: teacher.id,
          name: teacher.name,
          email: teacher.email,
          teacher_id: teacher.teacher_id
        },
        subject: lessonSubject,
        group: group
      }

      console.log("lessons: ", lesson)
      specificLessons.push(lesson)
    }

    const rowCount = await this.db.select({ count: count() })
      .from(LessonTable)
      .where(and(eq(LessonTable.teacher_id, uuid), gt(LessonTable.start_time, from)))
      .then(res => res[0])

    return {
      data: specificLessons,
      offset: Number(offset),
      limit: Number(limit),
      rowCount: rowCount?.count ?? 0
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

  async getNextLessonFromGroupUUID(uuid: string): Promise<LessonDetailDTO | null> {
    const nextLesson = await this.db.select()
      .from(LessonTable)
      .where(and(eq(LessonTable.group_id, uuid), gt(LessonTable.start_time, new Date())))
      .orderBy(LessonTable.start_time)
      .limit(1)
      .then(res => res[0] ?? null);

    if (!nextLesson) return null;

    const lessonSubject = await this.db.select().from(SubjectTable).where(eq(SubjectTable.id, nextLesson.subject_id)).then(res => res[0]);
    const group = await this.db.select().from(GroupTable).where(eq(GroupTable.id, nextLesson.group_id)).then(res => res[0]);
    const teacher = await this.db.select().from(UserTable).where(eq(UserTable.teacher_id, nextLesson.teacher_id)).then(res => res[0]);
    const attendance_process = await this.db.select().from(AttendanceProcessTable).where(eq(AttendanceProcessTable.id, nextLesson.attendance_process_id)).then(res => res[0]);

    return {
      ...nextLesson,
      status: this.getLessonStatus(nextLesson),
      subject: lessonSubject,
      attendance_process,
      teacher: {
        id: teacher.id,
        name: teacher.name,
        email: teacher.email,
        teacher_id: teacher.teacher_id
      },
      group: group
    };
  }

  async getLessonsFromGroupUUID(uuid: string): Promise<LessonDetailDTO[]> {
    const lessons = await this.db.select()
      .from(LessonTable)
      .where(eq(LessonTable.group_id, uuid))
      .orderBy(LessonTable.start_time);

    let lessonDetails: LessonDetailDTO[] = [];
    for (const lesson of lessons) {
      const lessonSubject = await this.db.select().from(SubjectTable).where(eq(SubjectTable.id, lesson.subject_id)).then(res => res[0]);
      const group = await this.db.select().from(GroupTable).where(eq(GroupTable.id, lesson.group_id)).then(res => res[0]);
      const teacher = await this.db.select().from(UserTable).where(eq(UserTable.teacher_id, lesson.teacher_id)).then(res => res[0]);
      const attendance_process = await this.db.select().from(AttendanceProcessTable).where(eq(AttendanceProcessTable.id, lesson.attendance_process_id)).then(res => res[0]);

      lessonDetails.push({
        ...lesson,
        status: this.getLessonStatus(lesson),
        subject: lessonSubject,
        attendance_process,
        teacher: {
          id: teacher.id,
          name: teacher.name,
          email: teacher.email,
          teacher_id: teacher.teacher_id
        },
        group: group
      });
    }
    return lessonDetails;
  }

}
