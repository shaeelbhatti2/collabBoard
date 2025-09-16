export interface PresenceUser {
  id: string;
  displayName: string;
  color: string;
  cursorX: number;
  cursorY: number;
  selectionIds: string[];
  lastSeenAt: number;
}

export class PresenceRegistry {
  private sessions = new Map<string, Map<string, PresenceUser>>();

  upsert(boardId: string, user: PresenceUser): PresenceUser {
    const board = this.sessions.get(boardId) ?? new Map<string, PresenceUser>();
    const next = { ...user, lastSeenAt: Date.now() };
    board.set(user.id, next);
    this.sessions.set(boardId, board);
    return next;
  }

  list(boardId: string, maxAgeMs = 30000): PresenceUser[] {
    const board = this.sessions.get(boardId);
    if (!board) {
      return [];
    }
    const cutoff = Date.now() - maxAgeMs;
    const active: PresenceUser[] = [];
    board.forEach((session, id) => {
      if (session.lastSeenAt >= cutoff) {
        active.push(session);
        return;
      }
      board.delete(id);
    });
    return active;
  }

  remove(boardId: string, userId: string): void {
    this.sessions.get(boardId)?.delete(userId);
  }
}

export const presenceColors = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#06b6d4",
  "#3b82f6",
  "#a855f7",
  "#ec4899",
];

export function colorForUser(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i += 1) {
    hash = (hash + userId.charCodeAt(i) * 17) % presenceColors.length;
  }
  return presenceColors[hash] ?? "#3b82f6";
}
