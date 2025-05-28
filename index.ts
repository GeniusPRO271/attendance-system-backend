import api from "./api";
import type { WebSocketStartRoomData } from "./api/dto/ws";
import { RoomManager } from "./api/roomManager";

export const roomManager = new RoomManager();
Bun.serve({
  port: 3001,
  websocket: {
    open(ws) {
      console.log("User connected: ", ws.data)
      const data = ws.data as WebSocketStartRoomData
      roomManager.startRoom(ws, data.attendanceProcess, data.user)
    },
    message(ws, data) {

      console.log("data:", data)
      if (Buffer.isBuffer(data)) {
        console.log("isBuffer return")
        return
      }

      const { attendanceProcess, user }: WebSocketStartRoomData = JSON.parse(data);
      roomManager.startRoom(ws, attendanceProcess, user)
    },

    close(ws) {
      roomManager.removeUser(ws);
      console.log("Client disconnected");
    },
  },
  fetch(req, server) {
    const url = new URL(req.url);
    const queryParams = Object.fromEntries(url.searchParams.entries());
    const data: WebSocketStartRoomData = {
      attendanceProcess: queryParams.attendanceProcess,
      user: queryParams.user
    };

    if (server.upgrade(req, { data })) {
      console.log("request for the websocket")
      return;
    }
    console.log("request for the api")
    return api.fetch(req)
  },
})
