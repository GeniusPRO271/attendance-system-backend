import type { createSubjectSchemaType } from '../zod/create_schema';

export class SubjectBuilder {
  id: string;
  name: string;
  description: string

  constructor(body: createSubjectSchemaType) {
    this.id = crypto.randomUUID()
    this.name = body.name;
    this.description = body.description
  }
}

