export interface UserDetailDTO {
  id: string
  name: string
  email: string
  password: string
  role: UserRole
  studentInfo: StudentDTO
  teacherInfo: TeacherDTO
}

export interface UserAuthDTO {
  token: string
  refresh_token: string
}


export interface UserDTO {
  id: string
  name: string
  email: string
  password: string
  role: UserRole
}

export interface StudentDTO {
  id: string
  group_id: string
}

export interface TeacherDTO {
  id: string
}

export enum UserRole {
  Default = 'default',
  Admin = 'admin',
}

