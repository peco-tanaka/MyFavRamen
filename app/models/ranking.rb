class Ranking < ApplicationRecord
  belongs_to :user
  has_many :ranking_items, dependent: :destroy
  has_many :shops, through: :ranking_items

  extend ActiveHash::Associations::ActiveRecordExtensions
  belongs_to_active_hash :genre

  validate :user_id, presence: true
  validate :genre_id, presence: true
  # 後で実装
  # validates :is_public, inclusion: { in: [true, false] }

  # ユーザーとジャンルの組み合わせはユニークであること
  validates :genre_id, uniqueness: { scope: :user_id }
end
