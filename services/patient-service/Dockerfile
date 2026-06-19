FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache openssl

COPY package*.json ./
COPY prisma ./prisma/

# ── Dev stage ─────────────────────────────────────────────────────────────────
FROM base AS dev
RUN npm install
RUN npx prisma generate
COPY . .
EXPOSE 3002
CMD ["npm", "run", "dev"]

# ── Production stage ──────────────────────────────────────────────────────────
FROM base AS production
RUN npm ci --omit=dev
RUN npx prisma generate
COPY . .
EXPOSE 3002
CMD ["node", "src/index.js"]
