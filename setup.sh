#!/bin/bash

# MyFavらぁめん開発環境セットアップスクリプト
echo "===== MyFavらぁめん開発環境セットアップを開始します ====="

# 必要なファイルが存在するか確認
if [ ! -f "Dockerfile" ] || [ ! -f "docker-compose.yml" ]; then
  echo "エラー: DockerfileまたはDocker Composeファイルが見つかりません。"
  exit 1
fi

# .envファイルの作成
if [ ! -f ".env" ]; then
  echo "環境変数設定ファイル.envを作成します..."
  cp .env.example .env
  echo ".envファイルを作成しました。必要に応じて環境変数を設定してください。"
else
  echo ".envファイルは既に存在します。"
fi

# entrypoint.shの実行権限を確認・付与
if [ ! -x "entrypoint.sh" ]; then
  echo "entrypoint.shに実行権限を付与します..."
  chmod +x entrypoint.sh
fi

# Railsプロジェクト作成
if [ ! -f "config/application.rb" ]; then
  echo "Railsプロジェクトを新規作成します..."
  docker-compose run --no-deps web rails new . --force --database=postgresql
  # ファイルの所有権修正（Linux/macOSの場合）
  if [[ "$OSTYPE" == "linux-gnu"* ]] || [[ "$OSTYPE" == "darwin"* ]]; then
    echo "ファイルの所有権を修正しています..."
    sudo chown -R $USER:$USER .
  fi
  
  # データベース設定ファイルを更新
  echo "データベース設定を更新しています..."
  cat > config/database.yml << EOL
default: &default
  adapter: postgresql
  encoding: unicode
  host: db
  username: myfavramen
  password: password
  pool: <%= ENV.fetch("RAILS_MAX_THREADS") { 5 } %>

development:
  <<: *default
  database: myfavramen_development

test:
  <<: *default
  database: myfavramen_test

production:
  <<: *default
  database: myfavramen_production
  username: myfavramen
  password: <%= ENV['MYFAVRAMEN_DATABASE_PASSWORD'] %>
EOL
else
  echo "Railsプロジェクトは既に存在します。"
fi

# イメージのビルドとコンテナの起動
echo "Dockerイメージをビルドしています..."
docker-compose build

echo "コンテナを起動してセットアップを開始します..."
docker-compose up -d

# 初期設定コマンドの実行
echo "Deviseのインストールを実行しています..."
docker-compose exec web rails generate devise:install

echo "ActiveStorageのインストールを実行しています..."
docker-compose exec web rails active_storage:install

echo "セットアップが完了しました！"
echo "以下のコマンドでMyFavらぁめんの開発を始めることができます:"
echo "・docker-compose up -d    - 開発環境を起動"
echo "・docker-compose down     - 開発環境を停止"
echo "・docker-compose exec web bash  - コンテナ内でコマンドを実行"
echo ""
echo "ブラウザで http://localhost:3000 にアクセスしてアプリケーションを確認できます。"