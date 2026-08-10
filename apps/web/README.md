# DigitalRCC Lab Companion Web App

This is the Next.js App Router application for the `my.digitalrcc.com` lab companion.

## Feature Notes

- `app/` contains the lab companion request, queue, active lab, guide, support, dashboard, admin, and route handler surfaces.
- `components/atoms`, `components/molecules`, `components/organisms`, and `components/templates` follow Atomic Design.
- `lib/supabase` contains browser, server, and service-role Supabase client factories.
- `lib/validation` contains Zod schemas for environment and form validation.
- `middleware.ts` contains protected route scaffolding for `/dashboard` and `/admin`.

## Verification

Run from the repository root:

```bash
npm run verify
```

Run from this app:

```bash
npm run verify
```
