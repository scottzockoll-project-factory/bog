/**
 * Mock WebSocket server for local development.
 * Mimics the goofenet WS service: clients join rooms and messages
 * are broadcast to all other members of the same room.
 *
 * Usage:
 *   npx tsx scripts/ws-mock.ts
 */

import { WebSocketServer, WebSocket } from "ws";

const PORT = 8787;
const API_KEY = "dev";

/** All connected sockets, keyed by room name. */
const rooms = new Map<string, Set<WebSocket>>();

const wss = new WebSocketServer({ port: PORT });

wss.on("connection", (socket, req) => {
  const url = new URL(req.url ?? "", `ws://localhost:${PORT}`);
  const key = url.searchParams.get("key");

  if (key !== API_KEY) {
    socket.close(1008, "Invalid API key");
    return;
  }

  let currentRoom: string | null = null;

  socket.on("message", (raw) => {
    let msg: { event?: string; room?: string; data?: unknown };
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      return;
    }

    if (msg.event === "join" && typeof msg.room === "string") {
      currentRoom = msg.room;
      if (!rooms.has(currentRoom)) rooms.set(currentRoom, new Set());
      rooms.get(currentRoom)!.add(socket);
      console.log(`[ws-mock] socket joined room "${currentRoom}" (${rooms.get(currentRoom)!.size} members)`);
      return;
    }

    if (!currentRoom) return;

    // Broadcast to all other sockets in the same room.
    const members = rooms.get(currentRoom);
    if (!members) return;

    const outgoing = JSON.stringify({ event: msg.event, data: msg.data });
    for (const member of members) {
      if (member !== socket && member.readyState === WebSocket.OPEN) {
        member.send(outgoing);
      }
    }
  });

  socket.on("close", () => {
    if (currentRoom) {
      rooms.get(currentRoom)?.delete(socket);
      console.log(`[ws-mock] socket left room "${currentRoom}"`);
    }
  });
});

console.log(`[ws-mock] listening on ws://localhost:${PORT}`);
