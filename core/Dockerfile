# ==============================================================================
# Stage 1: Build Core Backend
# ==============================================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache openssl libc6-compat

# Copy package descriptors
COPY package*.json ./
COPY tsconfig*.json ./
COPY prisma ./prisma/

# Install dependencies (including devDependencies for build)
RUN npm install

# Copy application source
COPY src ./src

# Generate Prisma Client & compile TypeScript
RUN npx prisma generate
RUN npm run build

# Remove development dependencies
RUN npm prune --production

# ==============================================================================
# Stage 2: Lean Production Image
# ==============================================================================
FROM node:20-alpine AS runner

WORKDIR /app

# Security: run as non-root user
RUN apk add --no-cache openssl dumb-init libc6-compat
ENV NODE_ENV=production
ENV PORT=4000

# Copy compiled files and required assets
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

USER node

EXPOSE 4000

ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["node", "dist/server.js"]
