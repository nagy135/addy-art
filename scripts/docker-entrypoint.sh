#!/bin/sh
set -e

echo "Running database migrations..."
npm run db:push

# Optionally seed the database if ADMIN_EMAIL and ADMIN_PASSWORD are set
if [ -n "$ADMIN_EMAIL" ] && [ -n "$ADMIN_PASSWORD" ]; then
  echo "Seeding database..."
  npm run db:seed || echo "Seeding failed or admin user already exists"
fi

echo "Starting Next.js server..."
exec node server.js

