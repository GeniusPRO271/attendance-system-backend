import type { createTeacherSchemaType } from '../zod/create_schema';

export class TeacherBuilder {
  id: string;
  user_id: string;

  constructor(body: createTeacherSchemaType) {
    this.id = crypto.randomUUID()
    this.user_id = body.user_id;
  }
}

