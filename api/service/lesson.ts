import type { PostgresJsDatabase } from "drizzle-orm/postgres-js"
import { isNextWeek, isThisWeek, isToday } from "../utils"
import { AttendanceProcessTable, GroupTable, LessonTable, SubjectTable, TeacherTable, UserTable } from "../db/schema/tables"
import { and, count, eq, exists, gt, gte, lte, sql } from 'drizzle-orm';
import type { updateLessonSchemaType } from "../zod/update_schema";
import type { LessonDetailDTO, LessonDTO, LessonDTOPagination } from "../dto/lesson";
import type { lessonFilterSchemaType } from "../zod/select_schema";

export interface LessonService {
  getSpecificFromUUID(uuid: string): Promise<LessonDetailDTO>
  getFromTeacherUUID(uuid: string, limit: string, offset: string, from: Date): Promise<LessonDTOPagination>
  deleteSpecificFromUUID(uuid: string): Promise<LessonDetailDTO>
  updateSpecificFromUUID(uuid: string, values: updateLessonSchemaType): Promise<LessonDetailDTO>
  getNextLessonFromGroupUUID(uuid: string): Promise<LessonDetailDTO | null>
  getLessonsFromGroupUUID(uuid: string): Promise<LessonDetailDTO[]>
  getNextLessonFromTeacherID(teacherID: string): Promise<LessonDetailDTO | null>
  getAllFromQuery(filters: lessonFilterSchemaType): Promise<LessonDetailDTO[]>
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

  async getAllFromQuery(filters: lessonFilterSchemaType): Promise<LessonDetailDTO[]> {
    const conditions = []; // Array to hold filter conditions

    // Filter by lesson ID
    if (filters.id) {
      conditions.push(eq(LessonTable.id, filters.id));
    }

    // Filter by teacher ID
    if (filters.teacher_id) {
      conditions.push(eq(LessonTable.teacher_id, filters.teacher_id));
    }


    // Filter by subject ID
    if (filters.subject_id) {
      conditions.push(eq(LessonTable.subject_id, filters.subject_id));
    }

    // Filter by attendance process ID
    if (filters.attendance_process_id) {
      conditions.push(eq(LessonTable.attendance_process_id, filters.attendance_process_id));
    }

    // Filter by start time (assuming filters.start_time is in ISO format)
    if (filters.start_time) {
      const startDate = new Date(filters.start_time);
      if (!isNaN(startDate.getTime())) {
        conditions.push(gte(LessonTable.start_time, startDate));
      } else {
        throw new Error('Invalid start_time format');
      }
    }

    // Filter by end time (assuming filters.end_time is in ISO format)
    if (filters.end_time) {
      const endDate = new Date(filters.end_time);
      if (!isNaN(endDate.getTime())) {
        conditions.push(lte(LessonTable.end_time, endDate));
      } else {
        throw new Error('Invalid end_time format');
      }
    }

    // Construct the base query to select from the LessonTable
    const baseQuery = this.db.select().from(LessonTable);

    // Add conditions to the base query if any filters are provided
    let finalQuery;
    if (conditions.length > 0) {
      finalQuery = baseQuery.where(and(...conditions));
    } else {
      finalQuery = baseQuery;
    }

    // Execute the query to get the lesson data
    const lessonsData = await finalQuery;

    // Fetch the necessary related data (teacher, subject, group, attendance process)
    const lessonsWithDetails = await Promise.all(lessonsData.map(async (lesson) => {
      // Fetch teacher details
      const teacher = await this.db
        .select()
        .from(TeacherTable)
        .where(eq(TeacherTable.id, lesson.teacher_id))
        .limit(1)
        .then(rows => rows[0]);  // Use .limit(1) and then get the first row

      const user = await this.db
        .select()
        .from(UserTable)
        .where(eq(UserTable.teacher_id, teacher.id))
        .limit(1)
        .then(rows => rows[0]);  // Use .limit(1) and then get the first row
      //
      const subject = await this.db
        .select()
        .from(SubjectTable)
        .where(eq(SubjectTable.id, lesson.subject_id))
        .limit(1)
        .then(rows => rows[0]);  // Use .limit(1) and then get the first row

      // Fetch group details
      const group = await this.db
        .select()
        .from(GroupTable)
        .where(eq(GroupTable.id, lesson.group_id))
        .limit(1)
        .then(rows => rows[0]);  // Use .limit(1) and then get the first row

      // Fetch attendance process details
      const attendanceProcess = await this.db
        .select()
        .from(AttendanceProcessTable)
        .where(eq(AttendanceProcessTable.id, lesson.attendance_process_id))
        .limit(1)
        .then(rows => rows[0]);  // Use .limit(1) and then get the first row

      // Return the detailed lesson data
      return {
        id: lesson.id,
        teacher_id: lesson.teacher_id,
        subject_id: lesson.subject_id,
        group_id: lesson.group_id,
        attendance_process_id: lesson.attendance_process_id,
        attendance_process: attendanceProcess,
        teacher: {
          id: user.id,
          name: user.name,
          email: user.email,
          teacher_id: user.teacher_id,
        },
        subject: subject,
        group: group,
        start_time: lesson.start_time,
        end_time: lesson.end_time,
        status: "now",
        updatedAt: lesson.updatedAt,
        createdAt: lesson.createdAt,
      };
    }));

    // Return the lessons with detailed information as an array of LessonDetailDTO
    return lessonsWithDetails;
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


    console.log("uuid: ", uuid)
    console.log("stage 1 nextLesson: ", nextLesson)

    if (!nextLesson) {
      const nextLesson = await this.getNextLessonFromTeacherID(uuid)
      return nextLesson
    }

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

  async getNextLessonFromTeacherID(teacherID: string): Promise<LessonDetailDTO | null> {
    const nextLesson = await this.db.select()
      .from(LessonTable)
      .where(and(eq(LessonTable.teacher_id, teacherID), gt(LessonTable.start_time, new Date())))
      .orderBy(LessonTable.start_time)
      .limit(1)
      .then(res => res[0] ?? null);

    if (!nextLesson) return null;

    const lessonSubject = await this.db.select()
      .from(SubjectTable)
      .where(eq(SubjectTable.id, nextLesson.subject_id))
      .then(res => res[0]);

    const group = await this.db.select()
      .from(GroupTable)
      .where(eq(GroupTable.id, nextLesson.group_id))
      .then(res => res[0]);

    const teacher = await this.db.select()
      .from(UserTable)
      .where(eq(UserTable.teacher_id, nextLesson.teacher_id))
      .then(res => res[0]);

    const attendance_process = await this.db.select()
      .from(AttendanceProcessTable)
      .where(eq(AttendanceProcessTable.id, nextLesson.attendance_process_id))
      .then(res => res[0]);

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
}
