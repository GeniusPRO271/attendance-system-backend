

import { v4 as uuidv4 } from 'uuid';
import type { createTeacherSchemaType } from '../zod/create_schema';

export class TeacherBuilder {
  id: string;
  user_id: string;

  constructor(body: createTeacherSchemaType) {
    this.id = uuidv4();
    this.user_id = body.user_id;
  }
}

