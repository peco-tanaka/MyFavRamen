class CreateShops < ActiveRecord::Migration[7.2]
  def change
    create_table :shops do |t|
      t.string :name, null: false
      t.string :address, null: false
      t.float  :latitude
      t.float  :longitude
      t.string :business_hours
      t.string :phone
      t.string :website
      t.timestamps
    end
  end
end
