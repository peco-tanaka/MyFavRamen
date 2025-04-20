class RankingsController < ApplicationController
  before_action :authenticate_user!
  before_action :set_ranking, only: [ :show ]
  before_action :set_genres, only: [ :index, :show, :genre, :edit ]
  before_action :set_genres_and_current_genre, only: [ :edit, :update ]
  before_action :set_ranking_by_current_genre, only: [ :edit, :update ]
  before_action :ensure_ranking_created, only: [ :index ]

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
    @current_ranking = @ranking
    if @ranking
      @ranking_items = @ranking.ranking_items.includes(:shop).order(:position)
      render :show
    else
      # ジャンルに対応するランキングがなければ作成する
      @ranking = current_user.rankings.create(genre_id: @genre_id, is_public: true)
      @current_ranking = @ranking # ここでも@current_rankingを更新
      @ranking_items = []
      redirect_to edit_genre_ranking_rankings_path(@current_ranking.genre_id)
    end
  end

  def edit
    if @ranking.nil?
      # ランキングが存在しない場合、新規作成用のオブジェクトを準備
      @ranking = current_user.rankings.build(genre_id: @current_genre.id)
      @ranking_items = []
    else
      @current_ranking = @ranking
      # 既存のランキングの場合、アイテムを取得
      @ranking_items = @ranking.ranking_items.order(:position)
    end
  end

  def update
    if @ranking.nil?
      # ランキングが存在しない場合、新規作成として処理
      @ranking = current_user.rankings.build(ranking_params)
      # genre_id が params に含まれていない場合があるので、@current_genre から設定
      @ranking.genre_id ||= @current_genre.id

      if @ranking.save
        redirect_to edit_genre_ranking_path(genre_id: @ranking.genre_id), notice: "ランキングを作成しました。"
      else
        @ranking_items = []
        flash.now[:alert] = "ランキングの保存に失敗しました"
        render :edit, status: :unprocessable_entity
      end
    else
      # 既存のランキングを更新
      if @ranking.update(ranking_params)
        redirect_to ranking_path(@ranking)
      else
        # 更新に失敗時 edit を再描画
        @ranking_items = @ranking.ranking_items.includes(:shop).order(:position)
        flash.now[:alert] = "ランキングの更新に失敗しました"
        render :edit, status: :unprocessable_entity
      end
    end
  end

  private

  def set_genres_and_current_genre
    @genres = Genre.all
    genre_id = params[:genre_id]

    if genre_id.present?
      @current_genre = Genre.find_by(id: genre_id)
    end

    # @current_genre が見つからない場合のエラー処理
    unless @current_genre
      redirect_to rankings_path, alert: "無効なジャンルです。" and return
    end
  end

  def set_ranking_by_current_genre
    # set_genres_and_current_genre が呼ばれ、@current_genre が設定されている前提
    if @current_genre
      @ranking = current_user.rankings.find_by(genre_id: @current_genre.id)
    else
      @ranking = nil # genre がなければ紐づく ranking も nil
    end
  end

  def ranking_params
    params.require(:ranking).permit(:is_public)
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
