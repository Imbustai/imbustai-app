# syntax=docker/dockerfile:1
FROM node:22-slim AS builder
RUN corepack enable
WORKDIR /app

# Build-time public vars (Next inlines NEXT_PUBLIC_* at build).
# Coolify passes env vars marked "Available at Build" as --build-arg.
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL \
    NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY \
    NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
    NEXT_TELEMETRY_DISABLED=1

# Whole workspace install (website deps live in the root package.json).
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm nx build website

FROM node:22-slim AS runner
RUN corepack enable
WORKDIR /app
ENV NODE_ENV=production PORT=3000 NEXT_TELEMETRY_DISABLED=1
# Simplest reliable runtime for this monorepo: ship the built workspace and
# start via nx. (Optimization for later: switch to Next `output: 'standalone'`
# and copy only apps/website/.next/standalone — smaller image.)
COPY --from=builder /app ./
EXPOSE 3000
CMD ["pnpm", "nx", "start", "website"]
