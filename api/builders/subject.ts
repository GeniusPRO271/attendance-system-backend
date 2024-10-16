import { v4 as uuidv4 } from 'uuid';
import type { createSubjectSchemaType } from '../zod/create_schema';

export class SubjectBuilder {
  id: string;
  name: string;
  description: string

  constructor(body: createSubjectSchemaType) {
    this.id = uuidv4();
    this.name = body.name;
    this.description = body.description
  }
}

