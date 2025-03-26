FROM ruby:3.2.7-slim

# Install essential packages for Rails development
RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y \
    build-essential \
    libpq-dev \
    curl \
    git \
    postgresql-client \
    vim \
    imagemagick \
    libvips \
    npm \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* \
    && npm install -g n \
    && n 20.19.0 \
    && node -v \
    && npm -v

# Set working directory
WORKDIR /app

# Copy gemfiles for dependency installation
COPY Gemfile Gemfile.lock ./

# Install Ruby dependencies
RUN bundle install

# Install JavaScript dependencies if package.json exists
COPY package.json package-lock.json ./
RUN if [ -f package.json ]; then npm install; fi

# Copy the rest of the application
COPY . .

# Add a script to be executed every time the container starts
COPY entrypoint.sh /usr/bin/
RUN chmod +x /usr/bin/entrypoint.sh
ENTRYPOINT ["entrypoint.sh"]
EXPOSE 3000

# Start the main process
CMD ["bin/rails", "server", "-b", "0.0.0.0"]

# 良い点

# スリムなベースイメージ: ruby:3.2.7-slimを使用して基本イメージを軽量に保っています。
# 必要なパッケージの効率的なインストール:

# 必須パッケージのみをインストール
# --no-install-recommendsフラグによる余分なパッケージの排除
# apt-get cleanとrm -rf /var/lib/apt/lists/*でキャッシュを削除


# Node.jsの効率的な管理:

# nを使用したNode.jsバージョン管理
# バージョン20.19.0を明示的に指定
# インストール確認のためのバージョン表示


# 依存関係の効率的なインストール:

# Gemfileを先にコピーしてからbundle installを実行
# package.jsonを先にコピーして依存関係をインストール
# 条件分岐による不要なインストール処理の回避


# 適切なワークフロー設定:

# エントリーポイントスクリプトの使用
# ポート3000の公開
# 適切なコマンド設定



# 注意点

# キャッシュ最適化:

# このDockerfileは既にキャッシュレイヤーを適切に使用していますが、開発中は頻繁に変更されるファイルを後半にコピーする現在の構造を維持することが重要です。