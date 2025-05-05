FactoryBot.define do
  factory :ranking do
    association :user
    genre_id { Faker::Number.between(from: 1, to: 10) } # ジャンルのID（実際の値に合わせて調整してください）
    is_public { true }
  end
end