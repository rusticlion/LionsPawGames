# == Schema Information
#
# Table name: media_recommendations
#
#  id             :bigint           not null, primary key
#  created_at     :datetime         not null
#  updated_at     :datetime         not null
#  recommended_id :bigint           not null
#  recommender_id :bigint           not null
#
# Indexes
#
#  index_media_recommendations_on_recommended_id  (recommended_id)
#  index_media_recommendations_on_recommender_id  (recommender_id)
#
# Foreign Keys
#
#  fk_rails_...  (recommended_id => media_items.id)
#  fk_rails_...  (recommender_id => media_items.id)
#
class MediaRecommendation < ApplicationRecord
  belongs_to :recommender, class_name: 'MediaItem'
  belongs_to :recommended, class_name: 'MediaItem'
end
