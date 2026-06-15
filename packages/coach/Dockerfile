FROM node:22-alpine AS builder
WORKDIR /app

ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

ARG NEXT_PUBLIC_OPENROUTER_API_KEY
ENV NEXT_PUBLIC_OPENROUTER_API_KEY=$NEXT_PUBLIC_OPENROUTER_API_KEY

COPY package.json .
RUN npm install

COPY tsconfig.json .
COPY next.config.ts .
COPY postcss.config.mjs .
COPY eslint.config.mjs .
COPY components.json .
COPY src/ src/
COPY public/ public/

ENV NEXT_TELEMETRY_DISABLED=1
RUN npx next build

FROM node:22-alpine AS runner
WORKDIR /app

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

ENV PORT=3000
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

EXPOSE 3000

CMD ["node", "server.js"]
