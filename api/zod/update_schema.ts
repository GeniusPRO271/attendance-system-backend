import { z } from "zod";
import { UserRole } from "../dto/user";
import { AttendanceStatus } from "../dto/studentAttendance";
import { AttendanceProcessStatus } from "../dto/attendanceProcess";

export const updateDevice = z.object({
  deviceUUID: z.string().uuid()
});

export type updateDeivceType = z.infer<typeof updateDevice>;

export const updateGroup = z.object({
  group_name: z.string().optional(),
  direction: z.string().uuid().optional(),
  year: z.number().optional(),
  subject_id: z.array(z.string()),
});

export type updateGroupType = z.infer<typeof updateGroup>;

export const updateDirection = z.object({
  name: z.string().optional(),
  code: z.string().optional(),
  faculty: z.string().uuid().optional(),
});

export type updateDirectionType = z.infer<typeof updateDirection>;

export const updateFaculty = z.object({
  name: z.string().optional(),
  dean: z.string().optional(),
});

export type updateFacultyType = z.infer<typeof updateFaculty>;

export const updateLessonSchema = z.object({

  teacher_id: z.string().uuid().optional(), // Teacher ID is optional
  subject_id: z.string().uuid().optional(), // Subject ID is optional
  group_id: z.string().uuid().optional(),
  start_time: z
    .string() // Expect a string
    .refine((dateStr) => !isNaN(Date.parse(dateStr)), {
      message: "Start time must be a valid date string", // Validate start_time as a string
    })
    .optional(), // Make it optional
  end_time: z
    .string() // Expect a string
    .refine((dateStr) => {
      const endDate = new Date(dateStr);
      return !isNaN(endDate.getTime()) && endDate > new Date(); // Validate end_time is in the future
    }, {
      message: "End time must be a valid date string and in the future", // Validate end_time as a string and in the future
    })
    .optional(), // Make it optional
});

export type updateLessonSchemaType = z.infer<typeof updateLessonSchema>;

export const updateSubjectSchema = z.object({
  name: z.string().optional(), // Teacher ID is optional
  description: z.string().optional(), // Subject ID is optional
});

export type updateSubjectSchemaType = z.infer<typeof updateSubjectSchema>;

export const updateUserSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
  password: z.string().optional(),
  role: z.nativeEnum(UserRole).optional()
});

export type updateUserSchemaType = z.infer<typeof updateUserSchema>;

export const updateStudentSchema = z.object({
  group_id: z.string().uuid().optional()
});

export type updateStudentSchemaType = z.infer<typeof updateStudentSchema>;

export const updateStudentAttendanceSchema = z.object({
  student_id: z.string().optional(),
  status: z.nativeEnum(AttendanceStatus).optional(),
  lastUpdate: z.date().optional()
});

export type updateStudentAttendanceType = z.infer<typeof updateStudentAttendanceSchema>;

export const updateAttendanceProcessSchema = z.object({
  status: z.nativeEnum(AttendanceProcessStatus).optional(),
});


export type updateAttendanceProcessType = z.infer<typeof updateAttendanceProcessSchema>;

export const updateTeacherSchema = z
  .object({
    name: z.string().min(1).optional(),
    email: z.string().email().optional(),
    subjects: z
      .array(
        z.object({
          id: z.string().uuid(),
          name: z.string().min(1),
        })
      )
      .optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field (name, email, or subjects) must be provided',
  })


export type updateTeacherSchemaType = z.infer<typeof updateTeacherSchema>;

export const updateStudent = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
  group_id: z.string().optional(),
});

export type updateStudentType = z.infer<typeof updateStudent>;
