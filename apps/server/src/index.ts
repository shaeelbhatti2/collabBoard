import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import { loadConfig } from "./config.js";
import { createPool } from "./db/pool.js";
import { createStartupLogger, wrapFastifyLogger } from "./logger.js";
import { createRedisClient } from "./redis/client.js";
import { BoardRoomStore } from "./ws/rooms.js";
import { buildApp } from "./app.js";

async function main() {
  const config = loadConfig();
  const startupLog = createStartupLogger();

  const app = Fastify({
    logger: {
      level: config.nodeEnv === "production" ? "info" : "debug",
    },
  });

  await app.register(cors, {
    origin: config.corsOrigin,
    credentials: true,
  });

  const db = createPool(config);
  const redis = createRedisClient(config);
  const rooms = new BoardRoomStore();
  const log = wrapFastifyLogger(app.log);
  await buildApp(app, { config, log, db, redis, rooms });

  await app.listen({ port: config.port, host: config.host });
  startupLog.info("server listening", { port: config.port, host: config.host });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
