# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ── Stage 2: Serve static export ──────────────────────────────────────────────
FROM node:22-alpine AS production

WORKDIR /app

RUN npm install -g serve

# next build với output: 'export' xuất ra thư mục 'out'
COPY --from=builder /app/out ./out

EXPOSE 3001

CMD ["serve", "-s", "out", "-l", "3001"]
