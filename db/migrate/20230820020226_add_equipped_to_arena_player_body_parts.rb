class AddEquippedToArenaPlayerBodyParts < ActiveRecord::Migration[7.0]
  def change
    add_column :arena_player_body_parts, :equipped, :boolean
  end
end
