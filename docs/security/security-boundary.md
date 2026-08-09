# Security Boundary

The DigitalRCC portal separates public content, authenticated student workflows, administrative workflows, and protected infrastructure integrations.

## Client-Side Rules

- The browser may use the Supabase anon key with RLS-protected tables only.
- The browser must never receive service-role keys or infrastructure credentials.
- User input must be validated with Zod before privileged processing.

## Server-Side Rules

- Service-role Supabase access belongs in server-only modules.
- Privileged actions must record audit events.
- Infrastructure integrations must route through server-side handlers or the internal integration bridge.

## Database Rules

- All schema changes must use Supabase migrations.
- All user-facing tables must enable Row Level Security.
- Policies should be written around authenticated user identity and explicit portal roles.
