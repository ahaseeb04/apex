FROM node:22-alpine AS builder
WORKDIR /app/packages/api

COPY packages/api/package.json .
RUN npm install

COPY packages/api/tsconfig.json .
COPY packages/api/src/ src/
COPY packages/api/prisma/ prisma/

RUN npx prisma generate
RUN npx tsc

FROM node:22-alpine AS runner
WORKDIR /app

COPY --from=builder /app/packages/api/dist ./dist
COPY --from=builder /app/packages/api/package.json ./
COPY --from=builder /app/packages/api/node_modules ./node_modules

ENV PORT=4000
EXPOSE 4000

CMD ["node", "dist/index.js"]
