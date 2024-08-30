class Api::GatelessgateController < ApplicationController
  def daily
    @koan = Koan.today_koan
    try 
      render json: @koan
    rescue => e
      Rails.logger.error("Error fetching daily koan: #{e.message}")
      render json: { error: e.message }, status: :internal_server_error
    end
  end

  def random
    @koan = Koan.random_koan
    render json: @koan
  end
end