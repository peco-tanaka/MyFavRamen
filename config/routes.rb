Rails.application.routes.draw do
  get "home/index"
  devise_for :users, controllers: {
    registrations: "users/registrations",
    sessions: "users/sessions"
  }

    root to: "home#index"
    post 'shops/search', to: 'shops#search'

  resources :shops, only: [ :index, :show ] do
    collection do
      get :search
    end
  end

  resources :rankings, only: [ :index ]
  resources :users, only: [ :show ]

  # 開発環境でメール送信を行うための設定
  mount LetterOpenerWeb::Engine, at: "/letter_opener" if Rails.env.development?
end
