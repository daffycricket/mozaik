# syntax=docker/dockerfile:1

FROM node:24-slim AS build
RUN corepack enable
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/config/package.json packages/config/
COPY packages/model/package.json packages/model/
COPY apps/server/package.json apps/server/
COPY apps/web/package.json apps/web/
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm --filter @mozaik/web build

FROM node:24-slim AS runtime
ENV NODE_ENV=production
ENV STATIC_DIR=/app/apps/web/dist
WORKDIR /app
COPY --from=build /app /app
EXPOSE 3001
CMD ["node", "--import", "tsx", "apps/server/src/index.ts"]
