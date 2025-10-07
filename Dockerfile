# --------------------------------------------
# Base image
# --------------------------------------------
FROM node:22-alpine AS base

# Instalar dependências do sistema necessárias
RUN apk add --no-cache libc6-compat openssl

WORKDIR /app

# --------------------------------------------
# Dependencies stage
# --------------------------------------------
FROM base AS deps

# Copiar package.json, package-lock.json e Prisma schema
COPY package.json package-lock.json* ./
COPY prisma ./prisma

  # Instalar apenas dependências de produção
  RUN npm ci --omit=dev

# --------------------------------------------
# Builder stage
# --------------------------------------------
FROM base AS builder

WORKDIR /app

# Copiar node_modules de produção
COPY --from=deps /app/node_modules ./node_modules

# Copiar package.json e prisma para dev install
COPY package.json package-lock.json* ./
COPY prisma ./prisma

# Instalar dev dependencies (TypeScript, ts-node, etc)
RUN npm install

# Copiar todo o código da aplicação
COPY . .

# Gerar cliente Prisma e build da aplicação
RUN npx prisma generate
RUN npm run build

# --------------------------------------------
# Runner stage (produção)
# --------------------------------------------
FROM base AS runner

WORKDIR /app

ENV NODE_ENV=production

# Criar usuário não-root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 fastify

# Copiar arquivos necessários do builder
COPY --from=builder --chown=fastify:nodejs /app/dist ./dist
COPY --from=builder --chown=fastify:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=fastify:nodejs /app/package.json ./package.json
COPY --from=builder --chown=fastify:nodejs /app/prisma ./prisma

# Usar usuário não-root
USER fastify

# Expor porta
EXPOSE 3000
ENV PORT=3000
ENV HOST=0.0.0.0

# Health check (removido para economizar recursos)
# HEALTHCHECK --interval=60s --timeout=3s --start-period=5s --retries=2 \
#   CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start da aplicação
CMD ["npm", "run", "start"]
  