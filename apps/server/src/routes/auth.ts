import type { FastifyInstance, FastifyRequest } from "fastify";
import type { DbPool } from "../db/pool.js";
import { findUserByEmail, findUserById, createUser, storeRefreshToken, revokeRefreshToken, findValidRefreshToken } from "../db/pool.js";
import { hashPassword, verifyPassword } from "./password.js";
import {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  hashRefreshToken,
  refreshExpiryDate,
} from "./tokens.js";

interface RegisterBody {
  email: string;
  password: string;
  displayName: string;
}

interface LoginBody {
  email: string;
  password: string;
}

interface RefreshBody {
  refreshToken: string;
}

function bearerToken(request: FastifyRequest): string | null {
  const header = request.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return null;
  }
  return header.slice(7);
}

export async function registerAuthRoutes(app: FastifyInstance, pool: DbPool): Promise<void> {
  app.post<{ Body: RegisterBody }>("/auth/register", async (request, reply) => {
    const { email, password, displayName } = request.body;
    if (!email || !password || !displayName) {
      return reply.code(400).send({ error: "email, password, and displayName required" });
    }

    const existing = await findUserByEmail(pool, email);
    if (existing) {
      return reply.code(409).send({ error: "email already registered" });
    }

    const passwordHash = await hashPassword(password);
    const user = await createUser(pool, { email, displayName, passwordHash });
    const accessToken = signAccessToken(app.ctx.config, user.id, user.email);
    const refresh = signRefreshToken(app.ctx.config, user.id);
    await storeRefreshToken(pool, user.id, hashRefreshToken(refresh.token), refreshExpiryDate(app.ctx.config));

    return {
      user: {
        id: user.id,
        email: user.email,
        displayName: user.display_name,
      },
      accessToken,
      refreshToken: refresh.token,
    };
  });

  app.post<{ Body: LoginBody }>("/auth/login", async (request, reply) => {
    const { email, password } = request.body;
    const user = await findUserByEmail(pool, email);
    if (!user) {
      return reply.code(401).send({ error: "invalid credentials" });
    }

    const valid = await verifyPassword(user.password_hash, password);
    if (!valid) {
      return reply.code(401).send({ error: "invalid credentials" });
    }

    const accessToken = signAccessToken(app.ctx.config, user.id, user.email);
    const refresh = signRefreshToken(app.ctx.config, user.id);
    await storeRefreshToken(pool, user.id, hashRefreshToken(refresh.token), refreshExpiryDate(app.ctx.config));

    return {
      user: {
        id: user.id,
        email: user.email,
        displayName: user.display_name,
      },
      accessToken,
      refreshToken: refresh.token,
    };
  });

  app.post<{ Body: RefreshBody }>("/auth/refresh", async (request, reply) => {
    const tokenHash = hashRefreshToken(request.body.refreshToken);
    const row = await findValidRefreshToken(pool, tokenHash);
    if (!row) {
      return reply.code(401).send({ error: "invalid refresh token" });
    }

    const user = await findUserById(pool, row.user_id);
    if (!user) {
      return reply.code(401).send({ error: "user not found" });
    }

    await revokeRefreshToken(pool, tokenHash);
    const accessToken = signAccessToken(app.ctx.config, user.id, user.email);
    const refresh = signRefreshToken(app.ctx.config, user.id);
    await storeRefreshToken(pool, user.id, hashRefreshToken(refresh.token), refreshExpiryDate(app.ctx.config));

    return { accessToken, refreshToken: refresh.token };
  });

  app.get("/auth/me", async (request, reply) => {
    const token = bearerToken(request);
    if (!token) {
      return reply.code(401).send({ error: "missing token" });
    }

    const payload = verifyAccessToken(app.ctx.config, token);
    if (!payload) {
      return reply.code(401).send({ error: "invalid token" });
    }

    const user = await findUserByEmail(pool, payload.email);
    if (!user) {
      return reply.code(404).send({ error: "user not found" });
    }

    return {
      id: user.id,
      email: user.email,
      displayName: user.display_name,
      avatarUrl: user.avatar_url,
    };
  });
}
