import type { PostgresJsDatabase } from "drizzle-orm/postgres-js"
import { UserServiceClass, type UserService } from "../service"
import { Hono } from "hono"
import { zValidator } from "@hono/zod-validator"
import { createUserSchema } from "../zod/create_schema"
import { GroupTable, StudentTable, subjectsToTeacherTable, SubjectTable, TeacherTable, UserTable } from "../db/schema/tables"
import { UserBuilder } from "../builders"
import { validateEmail, validateUUID } from "../zod/select_schema"
import { updateDevice, updateStudent, updateStudentSchema, updateTeacherSchema, updateUserSchema } from "../zod/update_schema"
import { db } from "../db"
import { SECRET_KEY } from "../config"
import jwt from 'jsonwebtoken';
import { sql } from "drizzle-orm"
import { eq } from "drizzle-orm"
import type { TeacherGetAll } from "../dto/user"
function startUserRoute(service: UserService, db: PostgresJsDatabase<Record<string, never>>) {

  const api = new Hono()

  // Create a new user
  api.post('/', zValidator("json", createUserSchema), async (c) => {
    const body = c.req.valid("json")

    const user = await UserBuilder.create(body, db)

    const userDetails = await service.getSpecificFromUUID(user.id)
    return c.json({
      "message": "new user added",
      "data": userDetails
    })
  })

  // Get all Users
  api.get('/', async (c) => {
    const users_data = await db.select().from(TeacherTable)
    return c.json({
      "message": "users requested",
      "data": users_data
    })
  })

  // Get a specific User
  api.get("/:uuid", zValidator("param", validateUUID), async (c) => {
    const userId = c.req.valid("param").uuid
    const user = await service.getSpecificFromUUID(userId)
    return c.json({
      message: "specific user data requested",
      data: user
    })
  })


  // Get a specific User
  api.get("/info/:email", zValidator("param", validateEmail), async (c) => {
    const userEmail = c.req.valid("param").email
    const user = await service.getSpecificFromEmail(userEmail)
    return c.json({
      message: "specific user data requested",
      data: user
    })
  })

  // Get a specific student
  api.get("/student/:uuid", zValidator("param", validateUUID), async (c) => {
    const studentId = c.req.valid("param").uuid
    const user = await service.getSpecificFromStudentUUID(studentId)
    return c.json({
      message: "specific user data requested",
      data: user
    })
  })

  api.get("/students/all", async (c) => {
    try {
      console.log("getting all users")
      const students = await db
        .select({
          studentId: StudentTable.id,
          groupId: StudentTable.group_id,
          user: {
            id: UserTable.id,
            name: UserTable.name,
            email: UserTable.email,
            role: UserTable.role,
            deviceUuid: UserTable.device_uuid,
            deviceLastChange: UserTable.device_lastChange
          },
          group: {
            id: GroupTable.id,
            name: GroupTable.groupName,
          },
        })
        .from(StudentTable)
        // cast the text student.user_id → uuid so it matches user.id (uuid)
        .leftJoin(
          UserTable,
          eq(
            sql`${StudentTable.user_id}::uuid`,
            UserTable.id
          )
        )
        // and likewise for group_id if needed
        .leftJoin(
          GroupTable,
          eq(
            sql`${StudentTable.group_id}::uuid`,
            GroupTable.id
          )
        )

      return c.json({ success: true, data: students })
    } catch (err) {
      console.error(err)
      return c.json({ success: false, message: "Failed to fetch students" }, 500)
    }
  })
  // Get a specific teacher
  api.get("/teacher/all", async (c) => {
    const rows = await db
      .select({
        id: UserTable.id,
        name: UserTable.name,
        email: UserTable.email,
        role: UserTable.role,
        subjectId: SubjectTable.id,
        subjectName: SubjectTable.name,
      })
      .from(UserTable)
      .leftJoin(
        subjectsToTeacherTable,
        eq(UserTable.teacher_id, subjectsToTeacherTable.teacher_id)
      )
      .leftJoin(
        SubjectTable,
        eq(subjectsToTeacherTable.subject_id, SubjectTable.id)
      )
      .where(sql`${UserTable.teacher_id} IS NOT NULL`);

    const teachers: TeacherGetAll[] = [];

    for (const row of rows) {
      let teacher = teachers.find((t) => t.id === row.id);

      if (!teacher) {
        teacher = {
          id: row.id,
          name: row.name,
          email: row.email,
          role: row.role,
          subject: [],
        };
        teachers.push(teacher);
      }

      if (row.subjectId && row.subjectName) {
        teacher.subject?.push({
          id: row.subjectId,
          name: row.subjectName,
        });
      }
    }

    console.log("returning teachers: ", teachers)
    return c.json({
      message: "users requested",
      data: teachers,
    });
  });

  // Get a specific teacher
  api.get("/teacher/:uuid", zValidator("param", validateUUID), async (c) => {
    const teacherId = c.req.valid("param").uuid
    const user = await service.getSpecificFromTeacherUUID(teacherId)
    return c.json({
      message: "specific user data requested",
      data: user
    })
  })

  api.get("/profile/info", async (c) => {
    try {

      console.log("getting profile")
      const authHeader = c.req.header("Authorization")
      if (!authHeader) {
        return c.json({ message: "Authorization header missing" }, 401);
      }

      const token = authHeader.split(" ")[1];
      if (!token) {
        return c.json({ message: "Token missing" }, 401);
      }

      const decodedToken = jwt.verify(token, SECRET_KEY) as { uuid: string };

      const user = await service.getSpecificFromUUID(decodedToken.uuid);

      console.log("user after fucnton: ", user)
      if (!user) {
        return c.json({ message: "User not found" }, 404);
      }

      return c.json({
        message: "User profile retrieved successfully",
        data: user,
      });

    } catch {
      return c.json({ message: "Unauthorized or invalid token" }, 401);
    }
  });

  // Delete a specific user
  api.delete("/:uuid", zValidator("param", validateUUID), async (c) => {
    const userId = c.req.valid("param").uuid
    const userDeleted = await service.deleteSpecificFromUUID(userId)
    return c.json({
      message: "Subject has been delete",
      data: userDeleted
    })
  })

  // Update an specific student
  api.put(
    "/student/:uuid",
    zValidator("param", validateUUID),
    zValidator("json", updateStudent),
    async (c) => {
      const studentId = c.req.valid("param").uuid;
      const update = c.req.valid("json");

      const { name, email, group_id } = update;

      // Log for debugging
      console.log("Updated values:", update);

      // Update studentTable
      if (group_id) {
        await db.update(StudentTable).set({ group_id }).where(eq(StudentTable.id, studentId));
      }

      // Update userTable
      if (name || email) {
        await db
          .update(UserTable)
          .set({
            ...(name && { name }),
            ...(email && { email }),
          })
          .where(eq(UserTable.student_id, studentId));
      }

      return c.json({
        message: "User has been updated",
      });
    }
  );

  api.put(
    '/teacher/:uuid',
    zValidator('param', validateUUID),
    zValidator('json', updateTeacherSchema),
    async (c) => {
      const { uuid } = c.req.valid('param')
      const updates = c.req.valid('json')

      try {
        // Ensure corresponding teacher record exists
        const teacherRows = await db
          .select({ id: TeacherTable.id })
          .from(TeacherTable)
          .where(eq(TeacherTable.user_id, uuid))

        if (teacherRows.length === 0) {
          return c.json({ success: false, error: 'Teacher not found' }, 404)
        }

        const teacherId = teacherRows[0].id

        // Update user info
        if (updates.name || updates.email) {
          await db
            .update(UserTable)
            .set({
              ...(updates.name && { name: updates.name }),
              ...(updates.email && { email: updates.email }),
            })
            .where(eq(UserTable.id, uuid))
        }

        // Update subject associations
        if (updates.subjects) {
          await db.delete(subjectsToTeacherTable).where(
            eq(subjectsToTeacherTable.teacher_id, teacherId)
          )

          if (updates.subjects.length > 0) {
            await db.insert(subjectsToTeacherTable).values(
              updates.subjects.map((subject) => ({
                teacher_id: teacherId,
                subject_id: subject.id,
              }))
            )
          }
        }

        return c.json({ success: true }, 200)
      } catch (error) {
        console.error('Failed to update teacher', error)
        return c.json(
          { success: false, error: 'Unable to update teacher' },
          500
        )
      }
    }
  )

  // Update an specific user
  api.put("/:uuid", zValidator("param", validateUUID), zValidator("json", updateUserSchema), async (c) => {
    const userId = c.req.valid("param").uuid
    const update = c.req.valid("json")
    const updatedUser = await service.updateSpecificFromUUID(userId, update)

    return c.json({
      message: "User has been updated",
      data: updatedUser
    })
  })

  api.post("/:uuid/device", zValidator("param", validateUUID), zValidator("json", updateDevice), async (c) => {
    const userId = c.req.valid("param").uuid;
    const deviceUUID = c.req.valid("json").deviceUUID

    if (!deviceUUID) {
      return c.json({ message: "deviceUUID is required" }, 400);
    }

    const updated = await service.addDeviceUUIDToUser(userId, deviceUUID);

    if (updated) {
      return c.json({
        message: "Device UUID has been updated",
      }, 200);
    } else {
      return c.json({
        message: "Cannot update device UUID - either it's already set to this value or it was changed recently (within 30 days)",
      }, 400);
    }
  });

  return api
}

const service = new UserServiceClass(db)
const UserRoute = startUserRoute(service, db)

export { UserRoute }
