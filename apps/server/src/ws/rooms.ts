import * as Y from "yjs";
import {
  applyUpdate,
  createBoardDocument,
  encodeState,
} from "@collabboard/crdt";

export interface BoardRoom {
  boardId: string;
  doc: Y.Doc;
  clients: Set<string>;
  lastPersistAt: number;
}

export class BoardRoomStore {
  private rooms = new Map<string, BoardRoom>();

  getOrCreate(boardId: string): BoardRoom {
    const existing = this.rooms.get(boardId);
    if (existing) {
      return existing;
    }
    const room: BoardRoom = {
      boardId,
      doc: createBoardDocument(),
      clients: new Set(),
      lastPersistAt: Date.now(),
    };
    this.rooms.set(boardId, room);
    return room;
  }

  get(boardId: string): BoardRoom | undefined {
    return this.rooms.get(boardId);
  }

  join(boardId: string, clientId: string): BoardRoom {
    const room = this.getOrCreate(boardId);
    room.clients.add(clientId);
    return room;
  }

  leave(boardId: string, clientId: string): void {
    const room = this.rooms.get(boardId);
    if (!room) {
      return;
    }
    room.clients.delete(clientId);
    if (room.clients.size === 0) {
      this.rooms.delete(boardId);
    }
  }

  applyRemoteUpdate(boardId: string, update: Uint8Array): BoardRoom {
    const room = this.getOrCreate(boardId);
    applyUpdate(room.doc, update);
    return room;
  }

  localUpdate(boardId: string, update: Uint8Array): Uint8Array {
    const room = this.getOrCreate(boardId);
    applyUpdate(room.doc, update);
    return encodeState(room.doc);
  }

  snapshot(boardId: string): Uint8Array {
    const room = this.getOrCreate(boardId);
    return encodeState(room.doc);
  }
}
