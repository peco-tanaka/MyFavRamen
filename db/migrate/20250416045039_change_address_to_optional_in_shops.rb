class ChangeAddressToOptionalInShops < ActiveRecord::Migration[7.2]
  def change
    change_column_null :shops, :address, true
  end
end
