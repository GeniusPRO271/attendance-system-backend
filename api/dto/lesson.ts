import type { AttendanceProcessDTO } from "./attendanceProcess";
import type { GroupDTO } from "./group";
import type { SubjectDTO } from "./subject";
import type { TeacherDetailDTO } from "./user";

export interface LessonDTO {
  teacher_id: string;
  attendance_process_id: string;
  subject_id: string;
  start_time: Date
  end_time: Date;
  id: string;
  updatedAt: Date | null
  createdAt: Date | null;
}
export interface LessonDetailDTO {
  id: string;
  teacher_id: string;
  attendance_process_id: string;
  attendance_process: AttendanceProcessDTO
  teacher: TeacherDetailDTO
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
