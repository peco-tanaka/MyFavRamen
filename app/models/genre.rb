class Genre < ActiveHash::Base
  self.data = [
    { id: 1, name: "総合" },
    { id: 2, name: "醤油" },
    { id: 3, name: "豚骨" },
    { id: 4, name: "味噌" },
    { id: 5, name: "塩" },
    { id: 6, name: "その他" }
  ]

  include ActiveHash::Associations
  has_many :rankings
end
