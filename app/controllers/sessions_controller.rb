# app/controllers/sessions_controller.rb
class SessionsController < Devise::SessionsController
  respond_to :json

  def create
    super do
      current_user.generate_token
      current_user.save
    end
  end

  def destroy
    current_user.clear_token
    super
  end

  private

  def respond_with(resource, _opts = {})
    render json: { email: resource.email, token: resource.token }
  end

  def respond_to_on_destroy
    head :no_content
  end

  def after_sign_out_path_for(resource_or_scope)
    puts "post sing out path logic"
    root_path
  end
end
