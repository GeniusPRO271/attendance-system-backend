import type { PostgresJsDatabase } from "drizzle-orm/postgres-js"
import { GroupTable, LessonTable, subjectsToGroupsTable, SubjectTable } from "../db/schema/tables"
import { eq, inArray } from 'drizzle-orm';
import type { SubjectDetailsDTO } from "./dto";
import type { updateSubjectSchemaType } from "../zod/update_schema";
import { isNextWeek, isThisWeek, isToday } from "../utils";

export interface SubjectService {
  getSpecificFromUUID(uuid: string): Promise<SubjectDetailsDTO>
  deleteSpecificFromUUID(uuid: string): Promise<SubjectDetailsDTO>
  updateSpecificFromUUID(uuid: string, values: updateSubjectSchemaType): Promise<SubjectDetailsDTO>
}

export class SubjectServiceClass implements SubjectService {
  private db: PostgresJsDatabase<Record<string, never>>

  constructor(db: PostgresJsDatabase<Record<string, never>>) {
    this.db = db
  }

  async getSpecificFromUUID(uuid: string): Promise<SubjectDetailsDTO> {
    const selectSubject = await this.db.select().from(SubjectTable).where(eq(SubjectTable.id, uuid)).then(res => res[0])
    const subjectLessons = await this.db.select().from(LessonTable).where(eq(LessonTable.subject_id, uuid))
    const groupIds = await this.db.select().from(subjectsToGroupsTable).where(eq(subjectsToGroupsTable.subject_id, selectSubject.id)).then(res => res.map(row => row.group_id)); // Get group IDs from the many-to-many table
    const groups = await this.db.select().from(GroupTable).where(inArray(GroupTable.id, groupIds));

    const lessonsWithStatus = subjectLessons.map(lesson => ({
      ...lesson,
      status: this.getLessonStatus(lesson.start_time.toString(), lesson.end_time.toString())
    }));

    let specificSubject: SubjectDetailsDTO = {
      ...selectSubject,
      lessons: lessonsWithStatus,
      groups: groups
    };

    return specificSubject
  }

  async deleteSpecificFromUUID(uuid: string): Promise<SubjectDetailsDTO> {
    const specificSubject = this.getSpecificFromUUID(uuid)
    await this.db.delete(SubjectTable).where(eq(SubjectTable.id, uuid))
    return specificSubject
  }

  async updateSpecificFromUUID(uuid: string, values: updateSubjectSchemaType): Promise<SubjectDetailsDTO> {
    await this.db.update(SubjectTable).set(values).where(eq(SubjectTable.id, uuid))
    const specificSubject = await this.getSpecificFromUUID(uuid)
    return specificSubject
  }

  private getLessonStatus(start_time: string, end_time: string): string {
    const currentDate = new Date(); // Get the current date
    let status = ""; // Initialize status

    // Create Date objects for start_time and end_time
    const startTime = new Date(start_time);
    const endTime = new Date(end_time);

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
