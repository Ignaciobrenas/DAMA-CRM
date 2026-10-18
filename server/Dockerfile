# Dockerfile for DAMA-CRM Server Backend API
FROM node:20-alpine

# Install openssl for Prisma runtime compatibility on Alpine
RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

# Copy dependency specifications and Prisma schema
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies and generate Prisma client
RUN npm ci
RUN npx prisma generate

# Copy source code and build TypeScript to dist/
COPY . .
RUN npm run build

EXPOSE 4000

# Run database migrations and start production server
CMD ["npm", "run", "start"]
