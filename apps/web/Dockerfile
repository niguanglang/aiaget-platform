FROM node:22-alpine AS build

WORKDIR /app

ARG NEXT_PUBLIC_CONTROL_API_BASE_URL
ARG NEXT_PUBLIC_RUNTIME_BASE_URL
ENV NEXT_PUBLIC_CONTROL_API_BASE_URL=$NEXT_PUBLIC_CONTROL_API_BASE_URL
ENV NEXT_PUBLIC_RUNTIME_BASE_URL=$NEXT_PUBLIC_RUNTIME_BASE_URL

RUN corepack enable

COPY . .

RUN pnpm install --frozen-lockfile
RUN pnpm --filter @aiaget/shared-types build
RUN pnpm --filter @aiaget/web build

FROM node:22-alpine AS runtime

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

COPY --from=build /app/apps/web/.next/standalone ./
COPY --from=build /app/apps/web/.next/static ./apps/web/.next/static

EXPOSE 3000

CMD ["node", "apps/web/server.js"]
