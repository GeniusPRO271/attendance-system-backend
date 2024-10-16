import type { createGroupSchemaType } from "../zod/create_schema"

export class GroupBuilder {
  id: string
  groupName: string
  direction: string
  year: number

  constructor(body: createGroupSchemaType) {
    this.id = crypto.randomUUID()
    this.year = body.year
    this.direction = body.direction
    this.groupName = body.group_name
  }
}
