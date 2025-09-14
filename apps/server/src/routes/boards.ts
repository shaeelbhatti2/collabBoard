import type { FastifyInstance } from "fastify";
import type { DbPool } from "../db/pool.js";
import { verifyAccessToken } from "../auth/tokens.js";

interface CreateBoardBody {
  workspaceId: string;
  title: string;
  description?: string;
  tags?: string[];
}

interface UpdateBoardBody {
  title?: string;
  description?: string;
  tags?: string[];
  archived?: boolean;
}

function bearerToken(request: { headers: { authorization?: string } }): string | null {
  const header = request.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return null;
  }
  return header.slice(7);
}

async function requireUser(app: FastifyInstance, request: { headers: { authorization?: string } }) {
  const token = bearerToken(request);
  if (!token) {
    return null;
  }
  return verifyAccessToken(app.ctx.config, token);
}

export async function registerBoardRoutes(app: FastifyInstance, pool: DbPool): Promise<void> {
  app.post<{ Body: CreateBoardBody }>("/boards", async (request, reply) => {
    const auth = await requireUser(app, request);
    if (!auth) {
      return reply.code(401).send({ error: "unauthorized" });
    }

    const { workspaceId, title, description, tags } = request.body;
    const result = await pool.query(
      `INSERT INTO boards (workspace_id, title, description, tags)
       VALUES ($1, $2, $3, $4)
       RETURNING id, workspace_id, title, description, tags, archived, thumbnail_url, created_at, updated_at`,
      [workspaceId, title, description ?? "", tags ?? []],
    );

    return result.rows[0];
  });

  app.get("/boards", async (request, reply) => {
    const auth = await requireUser(app, request);
    if (!auth) {
      return reply.code(401).send({ error: "unauthorized" });
    }

    const workspaceId = (request.query as { workspaceId?: string }).workspaceId;
    const params: string[] = [];
    let sql = `SELECT id, workspace_id, title, description, tags, archived, thumbnail_url, created_at, updated_at
               FROM boards WHERE archived = FALSE`;

    if (workspaceId) {
      params.push(workspaceId);
      sql += ` AND workspace_id = $1`;
    }

    sql += ` ORDER BY updated_at DESC LIMIT 100`;
    const result = await pool.query(sql, params);
    return { items: result.rows, total: result.rowCount ?? 0 };
  });

  app.get<{ Params: { boardId: string } }>("/boards/:boardId", async (request, reply) => {
    const auth = await requireUser(app, request);
    if (!auth) {
      return reply.code(401).send({ error: "unauthorized" });
    }

    const result = await pool.query(
      `SELECT id, workspace_id, title, description, tags, archived, thumbnail_url, created_at, updated_at
       FROM boards WHERE id = $1`,
      [request.params.boardId],
    );
    const row = result.rows[0];
    if (!row) {
      return reply.code(404).send({ error: "board not found" });
    }
    return row;
  });

  app.patch<{ Params: { boardId: string }; Body: UpdateBoardBody }>(
    "/boards/:boardId",
    async (request, reply) => {
      const auth = await requireUser(app, request);
      if (!auth) {
        return reply.code(401).send({ error: "unauthorized" });
      }

      const { title, description, tags, archived } = request.body;
      const result = await pool.query(
        `UPDATE boards SET
           title = COALESCE($2, title),
           description = COALESCE($3, description),
           tags = COALESCE($4, tags),
           archived = COALESCE($5, archived),
           updated_at = NOW()
         WHERE id = $1
         RETURNING id, workspace_id, title, description, tags, archived, thumbnail_url, created_at, updated_at`,
        [request.params.boardId, title ?? null, description ?? null, tags ?? null, archived ?? null],
      );
      const row = result.rows[0];
      if (!row) {
        return reply.code(404).send({ error: "board not found" });
      }
      return row;
    },
  );

  app.delete<{ Params: { boardId: string } }>("/boards/:boardId", async (request, reply) => {
    const auth = await requireUser(app, request);
    if (!auth) {
      return reply.code(401).send({ error: "unauthorized" });
    }

    await pool.query(`UPDATE boards SET archived = TRUE, updated_at = NOW() WHERE id = $1`, [
      request.params.boardId,
    ]);
    return reply.code(204).send();
  });
}
