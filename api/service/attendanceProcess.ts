
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js"
import { AttendanceProcessTable, StudentTable } from "../db/schema/tables"
import { eq } from 'drizzle-orm';
import type { updateAttendanceProcessType } from "../zod/update_schema";
import { AttendanceProcessStatus, type AttendanceProcessDTO } from "../dto/attendanceProcess";

export interface AttendanceProcessService {
  getSpecificFromUUID(uuid: string): Promise<AttendanceProcessDTO>
  startSpecificFromUUID(uuid: string, attendanceProcessValue: string): Promise<AttendanceProcessDTO>
  endSpecificFromUUID(uuid: string): Promise<AttendanceProcessDTO>
  updateSpecificFromUUID(uuid: string, values: updateAttendanceProcessType): Promise<AttendanceProcessDTO>
}

export class AttendanceProcessServiceClass implements AttendanceProcessService {
  private db: PostgresJsDatabase<Record<string, never>>

  constructor(db: PostgresJsDatabase<Record<string, never>>) {
    this.db = db
  }

  async getSpecificFromUUID(uuid: string): Promise<AttendanceProcessDTO> {
    const selectAttendanceProcess = await this.db.select().from(AttendanceProcessTable).where(eq(AttendanceProcessTable.id, uuid)).then(res => res[0])
    return selectAttendanceProcess
  }

  async startSpecificFromUUID(uuid: string, attendanceProcessValue: string): Promise<AttendanceProcessDTO> {
    await this.db.update(AttendanceProcessTable).set({ status: AttendanceProcessStatus.InProcess, end_time: attendanceProcessValue, start_time: Date.now().toString() }).where(eq(AttendanceProcessTable.id, uuid))
    const selectAttendanceProcess = await this.db.select().from(AttendanceProcessTable).where(eq(AttendanceProcessTable.id, uuid)).then(res => res[0])
    return selectAttendanceProcess
  }

  async endSpecificFromUUID(uuid: string): Promise<AttendanceProcessDTO> {
    await this.db.update(AttendanceProcessTable).set({ status: AttendanceProcessStatus.Closed }).where(eq(AttendanceProcessTable.id, uuid))
    const selectAttendanceProcess = await this.db.select().from(AttendanceProcessTable).where(eq(AttendanceProcessTable.id, uuid)).then(res => res[0])

    return selectAttendanceProcess
  }
  async updateSpecificFromUUID(uuid: string, values: updateAttendanceProcessType): Promise<AttendanceProcessDTO> {
    await this.db.update(AttendanceProcessTable).set(values).where(eq(AttendanceProcessTable.id, uuid))
    const selectAttendanceProcess = await this.db.select().from(AttendanceProcessTable).where(eq(AttendanceProcessTable.id, uuid)).then(res => res[0])
    return selectAttendanceProcess
  }
}
