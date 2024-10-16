export interface GroupDTO {
  id: string
  groupName: string
  direction: string | null
  year: number
}

export interface DirectionDTO {
  id: string
  name: string
  code: string
  groups: GroupDTO[]
  faculty: string | null
}

export interface FacultyDTO {
  id: string
  name: string
  dean: string
  directions: {
    id: string
    name: string
    code: string
    faculty: string | null
  }[]
}

export interface LessonDetailDTO {
  id: string;
  teacher_id: string;
  subject: SubjectDTO;
  group: GroupDTO
  status: string
  start_time: Date;
  end_time: Date;
  updatedAt: Date | null;
  createdAt: Date | null;
}

export interface LessonDTOPagination {
  data: LessonDetailDTO[]
  rowCount: number
  offset: number
  limit: number
}

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

export interface LessonDTO {
  teacher_id: string;
  subject_id: string;
  start_time: Date
  end_time: Date;
  id: string;
  updatedAt: Date | null
  createdAt: Date | null;
}

export enum UserRole {
  Default = 'default',
  Admin = 'admin',
}
