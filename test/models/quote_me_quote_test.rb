# == Schema Information
#
# Table name: quote_me_quotes
#
#  id          :bigint           not null, primary key
#  attribution :string
#  content     :string
#  context     :string
#  created_at  :datetime         not null
#  updated_at  :datetime         not null
#
require "test_helper"

class QuoteMeQuoteTest < ActiveSupport::TestCase
  # test "the truth" do
  #   assert true
  # end
end
