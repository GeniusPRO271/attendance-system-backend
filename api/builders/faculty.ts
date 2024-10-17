import type { createFacultySchemaType } from "../zod/create_schema"

export class FacultyBuilder {
  id: string
  name: string
  dean: string

  constructor(body: createFacultySchemaType) {
    this.id = crypto.randomUUID()
    this.name = body.name
    this.dean = body.dean
  }
}
