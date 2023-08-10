# == Schema Information
#
# Table name: zen_gardens
#
#  id         :bigint           not null, primary key
#  grid       :jsonb            not null
#  created_at :datetime         not null
#  updated_at :datetime         not null
#
require "test_helper"

class ZenGardenTest < ActiveSupport::TestCase
  # test "the truth" do
  #   assert true
  # end
end
