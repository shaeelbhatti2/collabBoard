import type { FastifyInstance } from "fastify";
import type { AppConfig } from "../config.js";
import type { DbPool } from "../db/pool.js";
import type { Logger } from "../logger.js";
import { registerAuthRoutes } from "./auth.js";
import { registerHealthRoutes } from "./health.js";

export interface AppContext {
  config: AppConfig;
  log: Logger;
  db: DbPool;
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
}

declare module "fastify" {
  interface FastifyInstance {
    ctx: AppContext;
  }
}
