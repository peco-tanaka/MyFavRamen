Rails.application.routes.draw do
  get "home/index"
  devise_for :users, controllers: {
    registrations: 'users/registrations',
    sessions: 'users/sessions'
  }

  resources :rankings, only: [:index]
  resources :users, only: [:show]
  root to: 'home#index'
end
