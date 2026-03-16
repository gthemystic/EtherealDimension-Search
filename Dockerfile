# --- Stage 1: Dependencies ---
FROM node:22-alpine AS deps
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# --- Stage 2: Build ---
FROM node:22-alpine AS builder
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build args for env vars at build time
ARG PERPLEXITY_API_KEY
ARG GROQ_API_KEY
ARG GITHUB_PAT_TOKEN
ARG FIRECRAWL_API_KEY
ARG NEO4J_URI=bolt://neo4j:7687
ARG NEO4J_USER=neo4j
ARG NEO4J_PASSWORD=etherealdimension
ARG N8N_WEBHOOK_URL=http://n8n:5678
ARG REDIS_URL=redis://redis:6379

ENV PERPLEXITY_API_KEY=$PERPLEXITY_API_KEY
ENV GROQ_API_KEY=$GROQ_API_KEY
ENV GITHUB_PAT_TOKEN=$GITHUB_PAT_TOKEN
ENV FIRECRAWL_API_KEY=$FIRECRAWL_API_KEY
ENV NEO4J_URI=$NEO4J_URI
ENV NEO4J_USER=$NEO4J_USER
ENV NEO4J_PASSWORD=$NEO4J_PASSWORD
ENV N8N_WEBHOOK_URL=$N8N_WEBHOOK_URL
ENV REDIS_URL=$REDIS_URL

RUN pnpm build

# --- Stage 3: Production ---
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
