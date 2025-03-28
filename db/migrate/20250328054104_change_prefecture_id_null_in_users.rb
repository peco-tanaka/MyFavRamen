class ChangePrefectureIdNullInUsers < ActiveRecord::Migration[7.2]
  def change
    change_column_null :users, :prefecture_id, true  # NULL値を許可する
  end
end
