class Shop < ApplicationRecord
  has_many :ranking_items
  has_many :rankings, through: :ranking_items
  has_many :favs
  has_many :users_who_fav, through: :favs, source: :user
  has_many :records
end
