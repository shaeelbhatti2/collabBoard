import { gzipSync, gunzipSync } from "node:zlib";
import type { FastifyInstance } from "fastify";
import type { DbPool } from "../db/pool.js";
import { verifyAccessToken } from "../auth/tokens.js";

interface CreateSnapshotBody {
  boardId: string;
  label: string;
  stateBlob: string;
  shapeCount: number;
}

function bearerToken(request: { headers: { authorization?: string } }): string | null {
  const header = request.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return null;
  }
  return header.slice(7);
}

export function compressState(raw: string): string {
  return gzipSync(Buffer.from(raw, "utf8")).toString("base64");
}

export function decompressState(encoded: string): string {
  return gunzipSync(Buffer.from(encoded, "base64")).toString("utf8");
}

export async function registerSnapshotRoutes(app: FastifyInstance, pool: DbPool): Promise<void> {
  app.get<{ Params: { boardId: string } }>("/boards/:boardId/snapshots", async (request, reply) => {
    const token = bearerToken(request);
    if (!token || !verifyAccessToken(app.ctx.config, token)) {
      return reply.code(401).send({ error: "unauthorized" });
    }

    const result = await pool.query(
      `SELECT id, board_id, label, shape_count, created_at, updated_at
       FROM board_snapshots WHERE board_id = $1 ORDER BY created_at DESC LIMIT 50`,
      [request.params.boardId],
    );
    return { items: result.rows };
  });

  app.post<{ Body: CreateSnapshotBody }>("/snapshots", async (request, reply) => {
    const token = bearerToken(request);
    if (!token || !verifyAccessToken(app.ctx.config, token)) {
      return reply.code(401).send({ error: "unauthorized" });
    }

    const { boardId, label, stateBlob, shapeCount } = request.body;
    const compressed = compressState(stateBlob);
    const result = await pool.query(
      `INSERT INTO board_snapshots (board_id, label, state_blob, shape_count)
       VALUES ($1, $2, $3, $4)
       RETURNING id, board_id, label, shape_count, created_at, updated_at`,
      [boardId, label, compressed, shapeCount],
    );
    return result.rows[0];
  });

  app.get<{ Params: { snapshotId: string } }>("/snapshots/:snapshotId", async (request, reply) => {
    const token = bearerToken(request);
    if (!token || !verifyAccessToken(app.ctx.config, token)) {
      return reply.code(401).send({ error: "unauthorized" });
    }

    const result = await pool.query(
      `SELECT id, board_id, label, state_blob, shape_count, created_at, updated_at
       FROM board_snapshots WHERE id = $1`,
      [request.params.snapshotId],
    );
    const row = result.rows[0];
    if (!row) {
      return reply.code(404).send({ error: "snapshot not found" });
    }
    return {
      ...row,
      stateBlob: decompressState(row.state_blob),
    };
  });
}
