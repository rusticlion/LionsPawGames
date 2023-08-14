# == Route Map
#

Rails.application.routes.draw do
  get '/about-me', to: 'aboutme#show'

  get '/temple-of-terror', to: 'templeofterror#show'

  namespace :api do
    namespace :v1 do
      resources :tests, only: [:index]
    end
    resources :text_blocks, only: [:index, :create, :show, :update, :destroy]
    resources :zen_gardens, only: [:show, :update]
    get '/quotes/daily', to: 'quotemequote#daily'
    get '/quotes/random', to: 'quotemequote#random'
    get '/gateless-gate/daily', to: 'gatelessgate#daily'
    get '/gateless-gate/random', to: 'gatelessgate#random'
  end

  get '/', to: 'pages#index'

  get '*path', to: 'pages#frontend', constraints: lambda { |req|
    !req.xhr? && req.format.html?
  }
end
