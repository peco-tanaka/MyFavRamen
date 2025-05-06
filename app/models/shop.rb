class Shop < ApplicationRecord
  has_many :ranking_items, dependent: :nullify
  has_many :rankings, through: :ranking_items
  has_many :favs
  has_many :users_who_fav, through: :favs, source: :user
  has_many :records

  validates :name, presence: true
  validates :google_place_id, uniqueness: true, allow_nil: true # 手動登録の場合にはnilを許可
end
