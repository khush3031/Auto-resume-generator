# ─────────────────────────────────────────────────────────────────────────────
# ResumeForge API — Fly.io Production Image
#
# Build context: repo ROOT  (fly.toml sets dockerfile = "apps/api/Dockerfile")
# This lets Docker resolve workspace packages (@resumeforge/shared, etc.)
# ─────────────────────────────────────────────────────────────────────────────
FROM node:20-slim

WORKDIR /app

# ── System Chromium + all Puppeteer dependencies ──────────────────────────────
# Using the distro's Chromium avoids a ~300 MB puppeteer browser download.
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

# ── pnpm ──────────────────────────────────────────────────────────────────────
RUN npm install -g pnpm@9

# ── Tell Puppeteer to skip its own Chrome download & use system binary ────────
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# ── Copy workspace manifests first (better layer caching) ────────────────────
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml tsconfig.base.json .puppeteerrc.cjs ./
COPY apps/api/package.json               ./apps/api/
COPY packages/shared/package.json        ./packages/shared/
COPY packages/templates/package.json     ./packages/templates/

# Install all workspace deps.
# The postinstall script (puppeteer browsers install chrome) is suppressed
# because PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true is already set above.
RUN pnpm install --no-frozen-lockfile

# ── Copy source files ─────────────────────────────────────────────────────────
COPY apps/api/src         ./apps/api/src
COPY apps/api/tsconfig.json apps/api/nest-cli.json ./apps/api/
COPY packages/shared/src  ./packages/shared/src
COPY packages/shared/tsconfig.json ./packages/shared/
# Templates package is pre-compiled plain JS — copy the whole folder as-is
COPY packages/templates/  ./packages/templates/

# ── Build ─────────────────────────────────────────────────────────────────────
# 1. Compile shared types first (NestJS API imports from it)
RUN pnpm --filter @resumeforge/shared build

# 2. Compile the NestJS API
RUN pnpm --filter resumeforge-api build

# ── Runtime ───────────────────────────────────────────────────────────────────
ENV NODE_ENV=production

# Fly.io routes external HTTPS → internal port 8080.
# NestJS reads PORT from the env (set in fly.toml [env] block).
EXPOSE 8080

CMD ["node", "apps/api/dist/main.js"]
