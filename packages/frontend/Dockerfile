# Stage 1: Build
FROM node:25-alpine3.22 AS builder

ARG VITE_URL_BACKEND=

WORKDIR /app

COPY package*.json ./
RUN npm install -D typescript@6.0.3
RUN npm install && npm cache clean --force

COPY . .

# Simulate commands.json for build
RUN echo "" > commands.json

RUN npm run build

# Stage 2: Serve
FROM node:25-alpine3.22

WORKDIR /app

RUN npm install -g serve
COPY --from=builder /app/dist ./dist

EXPOSE 8080

CMD ["serve", "-s", "dist", "-l", "8080"]