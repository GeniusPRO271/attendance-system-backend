
export interface FacultyDTO {
  id: string
  name: string
  dean: string
  directions: {
    id: string
    name: string
    code: string
    faculty: string | null
  }[]
}
