import type { FastifyInstance } from "fastify";
import type { AppConfig } from "../config.js";
import type { DbPool } from "../db/pool.js";
import type { RedisClient } from "../redis/client.js";
import type { Logger } from "../logger.js";
import { registerAuthRoutes } from "./auth.js";
import { registerBoardRoutes } from "./boards.js";
import { registerCommentRoutes } from "./comments.js";
import { registerHealthRoutes } from "./health.js";
import { registerPresenceRoutes } from "./presence.js";
import { registerSnapshotRoutes } from "./snapshots.js";
import { registerWebSocketGateway } from "../ws/gateway.js";
import type { BoardRoomStore } from "../ws/rooms.js";
import type { PresenceRegistry } from "../presence/registry.js";

export interface AppContext {
  config: AppConfig;
  log: Logger;
  db: DbPool;
  redis: RedisClient;
  rooms: BoardRoomStore;
  presence: PresenceRegistry;
}

export async function buildApp(app: FastifyInstance, ctx: AppContext): Promise<void> {
  app.decorate("ctx", ctx);

  app.addHook("onRequest", async (request) => {
    request.log.info({ path: request.url, method: request.method }, "request");
  });

  app.get("/", async () => ({
    name: "collabboard-api",
    version: "0.1.0",
    env: ctx.config.nodeEnv,
  }));

  await registerHealthRoutes(app);
  await registerAuthRoutes(app, ctx.db);
  await registerBoardRoutes(app, ctx.db);
  await registerCommentRoutes(app, ctx.db);
  await registerSnapshotRoutes(app, ctx.db);
  await registerPresenceRoutes(app, ctx.presence);
  await registerWebSocketGateway(app, ctx.redis, ctx.rooms);
}

declare module "fastify" {
  interface FastifyInstance {
    ctx: AppContext;
  }
}
