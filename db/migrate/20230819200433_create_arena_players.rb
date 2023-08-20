class CreateArenaPlayers < ActiveRecord::Migration[7.0]
  def change
    create_table :arena_players do |t|
      t.references :user, null: false, foreign_key: true
      t.string :affinity

      t.timestamps
    end
  end
end
