import type { PostgresJsDatabase } from "drizzle-orm/postgres-js"
import { GroupTable, LessonTable, subjectsToGroupsTable, subjectsToTeacherTable, SubjectTable } from "../db/schema/tables"
import { and, eq, inArray } from 'drizzle-orm';
import type { updateSubjectSchemaType } from "../zod/update_schema";
import { isNextWeek, isThisWeek, isToday } from "../utils";
import type { SubjectDetailsDTO, SubjectDTO, SubjectQueryDTO } from "../dto/subject";

export interface SubjectService {
  getSpecificFromUUID(uuid: string): Promise<SubjectDetailsDTO>
  getAllFromGroupUUID(uuid: string): Promise<SubjectDTO[]>
  getAllFromQuery(teacher_id?: string, group_id?: string): Promise<SubjectQueryDTO>
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
  async getAllFromGroupUUID(uuid: string): Promise<SubjectDTO[]> {
    const subjectsIds = await this.db.select().from(subjectsToGroupsTable).where(eq(subjectsToGroupsTable.group_id, uuid))

    const subejctDetails: SubjectDTO[] = []

    for (let index = 0; index < subjectsIds.length; index++) {
      const selectSubject = await this.db.select().from(SubjectTable).where(eq(SubjectTable.id, subjectsIds[index].subject_id)).then(res => res[0])
      subejctDetails.push({ ...selectSubject })
    }

    return subejctDetails
  }

  async getAllFromQuery(teacher_id?: string, group_id?: string): Promise<SubjectQueryDTO> {
    const query = this.db
      .select({
        id: SubjectTable.id,
        name: SubjectTable.name,
        description: SubjectTable.description,
        updatedAt: SubjectTable.updatedAt,
        createdAt: SubjectTable.createdAt
      })
      .from(SubjectTable)
      .innerJoin(subjectsToTeacherTable, eq(subjectsToTeacherTable.subject_id, SubjectTable.id))
      .innerJoin(subjectsToGroupsTable, eq(subjectsToGroupsTable.subject_id, SubjectTable.id));

    const possibleFilters: { teacher_ids?: string[], group_ids?: string[] } = {};

    // Apply filters based on teacher_id and group_id
    if (teacher_id && group_id) {
      query.where(
        and(
          eq(subjectsToTeacherTable.teacher_id, teacher_id),
          eq(subjectsToGroupsTable.group_id, group_id)
        )
      );
      possibleFilters.teacher_ids = [teacher_id]
      possibleFilters.group_ids = [group_id]

    } else if (teacher_id) {
      query.where(eq(subjectsToTeacherTable.teacher_id, teacher_id));

      // Fetch possible group IDs for the given teacher ID
      const groupResults = await this.db
        .select({ group_id: subjectsToGroupsTable.group_id })
        .from(subjectsToGroupsTable)
        .innerJoin(subjectsToTeacherTable, eq(subjectsToGroupsTable.subject_id, subjectsToTeacherTable.subject_id))
        .where(eq(subjectsToTeacherTable.teacher_id, teacher_id));

      // Collect unique group IDs using Set
      possibleFilters.group_ids = Array.from(new Set(groupResults.map((result) => result.group_id)));
      possibleFilters.teacher_ids = [teacher_id]
    } else if (group_id) {
      query.where(eq(subjectsToGroupsTable.group_id, group_id));

      // Fetch possible teacher IDs for the given group ID
      const teacherResults = await this.db
        .select({ teacher_id: subjectsToTeacherTable.teacher_id })
        .from(subjectsToTeacherTable)
        .innerJoin(subjectsToGroupsTable, eq(subjectsToTeacherTable.subject_id, subjectsToGroupsTable.subject_id))
        .where(eq(subjectsToGroupsTable.group_id, group_id));

      // Collect unique teacher IDs using Set
      possibleFilters.teacher_ids = Array.from(new Set(teacherResults.map((result) => result.teacher_id)));
      possibleFilters.group_ids = [group_id]
    } else {
      // No teacher_id or group_id provided, fetch all possible filters

      // Fetch all possible teacher IDs
      const allTeacherResults = await this.db
        .select({ teacher_id: subjectsToTeacherTable.teacher_id })
        .from(subjectsToTeacherTable);

      possibleFilters.teacher_ids = Array.from(new Set(allTeacherResults.map((result) => result.teacher_id)));

      // Fetch all possible group IDs
      const allGroupResults = await this.db
        .select({ group_id: subjectsToGroupsTable.group_id })
        .from(subjectsToGroupsTable);

      possibleFilters.group_ids = Array.from(new Set(allGroupResults.map((result) => result.group_id)));
    }

    // Fetch the subjects from the query
    const subjects = await query;

    // Use a Set to ensure unique subjects by their ID
    const uniqueSubjects = Array.from(new Set(subjects.map((subject) => subject.id)))
      .map(id => subjects.find(subject => subject.id === id));

    return {
      subjects: uniqueSubjects, // return the filtered unique subjects
      possibleFilters
    };
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
