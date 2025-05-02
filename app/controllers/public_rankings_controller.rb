class PublicRankingsController < ApplicationController
  before_action :set_genres, only: [:index, :show]
  
  def index
    @prefecture_id = params[:prefecture_id].to_i if params[:prefecture_id].present?
    
    # 公開設定のランキングのみを取得
    @rankings = Ranking.includes(:user, :ranking_items)
                      .where(is_public: true)
                      .where(genre_id: 1) # 総合ランキングのみ
    
    # ログインユーザーのランキングを除外
    @rankings = @rankings.where.not(user_id: current_user.id) if user_signed_in?
    
    # 都道府県でフィルタリングする場合
    if @prefecture_id.present? && @prefecture_id > 0
      # ユーザーの都道府県でフィルタリング
      @rankings = @rankings.joins(:user).where(users: { prefecture_id: @prefecture_id })
      @current_prefecture = Prefecture.find(@prefecture_id)
    end
    
    # 各ランキングの上位3アイテムを取得するためのデータを準備
    @top_items = {}
    @rankings.each do |ranking|
      @top_items[ranking.id] = ranking.ranking_items.includes(:shop).order(:position).limit(3)
    end
    
    @prefectures = Prefecture.all
  end

  def show
    if params[:user_id].present? && params[:genre_id].present?
      @user = User.find(params[:user_id])
      @current_genre = Genre.find(params[:genre_id])
      @ranking = Ranking.includes(:ranking_items)
                       .where(user_id: @user.id, genre_id: @current_genre.id, is_public: true)
                       .first
      
      if @ranking
        @ranking_items = @ranking.ranking_items.includes(:shop).order(:position)
      else
        redirect_to public_rankings_path, alert: "指定されたランキングは存在しないか、非公開です。"
        return
      end
    else
      @ranking = Ranking.includes(:user, :ranking_items)
                       .where(id: params[:id], is_public: true)
                       .first
                       
      if @ranking
        @user = @ranking.user
        @current_genre = @ranking.genre
        @ranking_items = @ranking.ranking_items.includes(:shop).order(:position)
      else
        redirect_to public_rankings_path, alert: "指定されたランキングは存在しないか、非公開です。"
        return
      end
    end
  end
  
  private
  
  def set_genres
    @genres = Genre.all
  end
end
