class Ranking < ApplicationRecord
  belongs_to :user
  has_many :ranking_items, -> { order(position: :asc) }, dependent: :destroy
  has_many :shops, through: :ranking_items

  extend ActiveHash::Associations::ActiveRecordExtensions
  belongs_to_active_hash :genre

  validates :user_id, presence: true
  validates :genre_id, presence: true
  validates :is_public, inclusion: { in: [ true, false ] }

  # ユーザーとジャンルの組み合わせはユニークであること
  validates :genre_id, uniqueness: { scope: :user_id }
end
