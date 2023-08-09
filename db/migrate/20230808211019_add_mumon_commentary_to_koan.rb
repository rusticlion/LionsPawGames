class AddMumonCommentaryToKoan < ActiveRecord::Migration[7.0]
  def change
    add_column :koans, :mumon_commentary, :text
  end
end
