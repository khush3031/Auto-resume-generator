const distDir =
  process.env.NODE_ENV === 'development' ? '.next-runtime-dev' : '.next-runtime';

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
        headers: [
          { key: 'X-Content-Type-Options',    value: 'nosniff' },
          { key: 'X-UA-Compatible',           value: 'IE=edge' },
          // Tells ngrok to skip its browser warning page for all requests
          // (needed so crawlers like opengraph.xyz reach the actual app)
          { key: 'ngrok-skip-browser-warning', value: 'true' },
        ],
      },
    ];
  },

  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // Enable the instrumentation hook (apps/web/instrumentation.ts)
  // This runs server-side fetch logging for Next.js → NestJS calls.
  experimental: {
    instrumentationHook: true
  }
};
export default nextConfig;
