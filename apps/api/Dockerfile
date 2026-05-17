# ─────────────────────────────────────────────────────────────────────────────
# ResumeForge API — Railway / Production Docker Image
#
# Build context: repo ROOT (railway.toml sets dockerfilePath = "apps/api/Dockerfile")
# This lets Docker resolve workspace packages (@resumeforge/shared, @resumeforge/templates)
# ─────────────────────────────────────────────────────────────────────────────
FROM node:20-slim

WORKDIR /app

# ── System Chromium + all Puppeteer runtime dependencies ─────────────────────
RUN apt-get update && apt-get install -y --no-install-recommends \
      chromium \
      fonts-liberation \
      fonts-dejavu-core \
      libatk-bridge2.0-0 \
      libatk1.0-0 \
      libcairo2 \
      libcups2 \
      libdbus-1-3 \
      libdrm2 \
      libexpat1 \
      libgbm1 \
      libglib2.0-0 \
      libgtk-3-0 \
      libnspr4 \
      libnss3 \
      libpango-1.0-0 \
      libx11-6 \
      libxcb1 \
      libxcomposite1 \
      libxdamage1 \
      libxext6 \
      libxfixes3 \
      libxkbcommon0 \
      libxrandr2 \
      libxshmfence1 \
      ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# ── Install pnpm AND verify it works — all in ONE RUN so PATH is consistent ──
RUN npm install -g pnpm@9 && pnpm --version

# ── Tell Puppeteer to skip its own Chrome download & use system binary ────────
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# ── Copy workspace manifests first (better layer caching) ────────────────────
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml tsconfig.base.json .puppeteerrc.cjs ./
COPY apps/api/package.json               ./apps/api/
COPY packages/shared/package.json        ./packages/shared/
COPY packages/templates/package.json     ./packages/templates/

# ── Install all deps in ONE RUN (pnpm is already in PATH from above layer) ───
RUN pnpm install --no-frozen-lockfile

# ── Copy all source files ─────────────────────────────────────────────────────
COPY apps/api/src            ./apps/api/src
COPY apps/api/tsconfig.json  ./apps/api/
COPY apps/api/nest-cli.json  ./apps/api/
COPY packages/shared/src     ./packages/shared/src
COPY packages/shared/tsconfig.json ./packages/shared/
# Templates are pre-compiled plain JS — copy whole folder
COPY packages/templates/     ./packages/templates/

# ── Build: shared types first, then NestJS API ───────────────────────────────
RUN pnpm --filter @resumeforge/shared build
RUN pnpm --filter resumeforge-api build

# ── Runtime ───────────────────────────────────────────────────────────────────
ENV NODE_ENV=production

# Railway injects PORT automatically — NestJS reads process.env.PORT in main.ts
EXPOSE 3000

CMD ["node", "apps/api/dist/main.js"]
