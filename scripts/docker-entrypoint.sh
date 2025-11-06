#!/bin/sh
set -e

echo "Running database migrations..."
npm run db:push

# Create/check admin user if ADMIN_EMAIL and ADMIN_PASSWORD are set
if [ -n "$ADMIN_EMAIL" ] && [ -n "$ADMIN_PASSWORD" ]; then
  echo "Checking/creating admin user..."
  npx tsx scripts/check-admin.ts || echo "Admin check completed"
fi

echo "Starting Next.js server..."
exec node server.js

