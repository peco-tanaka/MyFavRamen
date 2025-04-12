class CreateRankings < ActiveRecord::Migration[7.2]
  def change
    create_table :rankings do |t|
      t.references :user, null: false, foreign_key: true
      t.integer :genre_id, null: false
      t.boolean :is_public, default: true

      t.timestamps
    end
    # ユーザーとジャンルの組み合わせでユニーク制約を追加
    add_index :rankings, [:user_id, :genre_id], unique: true
  end
end
