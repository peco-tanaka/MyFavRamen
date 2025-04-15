class CreateRankingItems < ActiveRecord::Migration[7.2]
  def change
    create_table :ranking_items do |t|
      t.references :ranking, null: false, foreign_key: true
      t.references :shop, null: false, foreign_key: true
      t.integer :position, null: false
      t.text :comment
      t.string :menu_name, null: false

      t.timestamps
    end
    # 同じランキング内での順位は一意であることを保証
    add_index :ranking_items, [:ranking_id, :position], unique: true
    # 店舗とメニューの組み合わせで重複を防止（同じ店の同じメニュー名は登録できない）
    add_index :ranking_items, [:ranking_id, :shop_id, :menu_name], unique: true
  end
end
