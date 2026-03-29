FROM node:24-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY astro.config.ts ./astro.config.ts
COPY package.json ./package.json
COPY tsconfig.json ./tsconfig.json
COPY public ./public
COPY src ./src
RUN pnpm build

FROM base AS runtime
COPY --from=build --chown=node:node /app/dist ./dist
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/package.json ./package.json
USER node
EXPOSE 4321
CMD ["node_modules/.bin/astro", "preview", "--host", "0.0.0.0", "--port", "4321"]
