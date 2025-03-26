#!/bin/bash
set -e

# Railsのサーバーpidファイルを事前に削除（存在する場合）
rm -f /app/tmp/pids/server.pid

# データベースの準備ができるまで待機
until nc -z -v -w30 db 5432; do
  echo "Waiting for database connection..."
  sleep 2
done
echo "Database is up and running!"

# データベースが存在しない場合にセットアップ
if [[ $RAILS_ENV != "test" ]]; then
  echo "Setting up database..."
  bundle exec rails db:prepare 2>/dev/null || true
fi

# コンテナのメインプロセスを実行（Dockerfileのcmdで設定されているもの）
echo "Starting application..."
exec "$@"