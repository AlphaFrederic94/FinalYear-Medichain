FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./

# ── Dev stage: all dependencies (prod + dev) for hot reload ──────────────────
FROM base AS dev
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]

# ── Production stage: production dependencies only ────────────────────────────
FROM base AS production
RUN npm install --omit=dev
COPY . .
EXPOSE 3000
CMD ["node", "src/index.js"]
