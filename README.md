# DigitalRCC Portal

DigitalRCC is the Digital Resilience Community Clinic Portal: a unified public website, student portal, administrative portal, resource library, training approval system, Moodle enrollment manager, cyber range waitlist, and lab provisioning controller.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui
- Supabase Auth, PostgreSQL, Storage, and Row Level Security
- Zod and React Hook Form
- Vitest and Playwright

## Repository Layout

```text
apps/web
supabase/migrations
supabase/seed
docs/architecture
docs/security
docs/workflows
```

The current implementation keeps the web app in `apps/web` so the portal can grow into additional apps or services without moving the first production surface.

## Environment

Copy `.env.example` to `apps/web/.env.local` for local development.

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_URL=
```

Never expose `SUPABASE_SERVICE_ROLE_KEY` in client code. Infrastructure systems such as Moodle, AWX, Active Directory, VPN, Guacamole, and lab controllers must only be reached by server-side code or an internal integration bridge.

## Commands

```bash
npm run dev
npm run lint
npm run typecheck
npm run test
npm run test:e2e
npm run build
npm run verify
```

`npm run verify` runs linting, TypeScript checking, unit tests, and a production build.

## Sprint 0 Status

- Base Next.js application shell is implemented.
- Placeholder public and protected routes are present.
- Supabase browser, server, and service-role clients are scaffolded.
- Protected route middleware redirects unauthenticated users when Supabase env vars are configured.
- Health endpoint is available at `/api/health`.
- Supabase migrations and seed directories are ready for future database changes.
