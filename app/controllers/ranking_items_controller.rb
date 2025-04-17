class RankingItemsController < ApplicationController
  before_action :authenticate_user!
  before_action :set_ranking
  before_action :set_ranking_item, only: [ :update, :destroy, :edit ]

  def create
    @ranking_item = @ranking.ranking_items.build(ranking_item_params)

    # 位置情報がない場合には最後尾に追加
    if params[:ranking_item][:position].blank?
      current_max_position = @ranking.ranking_items.maximum(:position)
      current_max_position = 0 if current_max_position.nil?
      @ranking_item.position = current_max_position + 1
    end

    respond_to do |format|
      if @ranking_item.save
        format.html { redirect_to edit_ranking_path(@ranking), notice: "ラーメンをランキングに追加しました" }
        format.json { render json: @ranking_item, status: :created }
      else
        format.html { redirect_to edit_ranking_path(@ranking), alert: @ranking_item.errors.full_messages.join(", ") }
        format.json { render json: { errors: @ranking_item.errors.full_messages }, status: :unprocessable_entity }
      end
    end
  end

  def edit
    binding.pry
    respond_to do |format|
    # AJAXリクエストの場合はレイアウトなしでレンダリング
      format.html {
        if request.xhr?
          render partial: 'form', locals: { ranking: @ranking, ranking_item: @ranking_item }, layout: false
        else
          # 通常のHTMLリクエストの場合は標準のレイアウトを使用
          render :edit
        end
      }
      format.json { render json: @ranking_item }
    end
  end

  def update
    respond_to do |format|
      if @ranking_item.update(ranking_item_params)
        format.html { redirect_to edit_ranking_path(@ranking), notice: "ラーメンの情報を更新しました" }
        format.json { render json: @ranking_item }
      else
        format.html { redirect_to edit_ranking_path(@ranking), alert: @ranking_item.errors.full_messages.join(", ") }
        format.json { render json: { errors: @ranking_item.errors.full_messages }, status: :unprocessable_entity }
      end
    end
  end

  def destroy
    # 削除するアイテムの現在の順位を保存。後で他のアイテムの順位を更新する際に使用
    position = @ranking_item.position
    @ranking_item.destroy

    # 削除後の順位を再整列
    @ranking.ranking_items.where("position > ?", position).each do |item|
      item.update(position: item.position - 1)
    end

    respond_to do |format|
      format.html { redirect_to edit_ranking_path(@ranking), notice: "ラーメンをランキングから削除しました" }
      format.json { head :no_content }
    end
  end

  def sort
    # トランザクションを使用して、全ての更新が成功した場合のみコミット
    ActiveRecord::Base.transaction do
      params[:item_position].each do |id, position|
        @ranking.ranking_items.find(id).update!(position: position) # 「!」を追加してエラー時に例外を発生
      end
    end
    head :ok
  rescue ActiveRecord::RecordNotFound, ActiveRecord::RecordInvalid => e
    # エラー時の処理
    render json: { error: e.message }, status: :unprocessable_entity
  end
  end


  private

  def set_ranking
    @ranking = current_user.rankings.find(params[:ranking_id])
  end

  def set_ranking_item
    @ranking_item = @ranking.ranking_items.find(params[:id])
  end

  def ranking_item_params
    params.require(:ranking_item).permit(:shop_id, :menu_name, :position, :comment, :photo)
  end
end
