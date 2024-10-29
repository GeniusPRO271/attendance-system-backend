import type { GroupDTO } from "./group";
import type { LessonDTO } from "./lesson";
import type { UserDTO } from "./user";

export interface SubjectDetailsDTO {
  id: string;
  name: string;
  description: string;
  groups: GroupDTO[] | undefined;
  teachers: {
    id: string
    name: string
    email: string
    teacher_id: string | null;
  }[]
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
