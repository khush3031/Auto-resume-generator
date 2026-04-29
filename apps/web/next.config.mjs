const distDir =
  process.env.NODE_ENV === 'development' ? '.next-runtime-dev' : '.next-runtime';

function getOrigin(url, fallback) {
  try {
    return new URL(url).origin;
  } catch {
    return fallback;
  }
}

function buildContentSecurityPolicy() {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const apiOrigin = getOrigin(
    process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
    'http://localhost:3001',
  );

  const connectSources = ["'self'", apiOrigin];
  if (isDevelopment) {
    connectSources.push('ws:', 'wss:');
  }

  const scriptSources = ["'self'", "'unsafe-inline'"];
  if (isDevelopment) {
    scriptSources.push("'unsafe-eval'");
  }

  const directives = [
    `default-src 'self'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `frame-ancestors 'none'`,
    `object-src 'none'`,
    `script-src ${scriptSources.join(' ')}`,
    `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
    `font-src 'self' data: https://fonts.gstatic.com`,
    `img-src 'self' data: blob: https:`,
    `connect-src ${connectSources.join(' ')}`,
    `frame-src 'self'`,
    `worker-src 'self' blob:`,
    `manifest-src 'self'`,
  ];

  if (!isDevelopment) {
    directives.push('upgrade-insecure-requests');
  }

  return directives.join('; ');
}

const securityHeaders = [
  { key: 'Content-Security-Policy', value: buildContentSecurityPolicy() },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-DNS-Prefetch-Control', value: 'off' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  { key: 'Cross-Origin-Resource-Policy', value: 'same-site' },
  { key: 'X-UA-Compatible', value: 'IE=edge' },
  { key: 'ngrok-skip-browser-warning', value: 'true' },
];

if (process.env.NODE_ENV === 'production') {
  securityHeaders.push({
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains; preload',
  });
}

const nextConfig = {
  distDir,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**'
      }
    ]
  },
  reactStrictMode: true,

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },

  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  experimental: {
    instrumentationHook: true
  }
};

export default nextConfig;
