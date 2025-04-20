class RemoveUniqueIndexFromPositionOnRankingItems < ActiveRecord::Migration[7.2]
  def change
    # インデックスが存在する場合のみ削除する
    remove_index :ranking_items, name: "index_ranking_items_on_ranking_id_and_position", if_exists: true

    # インデックスが存在しない場合のみ追加する
    add_index :ranking_items, [ :ranking_id, :position ], if_not_exists: true
  end
end
