# ─────────────────────────────────────────────────────────────────────────────
# Auth Service — Multi-Stage Dockerfile
# ─────────────────────────────────────────────────────────────────────────────

FROM node:20-alpine AS base
WORKDIR /app

# Install openssl for Prisma on Alpine
RUN apk add --no-cache openssl

COPY package*.json ./
COPY prisma ./prisma/

# ── Dev stage: all dependencies (prod + dev) for hot reload ──────────────────
FROM base AS dev
RUN npm ci
RUN npx prisma generate
COPY . .
EXPOSE 3001
CMD ["npm", "run", "dev"]

# ── Production stage: lean image with prod dependencies only ─────────────────
FROM base AS production
RUN npm ci --omit=dev
RUN npx prisma generate
COPY . .
EXPOSE 3001
CMD ["node", "src/index.js"]
