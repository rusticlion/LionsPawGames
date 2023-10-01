class CreateMediaItems < ActiveRecord::Migration[7.0]
  def change
    create_table :media_items do |t|
      t.string :title
      t.string :media_type
      t.text :description
      t.string :link

      t.timestamps
    end
  end
end
