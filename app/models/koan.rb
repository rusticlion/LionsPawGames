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
class Koan < ApplicationRecord

  def self.today_koan
    date_seed = Date.today.strftime('%Y%m%d').to_i
    total_koans = Koan.count
    index = date_seed % total_koans
    todays_koan = Koan.offset(index).first
  end

  def self.random_koan
    Koan.all.sample
  end
end
