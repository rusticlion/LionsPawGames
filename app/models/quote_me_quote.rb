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
class QuoteMeQuote < ApplicationRecord
  def self.daily_quote
    date_seed = Date.today.strftime('%Y%m%d').to_i
    total_quotes = QuoteMeQuote.count
    index = date_seed % total_quotes
    todays_quote = QuoteMeQuote.offset(index).first
  end

  def self.random_quote
    QuoteMeQuote.all.sample
  end
end
