import { describe, it, expect, beforeEach } from "vitest";
import { checkRateLimit, pruneRateLimiter } from "./rate-limiter";

// Helper: force window to be tiny so we can test expiry
const FAST_CONFIG = { maxAttempts: 3, windowMs: 200 };

describe("checkRateLimit", () => {
  beforeEach(() => {
    pruneRateLimiter();
  });

  it("allows first attempt", () => {
    const result = checkRateLimit("1.2.3.4", FAST_CONFIG);
    expect(result).toEqual({ allowed: true });
  });

  it("allows up to maxAttempts", () => {
    const ip = "5.6.7.8";
    expect(checkRateLimit(ip, FAST_CONFIG)).toEqual({ allowed: true });
    expect(checkRateLimit(ip, FAST_CONFIG)).toEqual({ allowed: true });
    expect(checkRateLimit(ip, FAST_CONFIG)).toEqual({ allowed: true });
  });

  it("blocks after maxAttempts", () => {
    const ip = "9.10.11.12";
    checkRateLimit(ip, FAST_CONFIG); // 1
    checkRateLimit(ip, FAST_CONFIG); // 2
    checkRateLimit(ip, FAST_CONFIG); // 3
    const result = checkRateLimit(ip, FAST_CONFIG); // 4 — blocked
    expect(result.allowed).toBe(false);
    if (!result.allowed) {
      expect(result.remaining).toBe(0);
      expect(result.resetInSeconds).toBeGreaterThan(0);
    }
  });

  it("tracks different IPs independently", () => {
    const ip1 = "1.1.1.1";
    const ip2 = "2.2.2.2";

    checkRateLimit(ip1, FAST_CONFIG);
    checkRateLimit(ip1, FAST_CONFIG);
    checkRateLimit(ip1, FAST_CONFIG);

    // ip1 blocked
    expect(checkRateLimit(ip1, FAST_CONFIG).allowed).toBe(false);

    // ip2 still fine
    expect(checkRateLimit(ip2, FAST_CONFIG).allowed).toBe(true);
  });

  it("resets after window expires", async () => {
    const ip = "50.60.70.80";
    const FAST_MS = 100;
    const config = { maxAttempts: 2, windowMs: FAST_MS };

    checkRateLimit(ip, config);
    checkRateLimit(ip, config);
    expect(checkRateLimit(ip, config).allowed).toBe(false);

    // Wait for window to expire
    await new Promise((r) => setTimeout(r, FAST_MS + 50));
    pruneRateLimiter();

    const result = checkRateLimit(ip, config);
    expect(result).toEqual({ allowed: true });
  });
});
