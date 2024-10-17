import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { AuthRoute, DirectionRoute, FacultyRoute, GroupRoute, LessonRoute, StudentAttendanceRoute, SubjectRoute } from "./routes";
import { UserRoute } from "./routes/user";
import { jwt } from "hono/jwt";
import type { Variables } from "hono/types";
import { SECRET_KEY } from "./config";

const api = new Hono<{ Variables: Variables }>()

api.use(logger())
api.use(cors())


// Auth middleware
api.use('api/protected/*', (c, next) => {
  const jwtMiddleware = jwt({
    secret: SECRET_KEY
  })
  return jwtMiddleware(c, next)
})

const protectedRoutes = api.basePath("/api/protected")
  .route('/group', GroupRoute)
  .route('/direction', DirectionRoute)
  .route('/faculty', FacultyRoute)
  .route('/lesson', LessonRoute)
  .route('/subject', SubjectRoute)
  .route('/user', UserRoute)
  .route('/attendance', StudentAttendanceRoute)
  .get('/hello', (c) => {
    return c.text(
      "Api protected routes up and running! ",
    )
  })

const unprotectedRoutes = api.basePath("/api")
  .route('/auth', AuthRoute)
  .get('/hello', (c) => {
    return c.text(
      "Api unprotected routes up and running! ",
    )
  })

export default api



