# app/controllers/media_items_controller.rb

class Api::MediaItemsController < ApplicationController
  def show
    @media_item = MediaItem.find(params[:id])
    render json: @media_item
  end

  def index
    @media_items = MediaItem.all
    render json: @media_items
  end
end
