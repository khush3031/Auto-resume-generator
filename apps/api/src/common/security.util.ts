const INSECURE_SECRET_MARKERS = new Set([
  'access-secret',
  'refresh-secret',
  'change-this-to-a-long-random-string',
  'change-this-to-a-different-long-random-string',
]);

const DEFAULT_DEVELOPMENT_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3005',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
  'http://127.0.0.1:3005',
];

export function isProductionEnvironment(nodeEnv = process.env.NODE_ENV): boolean {
  return nodeEnv === 'production';
}

export function getAllowedCorsOrigins(rawValue = process.env.CORS_ORIGINS): string[] {
  const configuredOrigins = (rawValue ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  const defaults = isProductionEnvironment()
    ? ['https://resumeforge-web.onrender.com']
    : DEFAULT_DEVELOPMENT_ORIGINS;

  return Array.from(new Set([...defaults, ...configuredOrigins]));
}

export function getJwtSecret(
  primaryValue: string | undefined,
  fallbackValue: string | undefined,
  label: string,
): string {
  const secret = primaryValue ?? fallbackValue;

  if (!secret) {
    if (isProductionEnvironment()) {
      throw new Error(`${label} is required in production`);
    }

    return `${label.toLowerCase().replace(/\s+/g, '-')}-local-dev-only`;
  }

  if (isProductionEnvironment()) {
    if (secret.length < 32 || INSECURE_SECRET_MARKERS.has(secret)) {
      throw new Error(`${label} must be at least 32 characters in production`);
    }
  }

  return secret;
}

export function shouldMountRequestTrackerDashboard(): boolean {
  return !isProductionEnvironment() || process.env.ENABLE_REQUEST_TRACKER_DASHBOARD === 'true';
}

export function shouldEnableRequestTracking(): boolean {
  return process.env.ENABLE_REQUEST_TRACKING === 'true';
}

export function shouldAllowUnsafePdfSandbox(): boolean {
  return process.env.PDF_ALLOW_UNSAFE_NO_SANDBOX === 'true';
}
