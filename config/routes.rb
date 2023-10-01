# == Route Map
#

Rails.application.routes.draw do
  devise_for :users,
    controllers: { 
      registrations: 'registrations',
      sessions: 'sessions'
    },
    defaults: { format: :json }
  root to: "pages#index"
  get '/about-me', to: 'aboutme#show'

  get '/temple-of-terror', to: 'templeofterror#show'
  get '/sigilledthrone', to: 'sigiledthrone#show'

  namespace :api do
    namespace :v1 do
      resources :tests, only: [:index]
    end
    resources :text_blocks, only: [:index, :create, :show, :update, :destroy]
    resources :zen_gardens, only: [:show, :update]
    resources :media_items, only: [:show, :index]
    get '/quotes/daily', to: 'quotemequote#daily'
    get '/quotes/random', to: 'quotemequote#random'
    get '/gateless-gate/daily', to: 'gatelessgate#daily'
    get '/gateless-gate/random', to: 'gatelessgate#random'

    get '/dreamlands-arena/has-arena-player', to: 'dreamlandsarena#has_arena_player'
    get '/dreamlands-arena/current-arena-player', to: 'dreamlandsarena#current_arena_player'
    post '/dreamlands-arena/create-arena-player', to: 'dreamlandsarena#create_arena_player'
  end

  get '/', to: 'pages#index'

  get '*path', to: 'pages#frontend', constraints: lambda { |req|
    !req.xhr? && req.format.html?
  }
end
