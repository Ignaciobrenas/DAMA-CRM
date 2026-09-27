import { Request, Response, NextFunction } from 'express';

interface RateLimitOptions {
  windowMs: number; // Time window in milliseconds
  max: number;      // Max number of requests allowed in window
  message?: string; // Custom error message
}

interface RequestRecord {
  count: number;
  resetTime: number;
}

// In-memory store for rate limiting by IP + Key
const hitStore = new Map<string, RequestRecord>();

// Cleanup stale records every 10 minutes to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of hitStore.entries()) {
    if (now > record.resetTime) {
      hitStore.delete(key);
    }
  }
}, 10 * 60 * 1000).unref();

/**
 * Enterprise In-Memory Rate Limiter Middleware
 * Protects auth & critical endpoints from brute-force & denial of service.
 */
export function rateLimiter(options: RateLimitOptions) {
  const {
    windowMs,
    max,
    message = 'Demasiadas solicitudes desde esta dirección IP. Por favor, inténtelo de nuevo más tarde.',
  } = options;

  return (req: Request, res: Response, next: NextFunction): void => {
    // Disable rate limiting during automated integration tests
    if (process.env.NODE_ENV === 'test') {
      return next();
    }

    const ip = req.ip || (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown-ip';
    const key = `${ip}:${req.baseUrl}${req.path}`;
    const now = Date.now();

    const record = hitStore.get(key);

    if (!record || now > record.resetTime) {
      // Create or reset window
      hitStore.set(key, {
        count: 1,
        resetTime: now + windowMs,
      });
      res.setHeader('X-RateLimit-Limit', max);
      res.setHeader('X-RateLimit-Remaining', max - 1);
      return next();
    }

    // Window active
    record.count += 1;
    const remaining = Math.max(0, max - record.count);
    const retryAfterSeconds = Math.ceil((record.resetTime - now) / 1000);

    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', remaining);

    if (record.count > max) {
      res.setHeader('Retry-After', retryAfterSeconds);
      res.status(429).json({
        success: false,
        message,
        retryAfterSeconds,
      });
      return;
    }

    next();
  };
}
