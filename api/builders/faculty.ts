import type { createFacultySchemaType } from "../zod/create_schema"
import { v4 as uuidv4 } from 'uuid';

export class FacultyBuilder {
  id: string
  name: string
  dean: string

  constructor(body: createFacultySchemaType) {
    this.id = uuidv4()
    this.name = body.name
    this.dean = body.dean
  }
}
