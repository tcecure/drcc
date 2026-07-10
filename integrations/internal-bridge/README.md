# DigitalRCC Internal Bridge

This bridge runs inside the controlled DigitalRCC environment. It polls Supabase for approved or queued provisioning jobs, claims one job at a time, and executes only allowlisted job types.

Default mode is `mock`, which simulates AWX transitions and never calls AWX.

Required environment variables:

```env
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
BRIDGE_ID=
BRIDGE_SECRET=
INTEGRATION_MODE=mock
```

Live AWX mode also needs:

```env
AWX_BASE_URL=
AWX_TOKEN=
AWX_VERIFY_TLS=true
AWX_TEMPLATE_CREATE_ACCOUNT=
AWX_TEMPLATE_ASSIGN_POD=
AWX_TEMPLATE_PROVISION_GUACAMOLE=
AWX_TEMPLATE_PROVISION_VPN=
AWX_TEMPLATE_SEED_LAB=
AWX_TEMPLATE_VERIFY_LAB=
AWX_TEMPLATE_DISABLE_ACCOUNT=
AWX_TEMPLATE_RESET_LAB=
AWX_TEMPLATE_RELEASE_POD=
```

Run one poll cycle:

```sh
npm run dev
```
