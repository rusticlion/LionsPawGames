class RegistrationsController < Devise::RegistrationsController
  respond_to :json

  def create
    super do |resource|
      if resource.persisted?
        render json: resource, status: :created
        return
      else
        render json: resource.errors, status: :unprocessable_entity
        return
      end
    end
  end
  
end
