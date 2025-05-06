FactoryBot.define do
  factory :shop do
    name            { "#{Faker::Restaurant.name}ラーメン" }
    address         { "#{Faker::Address.state} #{Faker::Address.city} #{Faker::Address.street_address}" }
    latitude        { Faker::Address.latitude }
    longitude       { Faker::Address.longitude }
    business_hours  { "11:00〜22:00" }
    phone           { Faker::PhoneNumber.cell_phone }
    website         { Faker::Internet.url }
    google_place_id { Faker::Alphanumeric.alphanumeric(number: 20) }

    trait :without_google_id do
      google_place_id { nil }
    end
  end
end
