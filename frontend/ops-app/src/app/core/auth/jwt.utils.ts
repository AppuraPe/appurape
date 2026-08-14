const DEFAULT_CLOCK_SKEW_SECONDS = 30;

export function isJwtExpired(
  token: string,
  nowMilliseconds = Date.now(),
  clockSkewSeconds = DEFAULT_CLOCK_SKEW_SECONDS,
): boolean {
  try {
    const parts = token.split('.');
    if (parts.length !== 3 || !parts[1]) {
      return true;
    }

    const normalizedPayload = parts[1]
      .replace(/-/g, '+')
      .replace(/_/g, '/')
      .padEnd(Math.ceil(parts[1].length / 4) * 4, '=');
    const payload = JSON.parse(globalThis.atob(normalizedPayload)) as { exp?: unknown };

    if (typeof payload.exp !== 'number' || !Number.isFinite(payload.exp)) {
      return true;
    }

    return payload.exp * 1000 <= nowMilliseconds + clockSkewSeconds * 1000;
  } catch {
    return true;
  }
}
