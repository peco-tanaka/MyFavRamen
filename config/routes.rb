Rails.application.routes.draw do
  get "home/index"
  devise_for :users, controllers: {
    registrations: "users/registrations",
    sessions: "users/sessions"
  }

  root to: "home#index"
  post "shops/search", to: "shops#search"

  resources :shops, only: [ :index, :show ] do
    collection do
      get :search
    end
  end

  resources :rankings, only: [ :index, :show, :edit, :update ] do
    collection do
      # ジャンル別のランキング表示用（as： でパスヘルパーに名前をつける）
      get "genre/:genre_id", to: "rankings#genre", as: "genre"
      # ジャンルIDに基づいた編集画面
      get "genre/:genre_id/edit", to: "rankings#edit", as: "edit_genre_ranking"
      # ジャンルIDに基づいた更新処理
      patch "genre/:genre_id", to: "rankings#update", as: "update_genre_ranking"
      put   "genre/:genre_id", to: "rankings#update"
    end
    # ランキングアイテムのネスト
    resources :ranking_items, only: [ :create, :update, :destroy, :edit ] do
      collection do
        patch :sort  # ランキングアイテムの並び替え用
      end
    end
  end

  # 他ユーザのランキングを閲覧するためのルート
  resources :public_rankings, only: [ :show ] do
    collection do
      get "user/:user_id/genre/:genre_id", to: "public_rankings#show", as: "user_genre"
    end
  end

  resources :users, only: [ :show, :edit, :update ]

  # 開発環境でメール送信を行うための設定
  mount LetterOpenerWeb::Engine, at: "/letter_opener" if Rails.env.development?
end
