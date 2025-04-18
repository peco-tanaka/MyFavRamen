# MyFavらぁめん

## 概要

「MyFavらぁめん」は、ラーメン愛好家が自分だけのラーメンランキング（"俺ランク"）を作成・共有できるWebアプリケーションです。ユーザーは訪問したラーメン店を記録し、個人的な好みに基づいてランキング付けができます。また、他のユーザーのランキングを閲覧したり、フォローしたりすることで緩やかなSNSコミュニティを形成します。

### 主な機能
- 個人ランキング機能（総合・醤油・豚骨・味噌などジャンル別）
- Google Maps APIを使用した店舗検索
- 訪問記録機能（写真アップロード機能付き）
- ユーザープロフィール機能
- フォロー機能
- ランキング共有機能

## 技術スタック

- **バックエンド**: Ruby 3.2.7, Ruby on Rails 7.1.5.1
- **フロントエンド**: HTML5, CSS3, JavaScript (ES6), Bootstrap 5.3, SortableJS
- **データベース**: PostgreSQL 15.12
- **インフラ**: Docker, Render (デプロイ)
- **外部API**: Google Maps API, AWS S3 (画像ストレージ)

## 開発環境のセットアップ

### 必要なソフトウェア

- Docker
- Docker Compose
- Git

### リポジトリを用意

1. リポジトリをクローン
```bash
git clone [リポジトリURL]
cd myfavramen
```

### セットアップ

1. Dockerイメージをビルド
```bash
docker compose build
```

2. Railsプロジェクトを新規作成
```bash
# 指定したバージョンの Rails でプロジェクトを新規作成（Docker ファイルを上書きしない）
docker compose run --no-deps web rails new . --force --database=postgresql --skip-bundle --css=bootstrap --skip-docker
```

3. 環境変数ファイルをコピー
```bash
cp .env.example .env
```

4. Gemfileを上書き

```
source 'https://rubygems.org'
git_source(:github) { |repo| "https://github.com/#{repo}.git" }

ruby '3.2.7'

# コアライブラリ
gem 'rails', '7.2.2.1'
gem 'pg', '~> 1.5'
gem 'puma', '~> 6.4'
gem 'jsbundling-rails', '~> 1.2'
gem 'turbo-rails', '~> 1.5'
gem 'stimulus-rails', '~> 1.3'
gem 'cssbundling-rails', '~> 1.3'
gem 'jbuilder', '~> 2.11'
gem 'bootsnap', '~> 1.17', require: false
gem 'image_processing', '~> 1.12'

# 認証
gem 'devise', '~> 4.9'
gem 'devise-i18n', '~> 1.12'

# 外部API連携
gem 'faraday', '~> 2.8'
gem 'googleauth', '~> 1.8'

# 画像アップロード
gem 'aws-sdk-s3', '~> 1.136', require: false

# ページネーション
gem 'kaminari', '~> 1.2'

# 検索
gem 'ransack', '~> 4.1'

# 日本語化
gem 'rails-i18n', '~> 7.0'

# ActiveHash (都道府県や固定データの管理)
gem 'active_hash', '~> 3.2'

group :development, :test do
  gem 'debug', '~> 1.9', platforms: %i[mri mingw x64_mingw]
  gem 'factory_bot_rails', '~> 6.2'
  gem 'rspec-rails', '~> 6.1'
  gem 'faker', '~> 3.2'
end

group :development do
  gem 'web-console', '~> 4.2'
  gem 'rubocop', '~> 1.59', require: false
  gem 'rubocop-rails', '~> 2.23', require: false
  gem 'letter_opener_web', '~> 2.0'
end

group :test do
  gem 'capybara', '~> 3.39'
  gem 'selenium-webdriver', '~> 4.17'
end
```

```
5. bundle install
docker-compose run web bundle install
```

6. ファイルの所有権を修正（必要に応じて）
```bash
sudo chown -R $USER:$USER .
```

7. データベース設定を更新
```bash
# config/database.ymlを編集して以下の内容に更新
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
```

8. コンテナを起動
```bash
docker-compose up -d
```

