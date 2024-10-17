import { z } from "zod";
import { UserRole } from "../dto/user";
import { AttendanceStatus } from "../dto/studentAttendance";

export const createGroupSchema = z.object({
  group_name: z.string(),
  direction: z.string().uuid(),
  subject_id: z.string().uuid().optional(),
  year: z.number()
});

export type createGroupSchemaType = z.infer<typeof createGroupSchema>;

export const createDirectionSchema = z.object({
  name: z.string(),
  faculty: z.string().uuid(),
  code: z.string()
});

export type createDirectionSchemaType = z.infer<typeof createDirectionSchema>;

export const createFacultySchema = z.object({
  name: z.string(),
  dean: z.string(),
});

export type createFacultySchemaType = z.infer<typeof createFacultySchema>;



export const createLessonSchema = z.object({
  teacher_id: z.string().uuid(), // Teacher ID should be a valid UUID
  subject_id: z.string().uuid(), // Subject ID should also be a valid UUID
  group_id: z.string().uuid(),
  start_time: z.string().refine((dateStr) => !isNaN(Date.parse(dateStr)), {
    message: "Start time must be a valid date string", // Ensure start_time is a valid date string
  }),
  end_time: z.string().refine((dateStr) => {
    const endDate = new Date(dateStr);
    return !isNaN(endDate.getTime()) && endDate > new Date(); // Ensure end_time is in the future
  }, {
    message: "End time must be a valid date string and in the future", // Ensure end_time is valid and in the future
  }),
});

export type createLessonSchemaType = z.infer<typeof createLessonSchema>;


export const createSubjectSchema = z.object({
  name: z.string(),
  description: z.string(),
  group_ids: z.array(z.string().uuid()).optional()  // Changed this to allow an array of UUIDs
});

export type createSubjectSchemaType = z.infer<typeof createSubjectSchema>;

export const createUserSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  password: z.string(),
  role: z.nativeEnum(UserRole),
  group_id: z.string().uuid().optional(),
  isTeacher: z.boolean()
});

export type createUserSchemaType = z.infer<typeof createUserSchema>;


export const createTeacherSchema = z.object({
  user_id: z.string().uuid(),
});

export type createTeacherSchemaType = z.infer<typeof createTeacherSchema>;

export const createStudentSchema = z.object({
  user_id: z.string().uuid(),
  group_id: z.string().uuid()
});

export type createStudentSchemaType = z.infer<typeof createStudentSchema>;

export const createStudentAttendanceSchema = z.object({
  lesson_id: z.string().uuid(),
  student_id: z.string().uuid(),
  status: z.nativeEnum(AttendanceStatus)
});

export type createStudentAttendanceType = z.infer<typeof createStudentAttendanceSchema>;


