# == Schema Information
#
# Table name: related_items
#
#  id                    :bigint           not null, primary key
#  created_at            :datetime         not null
#  updated_at            :datetime         not null
#  media_item_id         :bigint           not null
#  related_media_item_id :bigint           not null
#
# Indexes
#
#  index_related_items_on_media_item_id          (media_item_id)
#  index_related_items_on_related_media_item_id  (related_media_item_id)
#
# Foreign Keys
#
#  fk_rails_...  (media_item_id => media_items.id)
#  fk_rails_...  (related_media_item_id => media_items.id)
#
require "test_helper"

class RelatedItemTest < ActiveSupport::TestCase
  # test "the truth" do
  #   assert true
  # end
end
