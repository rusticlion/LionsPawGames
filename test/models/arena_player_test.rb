# == Schema Information
#
# Table name: arena_players
#
#  id         :bigint           not null, primary key
#  affinity   :string
#  created_at :datetime         not null
#  updated_at :datetime         not null
#  user_id    :bigint           not null
#
# Indexes
#
#  index_arena_players_on_user_id  (user_id)
#
# Foreign Keys
#
#  fk_rails_...  (user_id => users.id)
#
require "test_helper"

class ArenaPlayerTest < ActiveSupport::TestCase
  # test "the truth" do
  #   assert true
  # end
end
