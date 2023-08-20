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
class BodyPart < ApplicationRecord
  SLOT_TYPES = %w[head body limb].freeze

  validates :slot, inclusion: { in: SLOT_TYPES }
end
