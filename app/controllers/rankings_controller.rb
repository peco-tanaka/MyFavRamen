class RankingsController < ApplicationController
  before_action :authenticate_user!

  def index
    @rankings = current_user.rankings.includes(:genre)
    # デフォルトで総合ランキングを表示
    @current_ranking = @rankings.find_by(genre_id: 1)
    @ranking_items = @current_ranking.ranking_items.includes(:shop).order(:position) if @current_ranking
  end

  def show

  end

  def edit
    @user = User.find(params[:id])
    @rankings = @user.rankings
  end

  def update

  end
end
