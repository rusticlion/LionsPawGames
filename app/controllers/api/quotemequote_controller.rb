class Api::QuotemequoteController < ApplicationController
  def daily
    @quote = QuoteMeQuote.daily_quote
    render json: @quote
  end

  def random
    @quote = QuoteMeQuote.random_quote
    render json: @quote
  end
end