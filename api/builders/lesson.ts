import { v4 as uuidv4 } from 'uuid';
import type { createLessonSchemaType } from '../zod/create_schema';

export class LessonBuilder {
  id: string;
  subject_id: string;
  teacher_id: string;
  group_id: string
  start_time: Date;
  end_time: Date;

  constructor(body: createLessonSchemaType) {
    this.id = crypto.randomUUID()
    this.subject_id = body.subject_id;
    this.teacher_id = body.teacher_id;
    this.group_id = body.group_id;
    this.start_time = new Date(body.start_time);
    this.end_time = new Date(body.end_time);
  }

  // Method to update the class times
  updateTimes(start_time: Date, end_time: Date): void {
    this.start_time = start_time;
    this.end_time = end_time;
  }

  // Method to represent class information as a string
  toString(): string {
    return `Class ${this.id} | Subject: ${this.subject_id} | Teacher: ${this.teacher_id} | Start: ${this.start_time} | End: ${this.end_time}`;
  }
}

