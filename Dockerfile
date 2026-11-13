# ───────── Etapa 1: build ─────────
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
# JJ-Sprint5 13/11/2026: sin scripts de instalación (Sonar); el build de Angular no los necesita
RUN npm ci --no-audit --no-fund --ignore-scripts

COPY . .
RUN npm run build

# ───────── Etapa 2: runtime (Nginx sin privilegios) ─────────
FROM nginxinc/nginx-unprivileged:1.29-alpine AS runtime

COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --chmod=755 docker/40-runtime-config.sh /docker-entrypoint.d/40-runtime-config.sh
# JJ-Sprint5 13/11/2026: la app queda de root (nginx solo la lee; Sonar S6504). Solo config/ es de nginx:
# ahí 40-runtime-config.sh escribe runtime-config.json al arrancar (corre como el usuario nginx, uid 101)
COPY --from=build /app/dist/campusbite-front/browser /usr/share/nginx/html
USER root
RUN mkdir -p /usr/share/nginx/html/config && chown 101:101 /usr/share/nginx/html/config
USER 101

# Valores por defecto; se sobreescriben con -e / docker compose (.env)
ENV API_URL=/api \
    LOG_LEVEL=error

EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://127.0.0.1:8080/healthz || exit 1
