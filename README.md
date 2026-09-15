# Eskişehirspor App

Official Eskişehirspor fan application monorepo. Phase 0 is the foundation only: five-tab mobile shell, design system, auth/profile, identity tables, and an admin access shell.

This is not a news, live-score, forum, or XP product yet.

## Apps

- `apps/mobile` — Expo SDK 57, Expo Router
- `apps/admin` — Next.js admin shell
- `packages/shared` — roles, analytics names, XP action key types, zod schemas
- `supabase/migrations` — `profiles` and `user_roles` with default-deny RLS

## Prerequisites

- Node.js 22.13+
- pnpm 11+
- A Supabase project (Auth + this migration) for real sign-in

## Setup

```bash
pnpm install
cp apps/mobile/.env.example apps/mobile/.env
cp apps/admin/.env.local.example apps/admin/.env.local
```

Fill **anon** keys only. Never put the service-role key in mobile or `NEXT_PUBLIC_*`.

Apply the identity migration with the Supabase CLI against your project:

```bash
supabase link
supabase db push
```

## Scripts

```bash
pnpm dev:mobile
pnpm dev:admin
pnpm typecheck
pnpm lint
pnpm test
pnpm format:check
```

## Start commands

Mobile:

```bash
pnpm --filter @eskisehirspor/mobile start
```

Admin:

```bash
pnpm --filter @eskisehirspor/admin dev
```

## Auth providers

Email/password is implemented. Apple and Google are **architected but disabled** until Supabase providers and native credentials exist. See `packages/shared/src/auth-providers.ts`.

## Security

Roles are stored in `user_roles`. Clients cannot grant roles. Admin authorization is session + RLS-readable own roles, resolved with `resolveAdminAccess`.
