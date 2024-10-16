import { z } from "zod";

export const validateUUID = z.object({
  uuid: z.string().uuid(),
});

export type validateUUIDType = z.infer<typeof validateUUID>;

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
});

export type validPaginationType = z.infer<typeof validPagination>;

