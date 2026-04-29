import { SetMetadata } from '@nestjs/common';

export type RateLimitOptions = {
  limit: number;
  ttlMs: number;
  keyPrefix?: string;
};

export const RATE_LIMIT_METADATA_KEY = 'resumeForgeRateLimit';

export const RateLimit = (options: RateLimitOptions) =>
  SetMetadata(RATE_LIMIT_METADATA_KEY, options);
