FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY index.html tsconfig.json ./
COPY public/ public/
COPY src/ src/
RUN npm run build

FROM nginx:stable-alpine
COPY --from=build /app/dist/ /usr/share/nginx/html/
