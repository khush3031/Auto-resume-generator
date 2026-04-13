/**
 * request-tracker-pro — NestJS middleware wrapper
 *
 * Adapters used:
 *  1. logging-only  → prints every request to console (NestJS Logger format)
 *  2. mongodb       → persists to `request_tracker_logs` collection (30-day TTL)
 *
 * Usage:
 *  - Apply via AppModule.configure()  (tracks all incoming requests)
 *  - Call mountDashboard() in main.ts (mounts /request-tracker UI)
 */

import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response, NextFunction } from 'express';

import {
  RequestTrackerMiddleware,
  setupRequestTracker,
  LogLevel,
} from 'request-tracker-pro';

const logger = new Logger('RequestTracker');

/** Winston-compatible shim that routes to NestJS Logger */
const nestLoggerShim = {
  info:  (msg: string) => logger.log(msg),
  warn:  (msg: string) => logger.warn(msg),
  error: (msg: string) => logger.error(msg),
};

/**
 * Build the shared tracker options once so both the middleware
 * and the dashboard use the exact same adapter configuration.
 */
function buildOptions(mongoUri: string) {
  return {
    trackHeaders:     false,   // keep logs clean — no header dumps
    trackBody:        false,
    trackQueryParams: true,
    excludedPaths:    ['/health', '/favicon.ico'],
    maskSensitiveFields: ['password', 'token', 'apiKey', 'secret', 'refreshToken'],

    storage: {
      adapters: [
        // ── Adapter 1: logging-only ──────────────────────────────────────────
        // Prints one line per request to the NestJS logger.
        {
          type:   'logging-only' as const,
          format: 'text'        as const,
          level:  LogLevel.INFO,
          logger: nestLoggerShim,
        },

        // ── Adapter 2: mongodb ───────────────────────────────────────────────
        // Persists every request to the `request_tracker_logs` collection.
        // Documents are auto-deleted after 30 days (TTL index).
        {
          type:       'mongodb' as const,
          uri:        mongoUri,
          collection: 'request_tracker_logs',
          ttlDays:    30,
        },
      ],
    },

    onRequest: (data: { method: string; path: string; statusCode: number; duration: number }) => {
      // Extra structured log so grep / log-shipping can pick it up
      logger.log(
        `${data.method} ${data.path} → ${data.statusCode} (${data.duration}ms)`,
        'HTTP',
      );
    },
  };
}

// ─── Singleton instance — built once on first injection ───────────────────────
let _mw: { use(req: Request, res: Response, next: NextFunction): void } | null = null;
let _opts: ReturnType<typeof buildOptions> | null = null;

@Injectable()
export class RequestTrackerNestMiddleware implements NestMiddleware {
  constructor(private readonly config: ConfigService) {
    if (!_mw) {
      const mongoUri =
        this.config.get<string>('MONGODB_URI') ||
        'mongodb://localhost:27017/resumeforge';
      _opts = buildOptions(mongoUri);
      _mw = new RequestTrackerMiddleware(_opts);
      logger.log(
        'Initialised — adapters: logging-only + mongodb',
        'RequestTracker',
      );
    }
  }

  use(req: Request, res: Response, next: NextFunction) {
    _mw!.use(req, res, next);
  }
}

/**
 * Call this in main.ts AFTER `await app.listen()` to mount:
 *   GET /request-tracker          → live dashboard UI
 *   GET /admin/request-tracker/*  → JSON API endpoints
 */
export function mountRequestTrackerDashboard(
  expressApp: ReturnType<typeof import('express')>,
  mongoUri: string,
) {
  if (!_opts) {
    _opts = buildOptions(mongoUri);
  }
  setupRequestTracker(expressApp, _opts);
  logger.log(
    'Dashboard mounted → http://localhost/request-tracker',
    'RequestTracker',
  );
}
