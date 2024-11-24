import type { createLessonSchemaType } from '../zod/create_schema';
import { AttendanceProcessBuilder } from './attendanceProcess';
import { AttendanceProcessTable, insertAttendanceProcess } from '../db/schema/tables';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

export class LessonBuilder {
  id: string;
  subject_id: string;
  teacher_id: string;
  group_id: string
  attendance_process_id: string
  start_time: Date;
  end_time: Date;

  constructor(body: createLessonSchemaType & { uuid: string, attendance_process_id: string }) {
    this.id = body.uuid
    this.subject_id = body.subject_id;
    this.teacher_id = body.teacher_id;
    this.group_id = body.group_id;
    this.attendance_process_id = body.attendance_process_id
    this.start_time = new Date(body.start_time);
    this.end_time = new Date(body.end_time);
  }

  static async create(body: createLessonSchemaType, db: PostgresJsDatabase<Record<string, never>>): Promise<LessonBuilder> {
    const lessonId = crypto.randomUUID()
    const attendance_process = await AttendanceProcessBuilder.create({ lesson_id: lessonId }, db, body.group_id)
    const new_attendance = insertAttendanceProcess.parse(attendance_process)
    await db.insert(AttendanceProcessTable).values(new_attendance)

    const lesson = new LessonBuilder({ ...body, uuid: lessonId, attendance_process_id: attendance_process.id })
    return lesson
  }

  updateTimes(start_time: Date, end_time: Date): void {
    this.start_time = start_time;
    this.end_time = end_time;
  }

  toString(): string {
    return `Class ${this.id} | Subject: ${this.subject_id} | Teacher: ${this.teacher_id} | Start: ${this.start_time} | End: ${this.end_time}`;
  }
}

