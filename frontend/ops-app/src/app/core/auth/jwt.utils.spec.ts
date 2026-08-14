import { describe, expect, it } from 'vitest';
import { isJwtExpired } from './jwt.utils';

function createUnsignedToken(exp: number): string {
  const payload = btoa(JSON.stringify({ sub: 'user-id', exp }))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
  return `header.${payload}.signature`;
}

describe('isJwtExpired', () => {
  const now = Date.UTC(2026, 7, 14, 12, 0, 0);

  it('keeps a token that remains valid beyond the clock tolerance', () => {
    const token = createUnsignedToken(Math.floor(now / 1000) + 60);
    expect(isJwtExpired(token, now)).toBe(false);
  });

  it('rejects an expired token and a token inside the clock tolerance', () => {
    expect(isJwtExpired(createUnsignedToken(Math.floor(now / 1000) - 1), now)).toBe(true);
    expect(isJwtExpired(createUnsignedToken(Math.floor(now / 1000) + 20), now)).toBe(true);
  });

  it('rejects malformed tokens or tokens without an expiration', () => {
    expect(isJwtExpired('not-a-jwt', now)).toBe(true);
    expect(isJwtExpired('header.e30.signature', now)).toBe(true);
  });
});
