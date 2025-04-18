class RankingItem < ApplicationRecord
  belongs_to :ranking
  belongs_to :shop, optional: true # shop_idがnilでもOK。手動登録の場合など

  has_one_attached :photo

  validates :position, presence: true, numericality: { only_integer: true }
  validates :menu_name, presence: true

  # is_manual? が true (手動入力) の場合、manual_shop_name は必須
  validates :manual_shop_name, presence: true, if: :is_manual?

  # is_manual? が false (地図検索) の場合、shop_id (Shopとの関連) は必須
  validates :shop_id, presence: true, unless: :is_manual?

  # 同じランキング内での順位は一位であること
  validates :position, uniqueness: { scope: :ranking_id, message: "同じランキング内での順位は一意である必要があります" }

  # 同じランキング内で同じ店舗の同じメニューは登録できないこと
  validates :menu_name, uniqueness: { scope: [ :ranking_id, :shop_id ], message: "同じランキング内で同じ店舗の同じメニューは登録できません" }

  # 手動入力確認フラグ
  def shop_display_name
    if is_manual?
      manual_shop_name
    else
      shop&.name # shop が nil でもエラーにならないように &. を使う
    end
  end

  def shop_display_address
    if is_manual?
      manual_shop_address
    else
      shop&.address
    end
  end
end
