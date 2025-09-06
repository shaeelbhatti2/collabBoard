import type { FastifyInstance } from "fastify";
import websocket from "@fastify/websocket";
import { randomUUID } from "node:crypto";
import type { RedisClient } from "../redis/client.js";
import { publishBoardUpdate, subscribeBoardUpdates } from "../redis/client.js";
import { BoardRoomStore } from "./rooms.js";

interface SyncMessage {
  type: "sync-step1" | "sync-step2" | "update" | "ping" | "pong";
  boardId?: string;
  payload?: number[];
}

function parseMessage(raw: Buffer | ArrayBuffer | Buffer[]): SyncMessage | null {
  try {
    const text = Buffer.isBuffer(raw) ? raw.toString("utf8") : Buffer.from(raw as ArrayBuffer).toString("utf8");
    return JSON.parse(text) as SyncMessage;
  } catch {
    return null;
  }
}

function encodeMessage(message: SyncMessage): string {
  return JSON.stringify(message);
}

export async function registerWebSocketGateway(
  app: FastifyInstance,
  redis: RedisClient,
  rooms: BoardRoomStore,
): Promise<void> {
  await app.register(websocket);

  app.get("/ws", { websocket: true }, (socket, request) => {
    const clientId = randomUUID();
    let boardId: string | null = null;
    let unsubscribe: (() => void) | null = null;

    socket.on("message", (raw) => {
      const message = parseMessage(raw);
      if (!message) {
        return;
      }

      if (message.type === "ping") {
        socket.send(encodeMessage({ type: "pong" }));
        return;
      }

      if (!message.boardId) {
        return;
      }

      if (boardId !== message.boardId) {
        if (unsubscribe) {
          unsubscribe();
        }
        boardId = message.boardId;
        rooms.join(boardId, clientId);
        unsubscribe = subscribeBoardUpdates(redis, boardId, (payload) => {
          socket.send(
            encodeMessage({
              type: "update",
              boardId,
              payload: Array.from(payload),
            }),
          );
        });
      }

      if (message.type === "sync-step1") {
        const snapshot = rooms.snapshot(message.boardId);
        socket.send(
          encodeMessage({
            type: "sync-step2",
            boardId: message.boardId,
            payload: Array.from(snapshot),
          }),
        );
        return;
      }

      if (message.type === "update" && message.payload) {
        const update = Uint8Array.from(message.payload);
        rooms.applyRemoteUpdate(message.boardId, update);
        void publishBoardUpdate(redis, message.boardId, Buffer.from(update));
      }
    });

    socket.on("close", () => {
      if (boardId) {
        rooms.leave(boardId, clientId);
      }
      if (unsubscribe) {
        unsubscribe();
      }
    });

    request.log.info({ clientId }, "ws connected");
  });
}
