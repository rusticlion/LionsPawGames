class Api::ZenGardensController < ApplicationController
  skip_before_action :verify_authenticity_token

  def show
    @zen_garden = ZenGarden.first
    render json: @zen_garden
  end

  def update
    @zen_garden = ZenGarden.first_or_initialize
    if @zen_garden.update(grid: params["zen_garden"]["grid"])
      render json: @zen_garden
    else
      render json: @zen_garden.errors, status: :unprocessable_entity
    end
  end

end