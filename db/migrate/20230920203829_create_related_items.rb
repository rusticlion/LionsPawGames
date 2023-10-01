class CreateRelatedItems < ActiveRecord::Migration[7.0]
  def change
    create_table :related_items do |t|
      t.references :media_item, null: false, foreign_key: { to_table: :media_items }
      t.references :related_media_item, null: false, foreign_key: { to_table: :media_items }

      t.timestamps
    end
  end
end
