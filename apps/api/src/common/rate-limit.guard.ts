import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request, Response } from 'express';
import {
  RATE_LIMIT_METADATA_KEY,
  RateLimitOptions,
} from './rate-limit.decorator';

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, RateLimitBucket>();

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const options = this.reflector.getAllAndOverride<RateLimitOptions | undefined>(
      RATE_LIMIT_METADATA_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!options) {
      return true;
    }

    const http = context.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();

    const subject = this.getSubject(request);
    const scope =
      options.keyPrefix ??
      `${request.method}:${request.route?.path ?? request.originalUrl}`;
    const bucketKey = `${scope}:${subject}`;
    const now = Date.now();

    this.compactExpiredBuckets(now);

    const bucket = buckets.get(bucketKey);
    const activeBucket =
      bucket && bucket.resetAt > now
        ? bucket
        : { count: 0, resetAt: now + options.ttlMs };

    activeBucket.count += 1;
    buckets.set(bucketKey, activeBucket);

    const remaining = Math.max(options.limit - activeBucket.count, 0);
    response.setHeader('RateLimit-Limit', options.limit.toString());
    response.setHeader('RateLimit-Remaining', remaining.toString());
    response.setHeader(
      'RateLimit-Reset',
      Math.ceil(activeBucket.resetAt / 1000).toString(),
    );

    if (activeBucket.count > options.limit) {
      throw new HttpException(
        `Too many requests. Try again in ${Math.ceil(
          (activeBucket.resetAt - now) / 1000,
        )} seconds.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }

  private getSubject(request: Request): string {
    const userId = (request.user as { sub?: string } | undefined)?.sub;
    if (userId) return `user:${userId}`;

    const forwardedFor = request.headers['x-forwarded-for'];
    const ipFromHeader = Array.isArray(forwardedFor)
      ? forwardedFor[0]
      : forwardedFor?.split(',')[0];
    const ip = ipFromHeader?.trim() || request.ip || 'unknown';
    return `ip:${ip}`;
  }

  private compactExpiredBuckets(now: number) {
    if (buckets.size < 5000) return;

    for (const [key, bucket] of buckets.entries()) {
      if (bucket.resetAt <= now) {
        buckets.delete(key);
      }
    }
  }
}
