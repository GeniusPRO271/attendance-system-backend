import type { GroupDTO } from "./group";
import type { LessonDTO } from "./lesson";

export interface SubjectDetailsDTO {
  id: string;
  name: string;
  description: string;
  groups: GroupDTO[] | undefined;
  lessons: LessonDTO[],
  updatedAt: Date | null;
  createdAt: Date | null;
}

export interface SubjectDTO {
  id: string;
  name: string;
  updatedAt: Date | null;
  createdAt: Date | null;
  description: string;
}
