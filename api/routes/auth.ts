import { zValidator } from "@hono/zod-validator"
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js"
import { Hono } from "hono"
import { AuthServiceClass, type AuthService } from "../service/auth"
import { db } from "../db"
import { createUserSchema } from "../zod/create_schema"
import { UserTable } from "../db/schema/tables"
import { eq } from "drizzle-orm"
import { UserBuilder } from "../builders"
import bcrypt from 'bcrypt';
import { loginUserSchema, refreshTokenSchema } from "../zod/auth_schema"
import { UserServiceClass, type UserService } from "../service"

function startAuthRoute(auth: AuthService, service: UserService, db: PostgresJsDatabase<Record<string, never>>) {
  const api = new Hono()

  // Login User
  api.post('/register', zValidator('json', createUserSchema), async (c) => {
    try {
      const body = c.req.valid("json")

      const existingUser = await db.select().from(UserTable).where(eq(UserTable.email, body.email));
      if (existingUser.length > 0) {
        return c.json({ message: 'User already exists' }, 400);
      }

      const hashedPassword = await bcrypt.hash(body.password, 10);
      const user = await UserBuilder.create({ ...body, password: hashedPassword }, db)
      const userDetails = await service.getSpecificFromUUID(user.id)

      return c.json({
        message: 'User successfully registered',
        data: userDetails
      }, 201);
    } catch (error) {
      console.error(error);
      return c.json({ message: 'Error during registration' }, 500);
    }
  });

  // Login route
  api.post('/login', zValidator("json", loginUserSchema), async (c) => {
    try {

      const { email, password } = c.req.valid("json")
      const { password: storedPassword, id } = await service.getSpecificFromEmail(email)

      const isPasswordValid = await bcrypt.compare(password, storedPassword);
      if (!storedPassword || !isPasswordValid) {
        return c.json({ message: 'Invalid credentials' }, 401);
      }

      const tokenData = await auth.generateTokens(id);

      return c.json({
        message: 'Login successful',
        accessToken: tokenData.token,
        refreshToken: tokenData.refreshToken,
        expiresIn: tokenData.expiresIn,
      });
    } catch (error) {
      return c.json({ message: 'Invalid data' }, 400);
    }
  });

  // Refresh token route
  api.post('/refresh-token', zValidator("json", refreshTokenSchema), async (c) => {
    const { id, refreshToken } = c.req.valid("json")

    try {
      const tokens = await auth.readTokens(id);
      const isRefreshValid = await auth.verifyRefreshToken(id)

      if (tokens.refreshToken !== refreshToken || !isRefreshValid.valid) {
        return c.json({ message: 'Invalid refresh token' }, 401);
      }

      const newTokens = await auth.generateTokens(id);

      return c.json({
        accessToken: newTokens.token,
        refreshToken: newTokens.refreshToken,
        expiresIn: newTokens.expiresIn,
      });
    } catch (error) {
      return c.json({ message: 'Unable to refresh token' }, 400);
    }
  });

  return api
}

const auth = new AuthServiceClass()
const service = new UserServiceClass(db)
const AuthRoute = startAuthRoute(auth, service, db)

export { AuthRoute }
