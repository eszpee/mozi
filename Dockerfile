# syntax=docker/dockerfile:1

# Build stage: install, typecheck, unit-test, build. A failing check or test
# fails the image build, so a broken commit can never be deployed.
FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json .npmrc ./
# --ignore-scripts: better-sqlite3 ships prebuilt binaries (incl. linuxmusl); no toolchain needed.
RUN npm ci --ignore-scripts
COPY . .
RUN npm run check \
 && npx vitest run \
 && npm run build \
 && npm prune --omit=dev

FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000 \
    DATABASE_URL=/data/mozi.db \
    MIGRATIONS_DIR=/app/drizzle
COPY --from=build /app/build ./build
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/drizzle ./drizzle
COPY package.json ./
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s \
  CMD wget -qO- http://127.0.0.1:3000/healthz || exit 1
CMD ["node", "build"]
