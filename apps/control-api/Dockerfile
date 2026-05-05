FROM node:22-alpine AS build

WORKDIR /app

RUN corepack enable

COPY . .

RUN pnpm install --frozen-lockfile
RUN pnpm --filter @aiaget/control-api exec prisma generate --schema prisma/schema.prisma
RUN pnpm --filter @aiaget/shared-types build
RUN pnpm --filter @aiaget/control-api build

FROM node:22-alpine AS runtime

WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /app /app

EXPOSE 3001

CMD ["node", "apps/control-api/dist/main.js"]
