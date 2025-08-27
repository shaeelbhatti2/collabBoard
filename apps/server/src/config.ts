export interface AppConfig {
  nodeEnv: string;
  port: number;
  host: string;
  corsOrigin: string | boolean;
  databaseUrl: string;
  redisUrl: string;
  jwtSecret: string;
  jwtAccessTtl: string;
  jwtRefreshTtl: string;
}

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

export function loadConfig(): AppConfig {
  const nodeEnv = process.env.NODE_ENV ?? "development";
  const corsRaw = process.env.CORS_ORIGIN;

  return {
    nodeEnv,
    port: Number(process.env.PORT ?? 4000),
    host: process.env.HOST ?? "0.0.0.0",
    corsOrigin: corsRaw ?? (nodeEnv === "development" ? true : required("CORS_ORIGIN")),
    databaseUrl: process.env.DATABASE_URL ?? "postgresql://collab:collab@localhost:5432/collabboard",
    redisUrl: process.env.REDIS_URL ?? "redis://localhost:6379",
    jwtSecret: process.env.JWT_SECRET ?? "dev-secret-change-me",
    jwtAccessTtl: process.env.JWT_ACCESS_TTL ?? "15m",
    jwtRefreshTtl: process.env.JWT_REFRESH_TTL ?? "7d",
  };
}
