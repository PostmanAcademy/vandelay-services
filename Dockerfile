# Build stage: install production dependencies from the lockfile.
FROM oven/bun:1 AS builder
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

# Runtime stage.
FROM oven/bun:1-slim
WORKDIR /app
ENV NODE_ENV=production \
    PORT=8080
COPY --from=builder /app/node_modules ./node_modules
# Make every file world-readable regardless of its mode on the build machine, so the image also runs as a
# non-root user (a spec file with mode 600 once crashed a deployment with EACCES).
COPY --chmod=a+rX package.json tsconfig.json ./
COPY --chmod=a+rX src ./src
COPY --chmod=a+rX db ./db
COPY --chmod=a+rX vandelay-openapi ./vandelay-openapi

EXPOSE 8080
HEALTHCHECK --interval=15s --timeout=5s --retries=5 CMD bun -e "fetch('http://127.0.0.1:' + (process.env.PORT ?? 8080) + '/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"
CMD ["bun", "src/server.ts"]
