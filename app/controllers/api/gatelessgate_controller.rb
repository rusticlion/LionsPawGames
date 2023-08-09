class Api::GatelessgateController < ApplicationController
  def daily
    @koan = Koan.today_koan
    render json: @koan
  end

  def random
    @koan = Koan.random_koan
    render json: @koan
  end
end