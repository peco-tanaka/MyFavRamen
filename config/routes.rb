Rails.application.routes.draw do
  get "home/index"
  devise_for :users, controllers: {
    registrations: "users/registrations",
    sessions: "users/sessions"
  }

  resources :rankings, only: [ :index ]
  resources :users, only: [ :show ]
  root to: "home#index"

  # 開発環境でメール送信を行うための設定
  mount LetterOpenerWeb::Engine, at: "/letter_opener" if Rails.env.development?
end
