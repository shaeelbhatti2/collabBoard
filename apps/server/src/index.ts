import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import { VERSION } from "@collabboard/shared";

const port = Number(process.env.PORT ?? 4000);
const host = process.env.HOST ?? "0.0.0.0";

async function main() {
  const app = Fastify({ logger: true });

  await app.register(cors, {
    origin: process.env.CORS_ORIGIN ?? true,
    credentials: true,
  });

  app.get("/health", async () => ({
    status: "ok",
    version: VERSION,
    uptime: process.uptime(),
  }));

  app.get("/", async () => ({
    name: "collabboard-api",
    version: VERSION,
  }));

  await app.listen({ port, host });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
