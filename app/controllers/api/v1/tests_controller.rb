class Api::V1::TestsController < ApplicationController
  def index
    render json: { status: 'SUCCESS', message: 'Loaded tests', data: 'test data' }
  end
end