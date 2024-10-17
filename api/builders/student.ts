import type { createStudentSchemaType } from '../zod/create_schema';

export class StudentBuilder {
  id: string;
  user_id: string;
  group_id: string;

  constructor(body: createStudentSchemaType) {
    this.id = crypto.randomUUID()
    this.user_id = body.user_id;
    this.group_id = body.group_id;
  }
}

