class CreateKoans < ActiveRecord::Migration[7.0]
  def change
    create_table :koans do |t|
      t.string :title
      t.string :source
      t.string :text

      t.timestamps
    end
  end
end
