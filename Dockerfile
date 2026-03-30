FROM node:24-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY astro.config.ts ./astro.config.ts
COPY package.json ./package.json
COPY tsconfig*.json ./
COPY public ./public
COPY src ./src
RUN corepack enable && pnpm build

FROM nginxinc/nginx-unprivileged:1.27-alpine AS runtime
COPY --from=build --chmod=755 /app/dist /usr/share/nginx/html
COPY docker/nginx/default.conf /etc/nginx/conf.d/default.conf
USER 101
EXPOSE 4321
CMD ["nginx", "-g", "daemon off;"]
