# == Schema Information
#
# Table name: text_blocks
#
#  id         :bigint           not null, primary key
#  title      :string
#  content    :text
#  context    :string
#  created_at :datetime         not null
#  updated_at :datetime         not null
#
require "test_helper"

class TextBlockTest < ActiveSupport::TestCase
  # test "the truth" do
  #   assert true
  # end
end
