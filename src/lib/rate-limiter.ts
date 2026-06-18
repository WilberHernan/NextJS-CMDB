/**
 * Simple in-memory rate limiter.
 *
 * Tracks attempts per IP within a rolling window.
 * Safe for single-instance deployments (not distributed).
 */
const attempts = new Map<string, { count: number; resetAt: number }>();

export interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
}

const DEFAULT_CONFIG: RateLimitConfig = {
  maxAttempts: 5,
  windowMs: 15 * 60 * 1000, // 15 minutes
};

/**
 * Check if the given IP is rate-limited.
 * Returns `{ allowed: true }` or `{ allowed: false, remaining, resetInSeconds }`.
 */
export function checkRateLimit (
  ip: string,
  config: RateLimitConfig = DEFAULT_CONFIG
): { allowed: true } | { allowed: false; remaining: number; resetInSeconds: number } {
  const now = Date.now();
  const entry = attempts.get(ip);

  // First attempt or window expired → allow, start new window
  if (!entry || now >= entry.resetAt) {
    attempts.set(ip, { count: 1, resetAt: now + config.windowMs });
    return { allowed: true };
  }

  // Within window
  entry.count += 1;

  if (entry.count > config.maxAttempts) {
    const resetInSeconds = Math.ceil((entry.resetAt - now) / 1000);
    const remaining = config.maxAttempts - (entry.count - 1);
    return { allowed: false, remaining: Math.max(0, remaining), resetInSeconds };
  }

  return { allowed: true };
}

/**
 * Clean up stale entries to prevent memory leaks.
 * Call periodically or just let it run on process exit.
 */
export function pruneRateLimiter (): void {
  const now = Date.now();
  for (const [ip, entry] of attempts) {
    if (now >= entry.resetAt) {
      attempts.delete(ip);
    }
  }
}

// Prune stale entries every 5 minutes
setInterval(pruneRateLimiter, 5 * 60 * 1000).unref();
