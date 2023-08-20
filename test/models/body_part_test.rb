# == Schema Information
#
# Table name: body_parts
#
#  id         :bigint           not null, primary key
#  affinity   :string
#  name       :string
#  slot       :string
#  created_at :datetime         not null
#  updated_at :datetime         not null
#
require "test_helper"

class BodyPartTest < ActiveSupport::TestCase
  # test "the truth" do
  #   assert true
  # end
end
