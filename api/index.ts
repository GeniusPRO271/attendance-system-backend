import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { DirectionRoute, FacultyRoute, GroupRoute } from "./routes";
import { LessonRoute } from "./routes/lesson";
import { SubjectRoute } from "./routes/subject";
import { UserRoute } from "./routes/user";

const api = new Hono()
api.use(logger())
api.use(cors())

// Start routes of endpoints
const apiRoutes = api.basePath("/api")
  .route('/group', GroupRoute)
  .route('/direction', DirectionRoute)
  .route('/faculty', FacultyRoute)
  .route('/lesson', LessonRoute)
  .route('/subject', SubjectRoute)
  .route('/user', UserRoute)
  .post('/', (c) => {
    return c.text(
      "Api service up and running! ",
    )
  })

export default api
export type ApiRoutes = typeof apiRoutes



