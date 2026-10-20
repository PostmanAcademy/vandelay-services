# Build stage: install production dependencies from the lockfile.
FROM oven/bun:1 AS builder
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

# Runtime stage. Every file is world-readable so the image also runs as a non-root user.
FROM oven/bun:1-slim
WORKDIR /app
ENV NODE_ENV=production \
    PORT=8080
COPY --from=builder /app/node_modules ./node_modules
COPY --chmod=a+rX package.json tsconfig.json ./
COPY --chmod=a+rX src ./src

EXPOSE 8080
HEALTHCHECK --interval=15s --timeout=5s --retries=5 CMD bun -e "fetch('http://127.0.0.1:' + (process.env.PORT ?? 8080) + '/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"
CMD ["bun", "src/server.ts"]
