export interface UserDetailDTO {
  id: string
  name: string
  email: string
  role: string
  studentInfo: StudentDTO
  teacherInfo: TeacherDTO
}

export interface UserDetailAuthDTO {
  id: string
  name: string
  email: string
  password: string
  role: string
  studentInfo: StudentDTO
  teacherInfo: TeacherDTO
}

export interface StudentDetailDTO {
  studentId: string
  name: string
  email: string
  group_id: string
}
export interface UserAuthDTO {
  token: string
  refresh_token: string
}


export interface UserDTO {
  id: string
  name: string
  email: string
  role: string
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

