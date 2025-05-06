FactoryBot.define do
  factory :ranking_item do
    association :ranking
    shop      { create(:shop) }  # <- 明示的に shop を作成して関連付ける
    position  { Faker::Number.between(from: 1, to: 10) }
    menu_name { "#{Faker::Food.dish}ラーメン" }
    comment   { Faker::Lorem.sentence }
    is_manual { false }

    # 添付が必要な場合は with_photo trait を使用
    trait :with_photo do
      after(:build) do |item|
        # ファイルが存在することを確認してから添付
        file_path = Rails.root.join('spec', 'fixtures', 'files', 'test_image.png')
        if File.exist?(file_path)
          item.photo.attach(
            io: File.open(file_path),
            filename: 'test_image.jpg',
            content_type: 'image/jpeg'
          )
        end
      end
    end

    # 手動登録店舗用の trait
    trait :manual_shop do
      is_manual           { true }
      shop                { nil }
      manual_shop_name    { "#{Faker::Company.name}ラーメン" }
      manual_shop_address { "#{Faker::Address.city} #{Faker::Address.street_address}" }
    end
  end
end