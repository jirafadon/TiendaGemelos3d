FROM node:20-alpine AS builder

WORKDIR /app

COPY print3d-backend/package*.json ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

COPY print3d-backend/ ./

FROM node:20-alpine AS final

ENV NODE_ENV=production
WORKDIR /app

COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/ ./
RUN npm prune --omit=dev

RUN chown -R node:node /app
USER node

EXPOSE 4000

CMD ["node", "server.js"]
