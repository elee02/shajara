# Build stage
FROM node:24-alpine AS builder

WORKDIR /app

# Install native compilation dependencies for SQLite
RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm ci

COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN npm run build

# Production stage
FROM node:24-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Install runtime dependencies for better-sqlite3 if needed
RUN apk add --no-cache libc6-compat

# Create data directory for persistent SQLite database
RUN mkdir -p /app/data && chown -R node:node /app/data

# Copy built standalone server and static assets
COPY --from=builder --chown=node:node /app/public ./public
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static

USER node

EXPOSE 3000

VOLUME ["/app/data"]

CMD ["node", "server.js"]
