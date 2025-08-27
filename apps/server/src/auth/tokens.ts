import jwt from "jsonwebtoken";
import { createHash, randomBytes } from "node:crypto";
import type { AppConfig } from "../config.js";

export interface AccessTokenPayload {
  sub: string;
  email: string;
  type: "access";
}

export interface RefreshTokenPayload {
  sub: string;
  jti: string;
  type: "refresh";
}

export function signAccessToken(config: AppConfig, userId: string, email: string): string {
  const payload: AccessTokenPayload = { sub: userId, email, type: "access" };
  return jwt.sign(payload, config.jwtSecret, { expiresIn: config.jwtAccessTtl });
}

export function signRefreshToken(config: AppConfig, userId: string): { token: string; jti: string } {
  const jti = randomBytes(16).toString("hex");
  const payload: RefreshTokenPayload = { sub: userId, jti, type: "refresh" };
  const token = jwt.sign(payload, config.jwtSecret, { expiresIn: config.jwtRefreshTtl });
  return { token, jti };
}

export function verifyAccessToken(config: AppConfig, token: string): AccessTokenPayload | null {
  try {
    const payload = jwt.verify(token, config.jwtSecret) as AccessTokenPayload;
    if (payload.type !== "access") {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export function hashRefreshToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function refreshExpiryDate(config: AppConfig): Date {
  const raw = config.jwtRefreshTtl;
  const match = raw.match(/^(\d+)([dhms])$/);
  if (!match) {
    return new Date(Date.now() + 7 * 86400000);
  }
  const amount = Number(match[1]);
  const unit = match[2];
  const multipliers: Record<string, number> = { d: 86400000, h: 3600000, m: 60000, s: 1000 };
  return new Date(Date.now() + amount * (multipliers[unit] ?? 86400000));
}
