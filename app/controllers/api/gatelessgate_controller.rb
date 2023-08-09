class Api::GatelessgateController < ApplicationController
  def daily
    @koan = Koan.random_koan
    render json: @koan
  end
end