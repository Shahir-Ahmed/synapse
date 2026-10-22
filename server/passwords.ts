import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

const SCRYPT_PREFIX = 'scrypt';
const SALT_BYTES = 16;
const KEY_BYTES = 64;

export function isPasswordHash(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const [prefix, salt, hash, ...extra] = value.split('$');
  if (prefix !== SCRYPT_PREFIX || !salt || !hash || extra.length > 0) return false;

  try {
    return Buffer.from(salt, 'base64url').length === SALT_BYTES &&
      Buffer.from(hash, 'base64url').length === KEY_BYTES;
  } catch {
    return false;
  }
}

export function hashPassword(password: string): string {
  const salt = randomBytes(SALT_BYTES);
  const derivedKey = scryptSync(password, salt, KEY_BYTES);
  return `${SCRYPT_PREFIX}$${salt.toString('base64url')}$${derivedKey.toString('base64url')}`;
}

export function verifyPassword(password: string, storedValue: string): boolean {
  if (isPasswordHash(storedValue)) {
    const [, encodedSalt, encodedHash] = storedValue.split('$');
    const salt = Buffer.from(encodedSalt, 'base64url');
    const expected = Buffer.from(encodedHash, 'base64url');
    const actual = scryptSync(password, salt, expected.length);
    return timingSafeEqual(actual, expected);
  }

  // Temporary compatibility for legacy stores that saved raw passwords.
  // MemoryStore migrates these values to scrypt hashes during startup.
  const actual = Buffer.from(password, 'utf8');
  const expected = Buffer.from(storedValue, 'utf8');
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
