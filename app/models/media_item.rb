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
class MediaItem < ApplicationRecord
  has_many :related_items
  has_many :related_media_items, through: :related_items

  has_many :media_recommendations, class_name: 'MediaRecommendation', foreign_key: 'recommender_id'
  has_many :recommended_items, through: :media_recommendations, source: :recommended
end
