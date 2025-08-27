import type { FastifyBaseLogger } from "fastify";

export interface Logger {
  info: (msg: string, meta?: Record<string, unknown>) => void;
  warn: (msg: string, meta?: Record<string, unknown>) => void;
  error: (msg: string, meta?: Record<string, unknown>) => void;
  child: (bindings: Record<string, unknown>) => Logger;
}

export function wrapFastifyLogger(log: FastifyBaseLogger): Logger {
  return {
    info: (msg, meta) => log.info(meta ?? {}, msg),
    warn: (msg, meta) => log.warn(meta ?? {}, msg),
    error: (msg, meta) => log.error(meta ?? {}, msg),
    child: (bindings) => wrapFastifyLogger(log.child(bindings)),
  };
}

export function createStartupLogger(): Logger {
  const write = (level: string, msg: string, meta?: Record<string, unknown>) => {
    const line = JSON.stringify({ level, msg, ...meta, ts: new Date().toISOString() });
    if (level === "error") {
      console.error(line);
      return;
    }
    console.log(line);
  };

  return {
    info: (msg, meta) => write("info", msg, meta),
    warn: (msg, meta) => write("warn", msg, meta),
    error: (msg, meta) => write("error", msg, meta),
    child: (bindings) => ({
      info: (msg, meta) => write("info", msg, { ...bindings, ...meta }),
      warn: (msg, meta) => write("warn", msg, { ...bindings, ...meta }),
      error: (msg, meta) => write("error", msg, { ...bindings, ...meta }),
      child: (b) => createStartupLogger().child({ ...bindings, ...b }),
    }),
  };
}
