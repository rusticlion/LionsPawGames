# == Schema Information
#
# Table name: koans
#
#  id               :bigint           not null, primary key
#  mumon_commentary :text
#  source           :string
#  text             :string
#  title            :string
#  created_at       :datetime         not null
#  updated_at       :datetime         not null
#
require "test_helper"

class KoanTest < ActiveSupport::TestCase
  # test "the truth" do
  #   assert true
  # end
end
