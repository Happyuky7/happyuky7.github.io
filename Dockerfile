# Multi-stage build: build with Node + pnpm, serve with Nginx

FROM node:22-alpine AS build
WORKDIR /app

ARG VITE_BASE=/
ARG VITE_SITE_URL=
ARG SITE_URL=

ENV VITE_BASE=$VITE_BASE
ENV VITE_SITE_URL=$VITE_SITE_URL
ENV SITE_URL=$SITE_URL

# pnpm via Corepack (version comes from the "packageManager" field)
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable

# Install deps first (better caching)
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Build
COPY . .
RUN pnpm run build


FROM nginx:1.27-alpine AS runtime

# Nginx config (SPA fallback + sensible caching)
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

# Static site
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
