# Multi-stage build: build with Node, serve with Nginx

FROM node:20-alpine AS build
WORKDIR /app

ARG VITE_BASE=/
ARG VITE_SITE_URL=
ARG SITE_URL=

ENV VITE_BASE=$VITE_BASE
ENV VITE_SITE_URL=$VITE_SITE_URL
ENV SITE_URL=$SITE_URL

# Install deps first (better caching)
COPY package.json package-lock.json* ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

# Build
COPY . .
RUN npm run build


FROM nginx:1.27-alpine AS runtime

# Nginx config (SPA fallback + sensible caching)
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

# Static site
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
