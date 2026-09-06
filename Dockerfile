# syntax=docker/dockerfile:1

# ─────────────────────────────────────────────────────────── deps ──
FROM node:22-bookworm-slim AS deps
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma
RUN npm ci

# ────────────────────────────────────────────────────────── build ──
FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate && npm run build && npm prune --omit=dev

# ──────────────────────────────────────────────────────── runtime ──
FROM gcr.io/distroless/nodejs22-debian12:nonroot AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/package.json ./package.json

USER nonroot
EXPOSE 3000

CMD ["dist/apps/client-api/apps/client-api/src/main.js"]
