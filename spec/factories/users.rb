FactoryBot.define do
  factory :user do
    email                 { Faker::Internet.unique.email }
    password              { Faker::Internet.password(min_length: 6) }
    password_confirmation { password }
    nickname              { Faker::Name.name }
    prefecture_id         { Faker::Number.between(from: 1, to: 47) } # 都道府県ID (1-47)
    # 実装後に解除
    # favorite_type         { ['醤油', '味噌', '塩', '豚骨', '家系', '二郎系'].sample }

    trait :with_avatar do
      after(:build) do |user|
        user.avatar.attach(
          io: File.open(Rails.root.join('spec', 'fixtures', 'files', 'test_avatar.png')),
          filename: 'test_avatar.png',
          content_type: 'image/png'
        )
      end
    end
  end
end
