/**
 * Server Security Middleware.
 *
 * Implements:
 * - In-memory IP rate limiting
 * - Security response headers
 * - Sanitized error handling with zero credential / stack trace leakage
 */

import { Request, Response, NextFunction } from 'express';
import { EvaluationErrorCode } from '../../core';

export interface RateLimiterOptions {
  windowMs?: number; // default: 60,000 (1 minute)
  maxRequests?: number; // default: 60 requests per minute
}

interface ClientRecord {
  count: number;
  resetTime: number;
}

export function createRateLimiter(options: RateLimiterOptions = {}) {
  const windowMs = options.windowMs ?? 60000;
  const maxRequests = options.maxRequests ?? 60;
  const clients = new Map<string, ClientRecord>();

  // Cleanup expired client records periodically
  const cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [ip, record] of clients.entries()) {
      if (now > record.resetTime) {
        clients.delete(ip);
      }
    }
  }, Math.max(windowMs, 30000));

  // Unref interval to allow clean process exit in tests
  if (cleanupInterval.unref) {
    cleanupInterval.unref();
  }

  return function rateLimiterMiddleware(req: Request, res: Response, next: NextFunction) {
    const ip = req.ip || req.socket.remoteAddress || 'unknown-client';
    const now = Date.now();

    let client = clients.get(ip);
    if (!client || now > client.resetTime) {
      client = {
        count: 1,
        resetTime: now + windowMs,
      };
      clients.set(ip, client);
    } else {
      client.count += 1;
    }

    const remaining = Math.max(0, maxRequests - client.count);
    const resetSeconds = Math.ceil((client.resetTime - now) / 1000);

    res.setHeader('RateLimit-Limit', maxRequests);
    res.setHeader('RateLimit-Remaining', remaining);
    res.setHeader('RateLimit-Reset', resetSeconds);

    if (client.count > maxRequests) {
      return res.status(429).json({
        success: false,
        error: {
          code: EvaluationErrorCode.RATE_LIMITED,
          message: 'Too many evaluation requests. Please slow down and try again.',
          statusCode: 429,
        },
      });
    }

    next();
  };
}

export function securityHeadersMiddleware(_req: Request, res: Response, next: NextFunction) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
}

export function sanitizedErrorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  // Check for body-parser payload size limit exceeded
  const errObj = err as Record<string, unknown>;
  if (errObj?.type === 'entity.too.large' || errObj?.status === 413) {
    return res.status(413).json({
      success: false,
      error: {
        code: EvaluationErrorCode.PAYLOAD_TOO_LARGE,
        message: 'Request payload exceeds maximum allowed size (100KB).',
        statusCode: 413,
      },
    });
  }

  // Check for invalid JSON syntax in request body
  if (err instanceof SyntaxError && 'body' in err) {
    return res.status(400).json({
      success: false,
      error: {
        code: EvaluationErrorCode.INVALID_REQUEST,
        message: 'Malformed JSON payload in request body.',
        statusCode: 400,
      },
    });
  }

  const statusCode = typeof errObj?.status === 'number' ? errObj.status : 500;
  return res.status(statusCode).json({
    success: false,
    error: {
      code: EvaluationErrorCode.INTERNAL_ERROR,
      message: 'An unexpected internal error occurred.',
      statusCode,
    },
  });
}
