class RankingsController < ApplicationController
  before_action :authenticate_user!
  before_action :set_ranking, only: [:show, :edit, :update]
  before_action :set_genres, only: [:index, :show, :genre, :edit]
  before_action :ensure_ranking_created, only: [:index]

  def index
    @rankings = current_user.rankings
    # デフォルトで総合ランキングを表示
    @current_ranking = @rankings.find_by(genre_id: 1)
    @ranking_items = @current_ranking.ranking_items.includes(:shop).order(:position) if @current_ranking

    # 初期表示用のジャンルも設定する
    @current_genre = Genre.find_by(id: 1)
  end

  def show
    @ranking_items = @ranking.ranking_items.includes(:shop).order(:position)
    @current_genre = @ranking.genre
    @current_ranking = @ranking # @current_rankingを追加して、ビュー側で一貫して使えるようにする
  end

  def genre
    @genre_id = params[:genre_id].to_i
    @genre = Genre.find(@genre_id)
    @current_genre = @genre
    @ranking = current_user.rankings.find_by(genre_id: @genre_id)
    @current_ranking = @ranking # @current_rankingも設定する

    if @ranking
      @ranking_items = @ranking.ranking_items.includes(:shop).order(:position)
      render :show
    else
      # ジャンルに対応するランキングがなければ作成する
      @ranking = current_user.rankings.create(genre_id: @genre_id, is_public: true)
      @current_ranking = @ranking # ここでも@current_rankingを更新
      @ranking_items = []
      redirect_to edit_ranking_path(@ranking), notice: "#{@genre.name}のランキングを作成しました"
    end
  end

  def edit
    @ranking_items = @ranking.ranking_items.includes(:shop).order(:position)
    
    # URLからのgenre_idパラメータがある場合は、そのジャンルを@current_genreとして設定
    if params[:genre_id].present?
      @current_genre = Genre.find_by(id: params[:genre_id])
    end
    
    # genre_idパラメータがないか、該当するジャンルが見つからない場合は@ranking.genreを使用
    @current_genre ||= @ranking.genre
    
    @shops = Shop.all
  end

  def update
    if @ranking.update(ranking_params)
      redirect_to ranking_path(@ranking), notice: "#{@ranking.genre.name}のランキングを更新しました"
    else
      # 更新に失敗した時はランキング項目を再度取得して変種画面に戻る
      @ranking_items = @ranking.ranking_items.includes(:shop).order(:position)
      render :edit
    end
  end

  private

  def ranking_params
    params.require(:ranking).permit(is_public)
  end

  # ログインユーザーのランキングを取得
  def set_ranking
    @ranking = current_user.rankings.find(params[:id])
  end

  # ジャンル切り替えボタンの値を取得
  def set_genres
    @genres = Genre.all
  end

  # ランキングが存在しない場合は自動で新規作成
  def ensure_ranking_created
    if current_user.rankings.empty?
      Genre.all.each do |genre|
        current_user.rankings.create(genre_id: genre.id, is_public: true)
      end
      flash[:notice] = "全てのジャンルのランキングが作成されました。お店を追加してランキングを作りましょう！"
    end
  end

end
