FactoryBot.define do
  factory :ranking_item do
    ranking { nil }
    shop { nil }
    position { 1 }
    comment { "MyText" }
    photo { "MyString" }
    menue_name { "MyString" }
  end
end
