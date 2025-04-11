class CreatePrefectures < ActiveRecord::Migration[7.2]
  def change
    create_table :prefectures do |t|
      t.timestamps
    end
  end
end
