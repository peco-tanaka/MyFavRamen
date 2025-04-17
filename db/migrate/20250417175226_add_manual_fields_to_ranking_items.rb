# db/migrate/YYYYMMDDHHMMSS_add_manual_fields_to_ranking_items.rb

# class AddManualFieldsToRankingItems < ActiveRecord::Migration[7.0] # ご自身のRailsバージョンに合わせてください
class AddManualFieldsToRankingItems < ActiveRecord::Migration[7.1] # 例: Rails 7.1
  def change
    # is_manual カラムを追加。デフォルト値は false、NULL は許可しない (必須項目)
    add_column :ranking_items, :is_manual, :boolean, default: false, null: false
    add_column :ranking_items, :manual_shop_name, :string
    add_column :ranking_items, :manual_shop_address, :string
  end
end