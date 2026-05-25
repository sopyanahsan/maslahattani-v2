#!/bin/sh

echo "Running Prisma migrations..."
npx prisma migrate deploy

echo "Running seed..."
npx prisma db seed || true

echo "Starting application..."
exec npm run start:prod
