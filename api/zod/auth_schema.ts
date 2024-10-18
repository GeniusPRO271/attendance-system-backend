import { z } from "zod";

export const loginUserSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export type loginUserSchemaType = z.infer<typeof loginUserSchema>;

export const refreshTokenSchema = z.object({
  refreshToken: z.string(),
});

export type refreshTokenSchemaType = z.infer<typeof refreshTokenSchema>;

