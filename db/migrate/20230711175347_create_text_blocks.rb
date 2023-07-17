class CreateTextBlocks < ActiveRecord::Migration[7.0]
  def change
    create_table :text_blocks do |t|
      t.string :title
      t.text :content
      t.string :context

      t.timestamps
    end
  end
end
