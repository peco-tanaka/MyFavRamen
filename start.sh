#!/bin/bash
# データベースマイグレーションを実行
bundle exec rails db:migrate

# 成功したらサーバーを起動
if [ $? -eq 0 ]; then
  bundle exec rails server -b 0.0.0.0
else
  echo "マイグレーション失敗のためサーバー起動を中止します"
  exit 1
fi