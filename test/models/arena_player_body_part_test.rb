# == Schema Information
#
# Table name: arena_player_body_parts
#
#  id              :bigint           not null, primary key
#  equipped        :boolean
#  health          :integer
#  status_effects  :string
#  created_at      :datetime         not null
#  updated_at      :datetime         not null
#  arena_player_id :bigint           not null
#  body_part_id    :bigint           not null
#
# Indexes
#
#  index_arena_player_body_parts_on_arena_player_id  (arena_player_id)
#  index_arena_player_body_parts_on_body_part_id     (body_part_id)
#
# Foreign Keys
#
#  fk_rails_...  (arena_player_id => arena_players.id)
#  fk_rails_...  (body_part_id => body_parts.id)
#
require "test_helper"

class ArenaPlayerBodyPartTest < ActiveSupport::TestCase
  # test "the truth" do
  #   assert true
  # end
end
