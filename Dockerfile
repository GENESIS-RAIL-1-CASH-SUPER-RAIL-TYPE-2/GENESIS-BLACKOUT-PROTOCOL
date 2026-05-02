# Multi-stage TypeScript build.
# Builder compiles src -> dist; final image carries only production deps + dist.
# Replaces "COPY dist/" pattern that broke when dist/ was gitignored (2026-05-02 deploy fix).
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json tsconfig.json ./
RUN npm install
COPY src ./src
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
EXPOSE 8860
CMD ["node", "dist/index.js"]
