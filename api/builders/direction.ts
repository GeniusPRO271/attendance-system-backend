import type { createDirectionSchemaType } from "../zod/create_schema"

export class DirectionBuilder {
  id: string
  name: string
  code: string
  faculty: string

  constructor(body: createDirectionSchemaType) {
    this.id = crypto.randomUUID()
    this.name = body.name
    this.code = body.code
    this.faculty = body.faculty
  }
}
