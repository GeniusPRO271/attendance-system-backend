import { z } from "zod";

export const validateEmail = z.object({
  email: z.string().email(),
});

export type validateEmailType = z.infer<typeof validateEmail>;

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
