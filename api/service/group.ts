import type { PostgresJsDatabase } from "drizzle-orm/postgres-js"
import { GroupTable, StudentTable, subjectsToGroupsTable, UserTable } from "../db/schema/tables"
import { eq } from 'drizzle-orm';
import type { updateGroupType } from "../zod/update_schema";
import type { GroupDetailDTO, GroupDTO } from "../dto/group";
import { UserServiceClass } from "./user";

export interface GroupService {
  getSpecificFromUUID(uuid: string): Promise<GroupDetailDTO>
  deleteSpecificFromUUID(uuid: string): Promise<GroupDTO>
  updateSpecificFromUUID(uuid: string, values: updateGroupType): Promise<GroupDTO>
}

export class GroupServiceClass implements GroupService {
  private db: PostgresJsDatabase<Record<string, never>>

  constructor(db: PostgresJsDatabase<Record<string, never>>) {
    this.db = db
  }

  async getSpecificFromUUID(uuid: string): Promise<GroupDetailDTO> {
    const specificGroup = await this.db.select().from(GroupTable).where(eq(GroupTable.id, uuid)).then(res => res[0])
    const userService = new UserServiceClass(this.db)
    const studentsInfo = await userService.getAllFromGroupUUID(specificGroup.id)

    const groupDetail: GroupDetailDTO = {
      ...specificGroup,
      students: studentsInfo
    }

    return groupDetail
  }

  async deleteSpecificFromUUID(uuid: string): Promise<GroupDTO> {
    const specificGroup = await this.getSpecificFromUUID(uuid)
    await this.db.delete(subjectsToGroupsTable).where(eq(subjectsToGroupsTable.group_id, uuid))
    await this.db.delete(GroupTable).where(eq(GroupTable.id, uuid))
    return specificGroup
  }

  async updateSpecificFromUUID(uuid: string, values: updateGroupType): Promise<GroupDTO> {
    const { subject_id, ...groupFields } = values;
    await this.db.update(GroupTable).set(groupFields).where(eq(GroupTable.id, uuid));
    if (Array.isArray(subject_id) && subject_id.length > 0) {
      const rowsToInsert = subject_id.map((sid) => ({
        group_id: uuid,
        subject_id: sid,
      }));
      await this.db.insert(subjectsToGroupsTable).values(rowsToInsert);
    }
    return this.getSpecificFromUUID(uuid);
  }
}

