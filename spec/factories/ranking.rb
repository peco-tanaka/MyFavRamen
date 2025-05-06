FactoryBot.define do
  factory :ranking do
    user      { association :user } # 明示的に関連付け
    genre_id  { Faker::Number.between(from: 1, to: 7) }
    is_public { true }
  end
end
