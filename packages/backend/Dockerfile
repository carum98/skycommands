# Stage 1: Build
FROM node:25-alpine3.22 AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install -D typescript@6.0.3
RUN npm install && npm cache clean --force

COPY . .

# Simulate serviceAccountKey.json for build
RUN echo "{}" > serviceAccountKey.json

RUN npm run build
RUN npm prune --production

# Stage 2: Serve
FROM node:25-alpine3.22

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./

EXPOSE 3000

CMD ["node", "index.js"]