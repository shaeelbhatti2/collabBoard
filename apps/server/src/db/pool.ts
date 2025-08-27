import pg from "pg";
import type { AppConfig } from "../config.js";

const { Pool } = pg;

export type DbPool = pg.Pool;

export function createPool(config: AppConfig): DbPool {
  return new Pool({ connectionString: config.databaseUrl });
}

export async function checkDatabase(pool: DbPool): Promise<boolean> {
  try {
    const result = await pool.query("SELECT 1 AS ok");
    return result.rows[0]?.ok === 1;
  } catch {
    return false;
  }
}

export interface DbUser {
  id: string;
  email: string;
  display_name: string;
  password_hash: string;
  avatar_url: string | null;
  created_at: Date;
  updated_at: Date;
}

export async function findUserById(pool: DbPool, id: string): Promise<DbUser | null> {
  const result = await pool.query<DbUser>(
    "SELECT id, email, display_name, password_hash, avatar_url, created_at, updated_at FROM users WHERE id = $1",
    [id],
  );
  return result.rows[0] ?? null;
}

export async function findUserByEmail(pool: DbPool, email: string): Promise<DbUser | null> {
  const result = await pool.query<DbUser>(
    "SELECT id, email, display_name, password_hash, avatar_url, created_at, updated_at FROM users WHERE email = $1",
    [email.toLowerCase()],
  );
  return result.rows[0] ?? null;
}

export async function createUser(
  pool: DbPool,
  input: { email: string; displayName: string; passwordHash: string },
): Promise<DbUser> {
  const result = await pool.query<DbUser>(
    `INSERT INTO users (email, display_name, password_hash)
     VALUES ($1, $2, $3)
     RETURNING id, email, display_name, password_hash, avatar_url, created_at, updated_at`,
    [input.email.toLowerCase(), input.displayName, input.passwordHash],
  );
  const row = result.rows[0];
  if (!row) {
    throw new Error("Failed to create user");
  }
  return row;
}

export async function storeRefreshToken(
  pool: DbPool,
  userId: string,
  tokenHash: string,
  expiresAt: Date,
): Promise<void> {
  await pool.query(
    "INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)",
    [userId, tokenHash, expiresAt],
  );
}

export async function revokeRefreshToken(pool: DbPool, tokenHash: string): Promise<void> {
  await pool.query("UPDATE refresh_tokens SET revoked = TRUE WHERE token_hash = $1", [tokenHash]);
}

export async function findValidRefreshToken(
  pool: DbPool,
  tokenHash: string,
): Promise<{ user_id: string } | null> {
  const result = await pool.query<{ user_id: string }>(
    `SELECT user_id FROM refresh_tokens
     WHERE token_hash = $1 AND revoked = FALSE AND expires_at > NOW()`,
    [tokenHash],
  );
  return result.rows[0] ?? null;
}
