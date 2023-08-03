# == Route Map
#

Rails.application.routes.draw do
  root to: 'pages#index'

  get '/about-me', to: 'aboutme#show'

  namespace :api do
    namespace :v1 do
      resources :tests, only: [:index]
    end
    resources :text_blocks, only: [:index, :create, :show, :update, :destroy]
  end
end
