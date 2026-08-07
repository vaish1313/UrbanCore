# ============================================================
# Gateway — Multi-stage Dockerfile
# Stage 1: deps     — install all npm dependencies
# Stage 2: build    — compile TypeScript
# Stage 3: production — minimal runtime image
# Stage 4: development — with ts-node-dev for hot reload
# ============================================================

# ─── Stage 1: Install Dependencies ──────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && \
    npm ci  # also install devDeps in a separate layer

# ─── Stage 2: Build TypeScript ───────────────────────────────
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
COPY prisma ./prisma
RUN npx prisma generate
RUN npm run build

# ─── Stage 3: Production ─────────────────────────────────────
FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production

# Copy only production dependencies
COPY package*.json ./
RUN npm ci --only=production --ignore-scripts

# Copy Prisma client and compiled output
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY prisma ./prisma

RUN addgroup -S urbancore && adduser -S urbancore -G urbancore
USER urbancore

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD wget -qO- http://localhost:3000/health || exit 1

CMD ["node", "dist/main.js"]

# ─── Stage 4: Development ────────────────────────────────────
FROM node:20-alpine AS development
WORKDIR /app
ENV NODE_ENV=development

COPY package*.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
COPY prisma ./prisma
RUN npx prisma generate

EXPOSE 3000
CMD ["npm", "run", "dev"]
