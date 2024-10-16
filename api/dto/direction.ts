import type { GroupDTO } from "./group"

export interface DirectionDTO {
  id: string
  name: string
  code: string
  groups: GroupDTO[]
  faculty: string | null
}
