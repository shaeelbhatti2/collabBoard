import type { FastifyInstance } from "fastify";
import type { DbPool } from "../db/pool.js";
import { verifyAccessToken } from "../auth/tokens.js";

interface CreateCommentBody {
  boardId: string;
  shapeId?: string | null;
  x?: number | null;
  y?: number | null;
  body: string;
  parentId?: string | null;
}

function bearerToken(request: { headers: { authorization?: string } }): string | null {
  const header = request.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return null;
  }
  return header.slice(7);
}

export async function registerCommentRoutes(app: FastifyInstance, pool: DbPool): Promise<void> {
  app.get<{ Params: { boardId: string } }>("/boards/:boardId/comments", async (request, reply) => {
    const token = bearerToken(request);
    if (!token || !verifyAccessToken(app.ctx.config, token)) {
      return reply.code(401).send({ error: "unauthorized" });
    }

    const result = await pool.query(
      `SELECT id, board_id, author_id, shape_id, x, y, body, resolved, parent_id, created_at, updated_at
       FROM comments WHERE board_id = $1 ORDER BY created_at ASC`,
      [request.params.boardId],
    );
    return { items: result.rows };
  });

  app.post<{ Body: CreateCommentBody }>("/comments", async (request, reply) => {
    const token = bearerToken(request);
    const auth = token ? verifyAccessToken(app.ctx.config, token) : null;
    if (!auth) {
      return reply.code(401).send({ error: "unauthorized" });
    }

    const { boardId, shapeId, x, y, body, parentId } = request.body;
    const result = await pool.query(
      `INSERT INTO comments (board_id, author_id, shape_id, x, y, body, parent_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, board_id, author_id, shape_id, x, y, body, resolved, parent_id, created_at, updated_at`,
      [boardId, auth.sub, shapeId ?? null, x ?? null, y ?? null, body, parentId ?? null],
    );
    return result.rows[0];
  });

  app.patch<{ Params: { commentId: string }; Body: { resolved?: boolean; body?: string } }>(
    "/comments/:commentId",
    async (request, reply) => {
      const token = bearerToken(request);
      if (!token || !verifyAccessToken(app.ctx.config, token)) {
        return reply.code(401).send({ error: "unauthorized" });
      }

      const { resolved, body } = request.body;
      const result = await pool.query(
        `UPDATE comments SET
           resolved = COALESCE($2, resolved),
           body = COALESCE($3, body),
           updated_at = NOW()
         WHERE id = $1
         RETURNING id, board_id, author_id, shape_id, x, y, body, resolved, parent_id, created_at, updated_at`,
        [request.params.commentId, resolved ?? null, body ?? null],
      );
      const row = result.rows[0];
      if (!row) {
        return reply.code(404).send({ error: "comment not found" });
      }
      return row;
    },
  );
}
