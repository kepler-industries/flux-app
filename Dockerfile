# syntax=docker/dockerfile:1.7
# Multi-stage build for @flux/api — Node 20 + pnpm + Prisma + Hono.
# Built from the repo root: `docker build -f apps/api/Dockerfile .`
ARG NODE_VERSION=20.18.0

# -------- deps stage --------
FROM node:${NODE_VERSION}-bookworm-slim AS deps
RUN apt-get update -y \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
RUN corepack enable && corepack prepare pnpm@9.12.0 --activate
WORKDIR /repo
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY apps/api/package.json apps/api/
COPY packages/db/package.json packages/db/
COPY packages/shared/package.json packages/shared/
RUN pnpm install --frozen-lockfile || pnpm install

# -------- build stage --------
FROM node:${NODE_VERSION}-bookworm-slim AS build
RUN apt-get update -y \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
RUN corepack enable && corepack prepare pnpm@9.12.0 --activate
WORKDIR /repo
COPY --from=deps /repo/node_modules ./node_modules
COPY --from=deps /repo/apps/api/node_modules ./apps/api/node_modules
COPY --from=deps /repo/packages/db/node_modules ./packages/db/node_modules
COPY --from=deps /repo/packages/shared/node_modules ./packages/shared/node_modules
COPY . .
# Workspace symlinks created in `deps` only saw package.json; re-link now that
# the actual sources are in place.
RUN pnpm install --frozen-lockfile --offline || pnpm install --offline || pnpm install
# Build shared packages first — `@flux/api` resolves them via package.json
# `main` (./dist/index.js), which must exist before tsc runs against the API.
RUN pnpm --filter @flux/db build
RUN pnpm --filter @flux/shared build
RUN pnpm --filter @flux/api build

# -------- runtime stage --------
FROM node:${NODE_VERSION}-bookworm-slim AS runtime
RUN apt-get update -y \
  && apt-get install -y --no-install-recommends openssl ca-certificates curl \
  && rm -rf /var/lib/apt/lists/*
ENV NODE_ENV=production
ENV PORT=3000
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9.12.0 --activate

# Copy installed deps and built sources
COPY --from=build /repo/node_modules ./node_modules
COPY --from=build /repo/apps/api/node_modules ./apps/api/node_modules
COPY --from=build /repo/packages/db ./packages/db
COPY --from=build /repo/packages/shared ./packages/shared
COPY --from=build /repo/apps/api/dist ./apps/api/dist
COPY --from=build /repo/apps/api/package.json ./apps/api/package.json
COPY --from=build /repo/package.json ./package.json
COPY --from=build /repo/pnpm-workspace.yaml ./pnpm-workspace.yaml

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD curl -fsS http://localhost:${PORT}/health || exit 1

CMD ["sh", "-c", "pnpm --filter @flux/db exec prisma migrate deploy && node apps/api/dist/index.js"]
