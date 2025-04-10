source "https://rubygems.org"
git_source(:github) { |repo| "https://github.com/#{repo}.git" }

ruby "3.2.7"

# コアライブラリ
gem "rails", "7.2.2.1"
gem "pg", "~> 1.5"
gem "puma", "~> 6.4"
gem "jsbundling-rails", "~> 1.2"
gem "turbo-rails", "~> 2.0.13"
gem "stimulus-rails", "~> 1.3"
gem "cssbundling-rails", "~> 1.3"
gem "jbuilder", "~> 2.11"
gem "bootsnap", "~> 1.17", require: false
gem "image_processing", "~> 1.12"

# 認証
gem "devise", "~> 4.9"
gem "devise-i18n", "~> 1.12"

# 外部API連携
gem "geocoder"
gem "faraday"
gem "faraday_middleware"


# 画像アップロード
gem "aws-sdk-s3", "~> 1.136", require: false

# ページネーション
gem "kaminari", "~> 1.2"

# 検索
gem "ransack", "~> 4.1"

# 日本語化
gem "rails-i18n", "~> 7.0"

# ActiveHash (都道府県や固定データの管理)
gem "active_hash", "~> 3.2"

group :development, :test do
  gem "debug", "~> 1.9", platforms: %i[mri mingw x64_mingw]
  gem "factory_bot_rails", "~> 6.2"
  gem "rspec-rails", "~> 6.1"
  gem "faker", "~> 3.2"
  # CIエラー解消の為追加。脆弱性検知ツール、コード解析ツール
  gem "brakeman", "~> 7.0.2", require: false
  gem "rubocop-rails-omakase", "~> 1.0", require: false
end

group :development do
  gem "web-console", "~> 4.2"
  gem "rubocop", "~> 1.59", require: false
  gem "rubocop-rails", "~> 2.23", require: false
  gem "letter_opener_web", "~> 2.0"
end

group :test do
  gem "capybara", "~> 3.39"
  gem "selenium-webdriver", "~> 4.17"
end

# アセットパイプライン設定
gem "propshaft"

gem "pry-rails"
