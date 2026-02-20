# Stage 1: Build
FROM oven/bun:1-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json bun.lock ./

# Install dependencies
RUN bun install --frozen-lockfile --production

# Copy source
COPY . .

# Build
RUN bun build src/index.ts --outdir ./dist --target=bun

# Stage 2: Production
FROM oven/bun:1-alpine AS runner

WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S tempus_bede -u 1001

# Copy built files
COPY --from=builder --chown=tempus_bede:nodejs /app/dist ./dist
COPY --from=builder --chown=tempus_bede:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=tempus_bede:nodejs /app/package.json ./

USER tempus_bede

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

CMD ["bun", "run", "dist/index.js"]