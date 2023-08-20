class CreateArenaPlayerBodyParts < ActiveRecord::Migration[7.0]
  def change
    create_table :arena_player_body_parts do |t|
      t.references :arena_player, null: false, foreign_key: true
      t.references :body_part, null: false, foreign_key: true
      t.integer :health
      t.string :status_effects

      t.timestamps
    end
  end
end
