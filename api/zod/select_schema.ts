import { z } from "zod";

export const validateEmail = z.object({
  email: z.string().email(),
});

export type validateEmailType = z.infer<typeof validateEmail>;

export const validateAttendanceUUID = z.object({
  attendance_process: z.string().uuid(),
});

export type validateAttendanceUUIDType = z.infer<typeof validateAttendanceUUID>;

export const validateUUID = z.object({
  uuid: z.string().uuid(),
});

export type validateUUIDType = z.infer<typeof validateUUID>;

export const validGroupParams = z.object({
  group_id: z
    .string()
    .uuid().optional(),
  teacher_id: z
    .string()
    .uuid().optional(),
});

export type validGroupParamsType = z.infer<typeof validGroupParams>;

export const validPagination = z.object({
  limit: z
    .string()
    .refine((val) => !isNaN(Number(val)), {
      message: "Limit must be a valid number",
    })
    .default("10"),  // Default value for limit
  offset: z
    .string()
    .refine((val) => !isNaN(Number(val)), {
      message: "Offset must be a valid number",
    })
    .default("0"),  // Default value for offset
  from: z.string().date().default("2023-01-01")

});

export type validPaginationType = z.infer<typeof validPagination>;

export const validDate = z.object({
  date: z.string(),
});


export type validDateType = z.infer<typeof validDate>;


export const lessonFilterSchema = z.object({
  teacher_id: z.string().uuid().optional(),         // Expecting UUID format if provided
  group_id: z.string().uuid().optional(),           // Expecting UUID format if provided
  subject_id: z.string().uuid().optional(),         // Expecting UUID format if provided
  attendance_process_id: z.string().uuid().optional(),
  start_time: z.string().datetime().optional(),     // ISO 8601 format
  end_time: z.string().datetime().optional(),       // ISO 8601 format
  id: z.string().uuid().optional(),                 // Expecting UUID format if provided
}).strict();

export type lessonFilterSchemaType = z.infer<typeof lessonFilterSchema>;

// --- Zod Schema for Query Parameters ---
export const subjectFilterSchema = z.object({
  // All filters are optional
  teacher_id: z.string().uuid().optional(), // Expecting UUID format if provided
  group_id: z.string().uuid().optional(),   // Expecting UUID format if provided
  id: z.string().uuid().optional(),         // Expecting UUID format if provided
  name: z.string().min(1).optional(),     // Expecting non-empty string if provided
}).strict(); // Use strict to prevent unexpected query parameters


export type subjectFilterSchemaType = z.infer<typeof subjectFilterSchema>;
