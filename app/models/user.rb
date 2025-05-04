class User < ApplicationRecord
  extend ActiveHash::Associations::ActiveRecordExtensions

  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :validatable

  has_many :rankings, dependent: :destroy
  has_many :ranking_items, through: :rankings
  # お気に入り店舗機能実装後に解除
  # has_many :favs, dependent: :destroy
  # has_many :fav_shops, through: :favs, source: :shop
  # has_many :records, dependent: :destroy
  # has_many :active_follows, class_name: "Follow", foreign_key: "follower_id", dependent: :destroy
  # has_many :passive_follows, class_name: "Follow", foreign_key: "followed_id", dependent: :destroy
  # has_many :following, through: :active_follows, source: :followed
  # has_many :followers, through: :passive_follows, source: :follower
  belongs_to_active_hash :prefecture

  has_one_attached :avatar

  validates :nickname, presence: true
end
