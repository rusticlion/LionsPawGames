# == Schema Information
#
# Table name: zen_gardens
#
#  id         :bigint           not null, primary key
#  grid       :jsonb            not null
#  created_at :datetime         not null
#  updated_at :datetime         not null
#
class ZenGarden < ApplicationRecord
end
