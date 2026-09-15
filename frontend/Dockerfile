# ==========================================
# 1. STAGE DEPS: Install dependencies
# ==========================================
FROM node:18-alpine AS deps
# Tambahkan libc6-compat karena sering dibutuhkan oleh library native Node.js di Alpine
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Salin file package
COPY package.json package-lock.json ./
# Install dependencies (ci = clean install, lebih cepat dan aman)
RUN npm ci

# ==========================================
# 2. STAGE BUILDER: Build aplikasi
# ==========================================
FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build Next.js (membutuhkan output: 'standalone' di next.config.ts)
RUN npm run build

# ==========================================
# 3. STAGE RUNNER: Production image
# ==========================================
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
# Matikan telemetri Next.js
ENV NEXT_TELEMETRY_DISABLED=1

# Buat user non-root untuk keamanan
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Salin file public dan hasil build standalone
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Gunakan user non-root
USER nextjs

# Expose port 3000
EXPOSE 3000

# Jalankan server Next.js bawaan standalone
CMD ["node", "server.js"]