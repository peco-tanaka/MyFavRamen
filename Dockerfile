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
    libyaml-dev \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* \
    && npm install -g n \
    && n 20.19.0 \
    && node -v \
    && npm -v

# Set working directory
WORKDIR /app

# Copy gemfiles for dependency installation
COPY Gemfile ./
COPY Gemfile.lock ./

# Install Ruby dependencies
RUN bundle install

# Install JavaScript dependencies if package.json exists
COPY package.json package-lock.json ./
RUN if [ -f package.json ]; then npm install; fi

# Copy the rest of the application
COPY . .

# アセットのプリコンパイル（JS、CSSビルド後に実行）
RUN if [ -f package.json ]; then npm run build; fi
RUN if [ -f package.json ]; then npm run build:css; fi
# ビルド時に使用するダミーキーを設定してコマンド実行
RUN SECRET_KEY_BASE=temporary_dummy_key bundle exec rails assets:precompile RAILS_ENV=production

# Start the main process
CMD ["bin/rails", "server", "-b", "0.0.0.0"]
