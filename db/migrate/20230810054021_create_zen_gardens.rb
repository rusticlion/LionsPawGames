class CreateZenGardens < ActiveRecord::Migration[7.0]
  def change
    create_table :zen_gardens do |t|
      t.jsonb :grid, null: false

      t.timestamps
    end
  end
end
