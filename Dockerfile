# ============================================================================
# Zumra.shop (زُمرة) — Multi-Stage Production Dockerfile
# Lead Architect: Khaled (DevOps Lead) & Aya (Chief Architect)
# ============================================================================

# ----------------------------------------------------------------------------
# Stage 1: Build & Compilation Stage
# ----------------------------------------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

# Copy package descriptors
COPY package*.json ./

# Install all dependencies (including devDependencies for tsc build)
RUN npm ci

# Copy source code and scripts
COPY tsconfig.json ./
COPY src/ ./src/
COPY scripts/ ./scripts/

# Build TypeScript to dist/
RUN npm run build

# ----------------------------------------------------------------------------
# Stage 2: Production Runtime Stage
# ----------------------------------------------------------------------------
FROM node:20-alpine AS runner

WORKDIR /usr/src/app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

# Install curl for health check
RUN apk add --no-linux-headers --no-cache curl

# Copy package descriptors
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy compiled JavaScript output from builder stage
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/scripts ./scripts

# Create non-root user for security harding
RUN addgroup -S zumragroup && adduser -S zumra -G zumragroup \
    && chown -R zumra:zumragroup /usr/src/app

USER zumra

EXPOSE 3000

# Health check probe
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

CMD ["node", "dist/index.js"]
