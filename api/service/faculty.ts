
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js"
import type { FacultyDTO } from "./dto"
import { DirectionTable, FacultyTable } from "../db/schema/tables"
import { eq } from 'drizzle-orm';
import type { updateFacultyType } from "../zod/update_schema";

export interface FacultyService {
  getSpecificFromUUID(uuid: string): Promise<FacultyDTO>
  deleteSpecificFromUUID(uuid: string): Promise<FacultyDTO>
  updateSpecificFromUUID(uuid: string, values: updateFacultyType): Promise<FacultyDTO>
}

export class FacultyServiceClass implements FacultyService {
  private db: PostgresJsDatabase<Record<string, never>>

  constructor(db: PostgresJsDatabase<Record<string, never>>) {
    this.db = db
  }

  async getSpecificFromUUID(uuid: string): Promise<FacultyDTO> {
    const selectFaculty = await this.db.select().from(FacultyTable).where(eq(FacultyTable.id, uuid)).then(res => res[0])
    const facultiesDirections = await this.db.select().from(DirectionTable).where(eq(DirectionTable.faculty, uuid))
    let specificFaculty: FacultyDTO = {
      ...selectFaculty,
      directions: facultiesDirections
    }
    return specificFaculty
  }


  async deleteSpecificFromUUID(uuid: string): Promise<FacultyDTO> {
    const specificFaculty = this.getSpecificFromUUID(uuid)
    await this.db.delete(FacultyTable).where(eq(FacultyTable.id, uuid))
    return specificFaculty
  }

  async updateSpecificFromUUID(uuid: string, values: updateFacultyType): Promise<FacultyDTO> {
    await this.db.update(FacultyTable).set(values).where(eq(FacultyTable.id, uuid))
    const specificFaculty = await this.getSpecificFromUUID(uuid)
    return specificFaculty
  }

}