9. データベースを作成
```bash
docker-compose exec web rails db:create
docker-compose exec web rails db:migrate
```

9. 必要なジェネレータを実行
```bash
docker-compose exec web rails generate devise:install
```

10.Active Storageをインストール
```bash
docker-compose exec web rails active_storage:install
docker-compose exec web rails db:migrate
```

## 開発

### 開発環境の起動
```bash
docker-compose up
```

### 開発環境の停止
```bash
docker-compose down
```

### コンテナ内でコマンドを実行
```bash
docker-compose exec web [コマンド]

# 例: Railsコンソールを起動
docker-compose exec web rails console

# 例: マイグレーションを実行
docker-compose exec web rails db:migrate

# 例: 新しいモデルを作成
docker-compose exec web rails generate model Shop name:string address:string
```

### Gemの追加
1. Gemfileを編集してgemを追加
2. コンテナ内でbundle installを実行
```bash
docker-compose exec web bundle install
```

### JavaScriptパッケージの追加
1. package.jsonを編集してパッケージを追加
2. コンテナ内でyarn installを実行
```bash
docker-compose exec web yarn install
```

### 主要モデルとテーブル

このアプリケーションは以下の主要モデルで構成されています：

- `User` - ユーザー情報
- `Shop` - ラーメン店舗情報
- `Ranking` - ユーザーごとの各ジャンルのランキング
- `RankingItem` - ランキング内の各店舗の順位情報
- `Fav` - お気に入り店舗
- `Record` - 訪問記録
- `Follow` - フォロー関係

詳細なデータベース設計は `doc/DB設計.md` を参照してください。

## テスト

RSpecを使用してテストを実行します。
```bash
docker-compose exec web rspec
```

### テストのセットアップ

テスト環境の初期設定：
```bash
docker-compose exec web rails db:test:prepare
```

## APIキーの設定

Google Maps APIやAWS S3を使用するために、.envファイルに以下の環境変数を設定してください：
- GOOGLE_MAPS_API_KEY
- AWS_ACCESS_KEY_ID
- AWS_SECRET_ACCESS_KEY
- AWS_REGION
- AWS_BUCKET

```
# .env
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
AWS_REGION=ap-northeast-1
AWS_BUCKET=myfavramen-bucket
```

## デザイン・UI

アプリケーションのUI設計はBootstrapを使用し、以下のデザインコンセプトに沿っています：
- メインカラー: オレンジ
- 基本背景色: 白
- モバイルファーストのレスポンシブデザイン

## デプロイ

このアプリケーションはRenderにデプロイする予定です。

### デプロイ手順

1. Renderアカウントを作成
2. 新しいWeb Serviceを追加
3. GitHubリポジトリと連携
4. 以下の環境変数を設定
   - RAILS_MASTER_KEY
   - DATABASE_URL
   - その他の環境変数

## トラブルシューティング

### データベース接続エラー
コンテナの起動順序の問題で、データベース接続エラーが発生する場合があります。その場合は以下のコマンドを実行してください：
```bash
docker-compose down
docker-compose up
```

### Gemfileの変更が反映されない
Gemfileを変更した場合は、イメージの再ビルドが必要な場合があります：
```bash
docker-compose build
docker-compose up
```

### 権限エラー
ファイルの権限に関するエラーが発生する場合は、以下のコマンドを実行してください：
```bash
sudo chown -R $USER:$USER .
```

### webpackerエラー
JavaScriptのビルドに関するエラーが発生した場合：
```bash
docker-compose exec web rails webpacker:compile
```

## プロジェクト構造

主要なディレクトリ構造：

```
myfavramen/
├── app/                    # アプリケーションコード
│   ├── controllers/        # コントローラー
│   ├── models/             # モデル
│   ├── views/              # ビュー
│   ├── javascript/         # JavaScriptファイル
│   └── assets/             # CSS、画像など
├── config/                 # 設定ファイル
├── db/                     # データベース関連
├── docker/                 # Docker関連ファイル
├── doc/                    # ドキュメント
└── spec/                   # テスト
```

## ライセンス

[適切なライセンス情報]