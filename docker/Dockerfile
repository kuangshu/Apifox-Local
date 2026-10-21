FROM node:22-alpine AS base

WORKDIR /app

# corepack 的 pnpm 本体与 pnpm store 都走缓存挂载，lockfile 变动时也不用重下
RUN corepack enable pnpm
ENV PNPM_HOME=/pnpm
ENV PATH="/pnpm:$PATH"
RUN mkdir -p /pnpm/store

# 依赖安装：这一层只由 package.json + pnpm-lock.yaml 决定，
# 依赖不变时无论改多少次业务代码都命中缓存，0 秒
FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,id=apifox-pnpm-store,target=/pnpm/store \
    --mount=type=cache,id=apifox-corepack,target=/root/.cache/node/corepack \
    pnpm install --frozen-lockfile --store-dir=/pnpm/store

# 构建：唯一随业务代码变化的层
FROM deps AS builder
COPY . .
RUN pnpm build

# runner 只装运行时依赖（dependencies），devDependencies 不进镜像
FROM base AS prod-deps
COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,id=apifox-pnpm-store,target=/pnpm/store \
    --mount=type=cache,id=apifox-corepack,target=/root/.cache/node/corepack \
    pnpm install --frozen-lockfile --prod --store-dir=/pnpm/store

FROM base AS runner

ENV NODE_ENV=production

# node_modules 来自 prod-deps：由 lockfile 决定，改业务代码时命中缓存不再重拷
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=builder /app/build ./build
COPY --from=builder /app/package.json ./

EXPOSE 3000

# 直接跑 bin.js，runner 不再依赖 pnpm/corepack
CMD ["node", "node_modules/@react-router/serve/bin.js", "./build/server/index.js"]
