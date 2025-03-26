#!/bin/bash
set -e

# Remove a potentially pre-existing server.pid for Rails
rm -f /app/tmp/pids/server.pid

# Install JavaScript dependencies if needed
if [ -f package.json ] && [ ! -d node_modules ]; then
  echo "Installing JavaScript dependencies..."
  npm install
fi

# Wait for database to be ready
echo "Waiting for database..."
until nc -z -v -w30 db 5432; do
  echo "Waiting for database connection..."
  sleep 2
done
echo "Database is up and running!"

# Setup database if it doesn't exist
if [[ $RAILS_ENV != "test" ]]; then
  echo "Setting up database..."
  bundle exec rails db:prepare 2>/dev/null || true
fi

# Then exec the container's main process (what's set as CMD in the Dockerfile)
echo "Starting application..."
exec "$@"