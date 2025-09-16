import type { FastifyInstance } from "fastify";
import { colorForUser, PresenceRegistry } from "./registry.js";

interface PresenceUpdateBody {
  boardId: string;
  userId: string;
  displayName: string;
  cursorX: number;
  cursorY: number;
  selectionIds?: string[];
}

export async function registerPresenceRoutes(
  app: FastifyInstance,
  registry: PresenceRegistry,
): Promise<void> {
  app.post<{ Body: PresenceUpdateBody }>("/presence/heartbeat", async (request) => {
    const { boardId, userId, displayName, cursorX, cursorY, selectionIds } = request.body;
    const session = registry.upsert(boardId, {
      id: userId,
      displayName,
      color: colorForUser(userId),
      cursorX,
      cursorY,
      selectionIds: selectionIds ?? [],
      lastSeenAt: Date.now(),
    });
    return session;
  });

  app.get<{ Params: { boardId: string } }>("/presence/:boardId", async (request) => {
    return { users: registry.list(request.params.boardId) };
  });

  app.delete<{ Params: { boardId: string; userId: string } }>(
    "/presence/:boardId/:userId",
    async (request, reply) => {
      registry.remove(request.params.boardId, request.params.userId);
      return reply.code(204).send();
    },
  );
}
