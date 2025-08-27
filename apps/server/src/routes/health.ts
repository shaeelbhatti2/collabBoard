import type { FastifyInstance } from "fastify";
import { VERSION } from "@collabboard/shared";

const startedAt = Date.now();

export interface HealthStatus {
  status: "ok" | "degraded";
  version: string;
  uptimeSeconds: number;
  checks: {
    database: "unknown" | "ok" | "fail";
    redis: "unknown" | "ok" | "fail";
  };
}

export async function registerHealthRoutes(app: FastifyInstance): Promise<void> {
  app.get("/health", async () => {
    const status: HealthStatus = {
      status: "ok",
      version: VERSION,
      uptimeSeconds: Math.floor((Date.now() - startedAt) / 1000),
      checks: {
        database: "unknown",
        redis: "unknown",
      },
    };
    return status;
  });

  app.get("/health/live", async () => ({ alive: true }));

  app.get("/health/ready", async () => ({
    ready: true,
    version: VERSION,
  }));
}
