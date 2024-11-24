import type { GroupDTO } from "./group";
import type { LessonDTO } from "./lesson";
import type { TeacherDetailDTO } from "./user";

export interface SubjectDetailsDTO {
  id: string;
  name: string;
  description: string;
  groups: GroupDTO[] | undefined;
  teachers: TeacherDetailDTO[]
  lessons: LessonDTO[],
  updatedAt: Date | null;
  createdAt: Date | null;
}

export interface SubjectDTO {
  id: string;
  name: string;
  description: string;
  updatedAt: Date | null;
  createdAt: Date | null;
}

export interface SubjectQueryDTO {
  subjects: (SubjectDTO | undefined)[],
  possibleFilters: {
    teacher_ids?: string[],
    group_ids?: string[]
  }
}
