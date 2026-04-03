FROM node:20-slim AS base
RUN corepack enable && corepack prepare pnpm@10.8.1 --activate
RUN npm i -g turbo@^2
WORKDIR /app

# --- prune: 대상 앱의 의존성만 추출 ---
FROM base AS pruner
COPY . .
ARG APP
RUN turbo prune @home-coffing/${APP} --docker

# --- install: 의존성 설치 (lockfile + package.json만, 캐시 극대화) ---
FROM base AS installer
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
RUN pnpm install --frozen-lockfile

# --- build: 소스 복사 + 빌드 ---
FROM base AS builder
COPY --from=installer /app/ .
COPY --from=pruner /app/out/full/ .
ARG APP
RUN turbo run build --filter=@home-coffing/${APP}

# --- runner ---
FROM node:20-slim AS runner
RUN corepack enable && corepack prepare pnpm@10.8.1 --activate
WORKDIR /app
COPY --from=builder /app/ .

ARG APP
ENV APP=${APP}
WORKDIR /app/apps/${APP}

CMD ["sh", "-c", "if [ \"$APP\" = \"api\" ]; then pnpm schema:update && node dist/main; else pnpm start; fi"]
