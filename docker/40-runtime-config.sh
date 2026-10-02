#!/bin/sh
# Genera /config/runtime-config.json a partir de variables de entorno al arrancar el contenedor.
# Así el mismo build sirve para dev / QA / producción.
set -eu

CONFIG_DIR=/usr/share/nginx/html/config
mkdir -p "$CONFIG_DIR"

cat > "$CONFIG_DIR/runtime-config.json" <<EOF
{
  "apiUrl": "${API_URL}",
  "logLevel": "${LOG_LEVEL}"
}
EOF

echo "runtime-config.json generado (apiUrl=${API_URL})"
