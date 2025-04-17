class AddGooglePlaceIdToShops < ActiveRecord::Migration[7.2]
  def change
    add_column :shops, :google_place_id, :string
    add_index :shops, :google_place_id
  end
end
