const nextConfig = {
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
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-UA-Compatible',        value: 'IE=edge' },
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
