# DigitalRCC System Overview

DigitalRCC is organized around a public portal and authenticated operational surfaces.

## Application Boundary

- Public routes provide mission, training, cyber range, customer delivery, resources, request access, and login entry points.
- Protected routes under `/dashboard` and `/admin` are guarded by middleware and will be backed by Supabase Auth.
- Server-side route handlers and server actions own privileged operations.

## Data Boundary

- Supabase PostgreSQL is the system of record for user-facing portal data.
- Every user-facing table must be created through Supabase migrations and must enable Row Level Security.
- Supabase Storage is reserved for approved resources and user-facing assets that require policy enforcement.

## Integration Boundary

Moodle, AWX, Active Directory, VPN, Guacamole, Proxmox, and lab provisioning systems must not be called directly from the browser. Future integrations should use server-side functions or an internal bridge that can enforce authorization, auditing, rate limits, and credential isolation.
