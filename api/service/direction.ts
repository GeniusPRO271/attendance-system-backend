import type { PostgresJsDatabase } from "drizzle-orm/postgres-js"
import type { DirectionDTO } from "./dto"
import { DirectionTable, GroupTable } from "../db/schema/tables"
import { eq } from 'drizzle-orm';
import type { updateDirectionType } from "../zod/update_schema";

export interface DirectionService {
  getSpecificFromUUID(uuid: string): Promise<DirectionDTO>
  deleteSpecificFromUUID(uuid: string): Promise<DirectionDTO>
  updateSpecificFromUUID(uuid: string, values: updateDirectionType): Promise<DirectionDTO>
}

export class DirectionServiceClass implements DirectionService {
  private db: PostgresJsDatabase<Record<string, never>>

  constructor(db: PostgresJsDatabase<Record<string, never>>) {
    this.db = db
  }

  async getSpecificFromUUID(uuid: string): Promise<DirectionDTO> {
    const selectDirection = await this.db.select().from(DirectionTable).where(eq(DirectionTable.id, uuid)).then(res => res[0])
    const directionGroups = await this.db.select().from(GroupTable).where(eq(GroupTable.direction, uuid))
    let specificDirection: DirectionDTO = {
      ...selectDirection,
      groups: directionGroups
    }
    return specificDirection
  }

  async deleteSpecificFromUUID(uuid: string): Promise<DirectionDTO> {
    const specificDirection = this.getSpecificFromUUID(uuid)
    await this.db.delete(DirectionTable).where(eq(DirectionTable.id, uuid))
    return specificDirection
  }

  async updateSpecificFromUUID(uuid: string, values: updateDirectionType): Promise<DirectionDTO> {
    await this.db.update(DirectionTable).set(values).where(eq(DirectionTable.id, uuid))
    const specificDirection = await this.getSpecificFromUUID(uuid)
    return specificDirection
  }

}
