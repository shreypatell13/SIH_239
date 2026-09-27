import bcrypt from "bcryptjs";

const BCRYPT_ROUNDS = 12;

/**
 * Server-only password hashing utility using bcrypt.
 * Enforces a minimum cost factor of 12.
 */
export async function hashPassword(plainText: string): Promise<string> {
  if (!plainText || typeof plainText !== "string") {
    throw new Error("Password must be a non-empty string");
  }
  const salt = await bcrypt.genSalt(BCRYPT_ROUNDS);
  return bcrypt.hash(plainText, salt);
}

/**
 * Synchronous version for deterministic seeding scripts.
 */
export function hashPasswordSync(plainText: string): string {
  if (!plainText || typeof plainText !== "string") {
    throw new Error("Password must be a non-empty string");
  }
  const salt = bcrypt.genSaltSync(BCRYPT_ROUNDS);
  return bcrypt.hashSync(plainText, salt);
}

/**
 * Verifies a plaintext password against a stored bcrypt hash.
 */
export async function verifyPassword(
  plainText: string,
  hash: string | null | undefined
): Promise<boolean> {
  if (!plainText || !hash) {
    return false;
  }
  try {
    return await bcrypt.compare(plainText, hash);
  } catch {
    return false;
  }
}
