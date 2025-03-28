class RankingsController < ApplicationController
  def index
    @rankings = Ranking.all
  end

  def show
    @user = User.find(params[:id])
  end
end
