import type { ServerWebSocket } from "bun";
import type { StudentAttendanceDTO } from "./dto/studentAttendance";

export class RoomManager {
  private rooms: Map<string, { users: Set<ServerWebSocket<unknown>> }> = new Map();

  startRoom(ws: ServerWebSocket<unknown>, room: string, user: string) {
    if (this.rooms.has(room)) {
      console.log("adding user to room: ", room)
      this.addUserToRoom(ws, room, user)
    } else {
      console.log("created room: ", room)
      this.rooms.set(room, {
        users: new Set([ws]),
      });
    }
    this.broadcastMessage(room, `${user} has created the room and joined.`);
  }

  addUserToRoom(ws: ServerWebSocket<unknown>, room: string, user: string) {
    if (!this.rooms.has(room)) {
      ws.send(JSON.stringify({ error: "Room does not exist." }));
      ws.close()
      return;
    }

    const roomData = this.rooms.get(room);
    roomData?.users.add(ws);
    this.broadcastMessage(room, `${user} has joined the room`);
  }

  removeUser(ws: ServerWebSocket<unknown>) {
    for (let [room, roomData] of this.rooms) {
      if (roomData.users.has(ws)) {
        roomData.users.delete(ws); this.broadcastMessage(room, "A user has left the room");
        if (roomData.users.size === 0) {
          this.broadcastMessage(room, "No users left, but the timer continues.");
        }
      }
    }
  }

  broadcastStudentListUpdate(room: string, studentList: StudentAttendanceDTO[]) {
    const roomData = this.rooms.get(room);
    console.log("UPDATING STUDENTLIST: ", studentList)
    if (roomData) {
      roomData.users.forEach((userWs) => {
        if (userWs) {
          userWs.send(JSON.stringify(studentList));
        }
      });
    }
  }

  broadcastMessage(room: string, message: string) {
    const roomData = this.rooms.get(room);
    if (roomData) {
      roomData.users.forEach((userWs) => {
        if (userWs) {
          userWs.send(JSON.stringify({ room, message }));
        }
      });
    }
  }

  private closeRoom(room: string) {
    const roomData = this.rooms.get(room);
    if (roomData) {
      // Disconnect all users in the room
      roomData.users.forEach((ws) => ws.close());

      // Remove the room from the map after closing
      this.rooms.delete(room);
    }
  }
}
