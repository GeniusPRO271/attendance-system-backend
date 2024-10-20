import type { PostgresJsDatabase } from "drizzle-orm/postgres-js"
import { UserRole, type StudentDetailDTO, type UserDetailAuthDTO, type UserDetailDTO } from "../dto/user"
import { StudentTable, TeacherTable, UserTable } from "../db/schema/tables"
import { eq } from 'drizzle-orm';
import type { updateStudentSchemaType, updateUserSchemaType } from "../zod/update_schema";

export interface UserService {
  getSpecificFromUUID(uuid: string): Promise<UserDetailDTO>
  getSpecificFromEmail(email: string): Promise<UserDetailAuthDTO>
  getSpecificFromTeacherUUID(uuid: string): Promise<UserDetailDTO>
  getSpecificFromStudentUUID(uuid: string): Promise<UserDetailDTO>
  getAllFromGroupUUID(uuid: string): Promise<StudentDetailDTO[]>
  deleteSpecificFromUUID(uuid: string): Promise<UserDetailDTO>
  updateSpecificFromUUID(uuid: string, values: updateUserSchemaType): Promise<UserDetailDTO>
  updateSpecificStudentFromUUID(uuid: string, values: updateStudentSchemaType): Promise<UserDetailDTO | undefined>
}

export class UserServiceClass implements UserService {
  private db: PostgresJsDatabase<Record<string, never>>

  constructor(db: PostgresJsDatabase<Record<string, never>>) {
    this.db = db
  }

  async getSpecificFromUUID(uuid: string): Promise<UserDetailDTO> {
    const userInfo = await this.db.select().from(UserTable).where(eq(UserTable.id, uuid)).then(res => {
      const { password, ...userWithoutPassword } = res[0];
      return userWithoutPassword;
    });
    const teacherInfo = await this.db.select().from(TeacherTable).where(eq(TeacherTable.user_id, userInfo.id)).then(res => res[0])
    const studentInfo = await this.db.select().from(StudentTable).where(eq(StudentTable.user_id, userInfo.id)).then(res => res[0])

    const specificUser: UserDetailDTO = {
      ...userInfo,
      studentInfo,
      teacherInfo,

    }

    return specificUser
  }

  async getSpecificFromEmail(email: string): Promise<UserDetailAuthDTO> {
    const userInfo = await this.db.select().from(UserTable).where(eq(UserTable.email, email)).then(res => res[0])

    const teacherInfo = await this.db.select().from(TeacherTable).where(eq(TeacherTable.user_id, userInfo.id)).then(res => res[0])
    const studentInfo = await this.db.select().from(StudentTable).where(eq(StudentTable.user_id, userInfo.id)).then(res => res[0])

    const specificUser: UserDetailAuthDTO = {
      ...userInfo,
      studentInfo,
      teacherInfo
    }

    return specificUser
  }

  async getSpecificFromStudentUUID(uuid: string): Promise<UserDetailDTO> {
    const userInfo = await this.db.select().from(UserTable).where(eq(UserTable.student_id, uuid)).then(res => {
      const { password, ...userWithoutPassword } = res[0];
      return userWithoutPassword;
    });
    const teacherInfo = await this.db.select().from(TeacherTable).where(eq(TeacherTable.user_id, userInfo.id)).then(res => res[0])
    const studentInfo = await this.db.select().from(StudentTable).where(eq(StudentTable.user_id, userInfo.id)).then(res => res[0])

    const specificUser: UserDetailDTO = {
      ...userInfo,
      studentInfo,
      teacherInfo
    }

    return specificUser
  }

  async getSpecificFromTeacherUUID(uuid: string): Promise<UserDetailDTO> {
    const userInfo = await this.db.select().from(UserTable).where(eq(UserTable.teacher_id, uuid)).then(res => {
      const { password, ...userWithoutPassword } = res[0];
      return userWithoutPassword;
    }); const teacherInfo = await this.db.select().from(TeacherTable).where(eq(TeacherTable.user_id, userInfo.id)).then(res => res[0])
    const studentInfo = await this.db.select().from(StudentTable).where(eq(StudentTable.user_id, userInfo.id)).then(res => res[0])

    const specificUser: UserDetailDTO = {
      ...userInfo,
      studentInfo,
      teacherInfo
    }

    return specificUser
  }

  async getAllFromGroupUUID(uuid: string): Promise<StudentDetailDTO[]> {
    const studentsInfo = await this.db.select().from(StudentTable).where(eq(StudentTable.group_id, uuid))
    const users: StudentDetailDTO[] = []

    for (let index = 0; index < studentsInfo.length; index++) {
      const userInfo = await this.db.select().from(UserTable).where(eq(UserTable.student_id, studentsInfo[index].id)).then(res => {
        const { password, ...userWithoutPassword } = res[0];
        return userWithoutPassword;
      });

      const studentDetail: StudentDetailDTO = {
        studentId: studentsInfo[index].id,
        name: userInfo.name,
        email: userInfo.email,
        group_id: studentsInfo[index].group_id
      }

      users.push(studentDetail)
    }

    return users
  }
  async deleteSpecificFromUUID(uuid: string): Promise<UserDetailDTO> {
    const specificUser = await this.getSpecificFromUUID(uuid)

    await this.db.delete(UserTable).where(eq(UserTable.id, uuid))
    await this.db.delete(TeacherTable).where(eq(TeacherTable.user_id, uuid))
    await this.db.delete(StudentTable).where(eq(StudentTable.user_id, uuid))

    return specificUser
  }

  async updateSpecificFromUUID(uuid: string, values: updateUserSchemaType): Promise<UserDetailDTO> {
    await this.db.update(UserTable).set(values).where(eq(UserTable.id, uuid))
    const specificGroup = await this.getSpecificFromUUID(uuid)
    return specificGroup
  }

  async updateSpecificStudentFromUUID(uuid: string, values: updateStudentSchemaType): Promise<UserDetailDTO | undefined> {
    await this.db.update(StudentTable).set(values).where(eq(StudentTable.id, uuid))
    const studentInfo = await this.db.select().from(StudentTable).where(eq(StudentTable.user_id, uuid)).then(res => res[0])
    if (studentInfo.user_id) {
      const specificUser = await this.getSpecificFromUUID(studentInfo.user_id)
      return specificUser
    }
  }
}

