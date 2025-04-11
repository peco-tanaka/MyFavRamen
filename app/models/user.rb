class User < ApplicationRecord
  extend ActiveHash::Associations::ActiveRecordExtensions

  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :validatable

  has_many :rankings
  has_many :ranking_items, through: :rankings
  has_many :favs
  has_many :fav_shops, through: :favs, source: :shop
  has_many :records
  has_many :active_follows, class_name: "Follow", foreign_key: "follower_id"
  has_many :passive_follows, class_name: "Follow", foreign_key: "followed_id"
  has_many :following, through: :active_follows, source: :followed
  has_many :followers, through: :passive_follows, source: :follower
  belongs_to_active_hash :prefecture

  has_one_attached :avatar

  validates :nickname, presence: true
  validates :prefecture_id, presence: true, inclusion: { in: Prefecture.all.map(&:id), message: "を選択してください" }

end
