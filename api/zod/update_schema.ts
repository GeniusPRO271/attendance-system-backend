import { z } from "zod";
import { UserRole } from "../dto/user";

export const updateGroup = z.object({
  group_name: z.string().optional(),
  direction: z.string().uuid().optional(),
  year: z.number().optional(),
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


