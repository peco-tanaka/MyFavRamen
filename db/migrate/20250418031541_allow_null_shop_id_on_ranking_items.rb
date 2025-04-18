class AllowNullShopIdOnRankingItems < ActiveRecord::Migration[7.2]
  def change
    # ranking_items テーブルの shop_id カラムを NULL 許容に変更 (null: true)
    change_column_null :ranking_items, :shop_id, true
  end
end
