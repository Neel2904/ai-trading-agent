# Build and run with Bun (ESM + TypeScript support out of the box)
FROM oven/bun:1 AS base

WORKDIR /app

# Install dependencies first for better layer caching
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile

# Copy source
COPY . .

ENV NODE_ENV=production

# Run the trading agent loop
CMD ["bun", "index.ts"]
