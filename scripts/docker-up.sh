#!/usr/bin/env bash
set -euo pipefail

# 一键构建并更新容器
IMAGE_NAME=${IMAGE_NAME:-excel-to-json}
CONTAINER_NAME=${CONTAINER_NAME:-excel-to-json}
PORT=${PORT:-3000}

echo "🚧 Building image ${IMAGE_NAME} ..."
docker build -t "${IMAGE_NAME}" .

if docker ps -a --format '{{.Names}}' | grep -Eq "^${CONTAINER_NAME}\$"; then
  echo "♻️  Removing existing container ${CONTAINER_NAME} ..."
  docker rm -f "${CONTAINER_NAME}" >/dev/null
fi

echo "🚀 Running ${CONTAINER_NAME} on port ${PORT} ..."
docker run -d \
  --name "${CONTAINER_NAME}" \
  -p "${PORT}:${PORT}" \
  -e PORT="${PORT}" \
  -e HOSTNAME=0.0.0.0 \
  "${IMAGE_NAME}"

docker ps --filter "name=${CONTAINER_NAME}"
echo "✅ Done. Open http://localhost:${PORT}"
