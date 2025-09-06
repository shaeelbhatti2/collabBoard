import { Redis } from "ioredis";
import type { AppConfig } from "../config.js";

export type RedisClient = Redis;

export function createRedisClient(config: AppConfig): RedisClient {
  return new Redis(config.redisUrl, {
    maxRetriesPerRequest: 3,
    lazyConnect: true,
  });
}

export async function checkRedis(client: RedisClient): Promise<boolean> {
  try {
    if (client.status !== "ready") {
      await client.connect();
    }
    const pong = await client.ping();
    return pong === "PONG";
  } catch {
    return false;
  }
}

export function boardChannel(boardId: string): string {
  return `board:${boardId}:updates`;
}

export async function publishBoardUpdate(
  client: RedisClient,
  boardId: string,
  payload: Buffer,
): Promise<void> {
  await client.publish(boardChannel(boardId), payload);
}

export function subscribeBoardUpdates(
  client: RedisClient,
  boardId: string,
  handler: (payload: Buffer) => void,
): () => void {
  const sub = client.duplicate();
  const channel = boardChannel(boardId);

  void sub.connect().then(() => sub.subscribe(channel));
  sub.on("message", (_ch, message) => {
    handler(Buffer.from(message, "binary"));
  });

  return () => {
    void sub.unsubscribe(channel).then(() => sub.quit());
  };
}
