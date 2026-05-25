#!/bin/sh
set -e

echo "🔄 Running Prisma migrations..."
npx prisma migrate deploy

echo "🌱 Running seed (if needed)..."
npx prisma db seed || true

echo "🚀 Starting application..."
exec npm run start:prod
