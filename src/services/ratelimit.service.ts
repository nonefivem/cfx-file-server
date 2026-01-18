import { config } from "../config";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

class RateLimitService {
  private requests = new Map<string, RateLimitEntry>();

  isAllowed(ip: string): boolean {
    if (!config.rateLimit.enabled) return true;

    const now = Date.now();
    const entry = this.requests.get(ip);

    if (!entry || now >= entry.resetAt) {
      this.requests.set(ip, {
        count: 1,
        resetAt: now + config.rateLimit.windowMs
      });
      return true;
    }

    if (entry.count >= config.rateLimit.maxRequests) {
      return false;
    }

    entry.count++;
    return true;
  }

  getRemainingRequests(ip: string): number {
    const entry = this.requests.get(ip);
    if (!entry || Date.now() >= entry.resetAt) {
      return config.rateLimit.maxRequests;
    }
    return Math.max(0, config.rateLimit.maxRequests - entry.count);
  }

  getResetTime(ip: string): number {
    const entry = this.requests.get(ip);
    if (!entry || Date.now() >= entry.resetAt) {
      return 0;
    }
    return Math.ceil((entry.resetAt - Date.now()) / 1000);
  }

  cleanup(): void {
    const now = Date.now();
    for (const [ip, entry] of this.requests) {
      if (now >= entry.resetAt) {
        this.requests.delete(ip);
      }
    }
  }
}

export const rateLimitService = new RateLimitService();

// Cleanup expired entries every minute
setInterval(() => rateLimitService.cleanup(), 60000);
