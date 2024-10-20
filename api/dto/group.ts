import type { StudentDetailDTO } from "./user"

export interface GroupDTO {
  id: string
  groupName: string
  direction: string | null
  year: number
}

export interface GroupDetailDTO {
  id: string
  groupName: string
  direction: string | null
  students: StudentDetailDTO[]
  year: number
}

