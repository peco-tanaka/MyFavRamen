FactoryBot.define do
  factory :ranking do
    association :user
    genre_id { Faker::Number.between(from: 1, to: 7) } # ジャンルのID
    is_public { true }
  end
end