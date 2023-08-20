class AddSlotToBodyParts < ActiveRecord::Migration[7.0]
  def change
    add_column :body_parts, :slot, :string
  end
end
