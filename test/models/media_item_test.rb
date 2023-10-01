# == Schema Information
#
# Table name: media_items
#
#  id          :bigint           not null, primary key
#  description :text
#  link        :string
#  media_type  :string
#  title       :string
#  created_at  :datetime         not null
#  updated_at  :datetime         not null
#
require "test_helper"

class MediaItemTest < ActiveSupport::TestCase
  # test "the truth" do
  #   assert true
  # end
end
