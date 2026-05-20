# Flux

A local-first, modern, customizable personal-expense tracker.

Flux lets you track expenses, configure recurring charges, define budgets, and
manage **virtual "Flux accounts"** — clones of your real-world accounts (current,
savings, "vacation pot", etc.) that you fund and spend from manually. Flux does
**not** connect to your bank: you stay in control of every entry.

## Highlights

- **Local-first.** All data lives in the device. Authentication is optional and
  only used to back up / restore.
- **Virtual accounts.** Model your wallet however you want — one checking account,
  five savings pots, a wedding-fund cagnotte: same primitive, infinite uses.
- **Recurring expenses.** Name, categorise, attach to a source account, and pick
  any cadence — `every-5th-of-the-month`, `every 2 weeks`, `every 3 days`, with
  an optional end date or remaining-occurrence count.
- **Budgets.** Per-category monthly envelopes with progress visualisation.
- **Auth (optional).** Better Auth — Email, Apple, Google.

## Monorepo layout

```
flux-app/
├── apps/
│   ├── api/          Hono + Prisma + Better Auth REST API (deployed to Coolify)
│   └── mobile/       Expo React Native app with shadcn-style UI (react-native-reusables)
├── packages/
│   ├── db/           Prisma schema + generated client (shared)
│   └── shared/       Zod schemas + shared TypeScript types
├── docker-compose.yml   Local Postgres + API
└── pnpm-workspace.yaml
```

## Stack

- **Front-end** — Expo SDK 53 (React Native 0.76), Expo Router, NativeWind,
  [react-native-reusables](https://reactnativereusables.com) (shadcn/ui for RN),
  expo-sqlite for local-first storage, expo-secure-store for tokens.
- **Back-end** — Hono on Node 20, Prisma 5 + Postgres, Better Auth 1.3
  (Email + Google + Apple), Zod validation.
- **Deployment** — Dockerfile + docker-compose for local dev, Coolify for prod
  at <https://flux-api.kepler-industries.com>.

## Quick start

```bash
pnpm install
cp .env.example .env

# Local Postgres + API (Docker)
docker compose up -d db
pnpm prisma:migrate
pnpm dev:api

# Mobile (in another shell)
cp apps/mobile/.env.example apps/mobile/.env
pnpm dev:mobile
```

## Production

The API ships as a single Docker image (see `apps/api/Dockerfile`). On Coolify it
runs alongside a managed Postgres instance; migrations run automatically on boot
via `pnpm prisma:deploy`.

## Accessibility

Typography sized for one-handed reading (16 px minimum), AA contrast on every
surface, focus rings & ≥ 44 × 44 hit targets, and full screen-reader labels on
interactive controls.
