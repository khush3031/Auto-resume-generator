# ResumeForge

ResumeForge is a production-grade, SEO-optimized resume builder web application scaffolded as a pnpm monorepo.

## Overview

- **Frontend:** Next.js 14 App Router, SSR, Server Components
- **Backend:** NestJS REST API with modular architecture
- **Database:** MongoDB + Mongoose
- **Styling:** Tailwind CSS + shadcn/ui ready structure
- **Auth:** NextAuth.js (Google + Email/OTP planned)
- **Resume templates:** 8 professional HTML templates with placeholders
- **PDF export:** backend Puppeteer endpoint

## Project Layout

- `/apps/web` — Next.js frontend
- `/apps/api` — NestJS backend
- `/packages/shared` — shared types and DTOs
- `/packages/templates` — reusable HTML resume templates

## Local Setup

1. Install dependencies:
   ```bash
   pnpm install
   ```
2. Copy environment variables:
   ```bash
   cp .env.example .env
   ```
3. Start local development:
   ```bash
   pnpm dev
   ```
4. Visit:
   - Frontend: `http://localhost:3000`
   - API: `http://localhost:4000`

## Phase 1 Roadmap

- [x] Browse resume templates
- [x] Template filter by style
- [x] Builder with live preview
- [x] Resume save and fetch endpoints
- [x] PDF export endpoint
- [x] SEO pages, sitemap, robots
- [ ] Phase 2: uploads, cloud storage, auth enhancements
- [ ] Phase 3: team sharing, user dashboards

## Tech Stack

- `next` 14
- `react` 18
- `nest` 10
- `mongoose`
- `tailwindcss`
- `next-auth`
- `puppeteer`
- `pnpm`
- `turbo`

## Notes

The backend includes separate collections for `resume` and `userResume`. `resume` stores sample data, while `userResume` holds user-created progress.
