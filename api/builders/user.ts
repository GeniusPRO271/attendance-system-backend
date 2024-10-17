

import { v4 as uuidv4 } from 'uuid';
import type { createStudentSchemaType, createTeacherSchemaType, createUserSchemaType } from '../zod/create_schema';
import { insertStudentSchema, insertTeacherSchema, insertUserSchema, StudentTable, TeacherTable, UserTable } from '../db/schema/tables';
import { TeacherBuilder } from './teacher';
import { StudentBuilder } from './student';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type { UserRole } from '../dto/user';

export class UserBuilder {
  id: string;
  name: string
  email: string
  password: string
  role: UserRole
  student_id: string | undefined
  teacher_id: string | undefined

  constructor(body: createUserSchemaType & { uuid: string, student_id?: string, teacher_id?: string }) {
    this.id = body.uuid;
    this.name = body.name
    this.email = body.email
    this.password = body.password
    this.role = body.role
    this.student_id = body.student_id
    this.teacher_id = body.teacher_id
  }


  static async create(body: createUserSchemaType, db: PostgresJsDatabase<Record<string, never>>): Promise<UserBuilder> {
    const userId = crypto.randomUUID()
    let studentId
    let teacherId
    if (body.isTeacher) {

      console.log("create Teacher")
      let teacherValues: createTeacherSchemaType = {
        user_id: userId
      }

      const new_teacher = new TeacherBuilder(teacherValues)
      teacherId = new_teacher.id
      const teacherInfo = insertTeacherSchema.parse(new_teacher)
      await db.insert(TeacherTable).values(teacherInfo)
    }
    if (body.group_id) {

      console.log("create User")
      let studentValues: createStudentSchemaType = {
        user_id: userId,
        group_id: body.group_id
      }

      const new_student = new StudentBuilder(studentValues)
      studentId = new_student.id
      const studentInfo = insertStudentSchema.parse(new_student)
      await db.insert(StudentTable).values(studentInfo)
    }

    const userValues: createUserSchemaType & { uuid: string, student_id?: string, teacher_id?: string } = {
      ...body,
      uuid: userId,
      student_id: studentId,
      teacher_id: teacherId
    }

    const new_user = new UserBuilder(userValues)
    const userInfo = insertUserSchema.parse(new_user)
    await db.insert(UserTable).values(userInfo)

    return new_user
  }
}

