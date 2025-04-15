class RankingItem < ApplicationRecord
  belongs_to :ranking
  belongs_to :shop

  has_one_attached :photo

  validates :position, presence: true, numericality: { only_integer: true }
  validates :menu_name, presence: true

  # 同じランキング内での順位は一位であること
  validates :position, uniqueness: { scope: :ranking_id, message: "同じランキング内での順位は一意である必要があります" }

  # 同じランキング内で同じ店舗の同じメニューは登録できないこと
  validates :menu_name, uniqueness: { scope: [ :ranking_id, :shop_id ], message: "同じランキング内で同じ店舗の同じメニューは登録できません" }
end
