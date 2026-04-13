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

  // Enable the instrumentation hook (apps/web/instrumentation.ts)
  // This runs server-side fetch logging for Next.js → NestJS calls.
  experimental: {
    instrumentationHook: true
  }
};
export default nextConfig;
