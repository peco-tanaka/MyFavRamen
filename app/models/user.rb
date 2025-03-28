class User < ApplicationRecord
  # Include default devise modules. Others available are:
  # :confirmable, :lockable, :timeoutable, :trackable and :omniauthable
  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :validatable

  validates :nickname, presence: true

  has_many :rankings
  has_many :ranking_items, through: :rankings
  has_many :favs
  has_many :fav_shops, through: :favs, source: :shop
  has_many :records
  has_many :active_follows, class_name: "Follow", foreign_key: "follower_id"
  has_many :passive_follows, class_name: "Follow", foreign_key: "followed_id"
  has_many :following, through: :active_follows, source: :followed
  has_many :followers, through: :passive_follows, source: :follower
  # active_hash作成後にコメントアウトを外す
  # belongs_to_active_hash :prefecture

  # active_hash作成後にコメントアウトを外す
  # extend ActiveHash::Associations::ActiveRecordExtensions
  # belongs_to_active_hash :prefecture
end
