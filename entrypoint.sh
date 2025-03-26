#!/bin/bash
set -e

# Railsのサーバーpidファイルを事前に削除（存在する場合）
rm -f /app/tmp/pids/server.pid

# コンテナのメインプロセスを実行（Dockerfileのcmdで設定されているもの）
echo "Starting application..."
exec "$@"