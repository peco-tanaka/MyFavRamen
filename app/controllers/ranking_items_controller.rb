class RankingItemsController < ApplicationController
  before_action :authenticate_user!
  before_action :set_ranking
  before_action :set_ranking_item, only: [:update, :destroy]

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
        format.html { redirected_to edit_ranking_path(@ranking), notice: "ラーメンをランキングに追加しました"}
        format.json { render json: @ranking_item, status: :created }
      else
        format.html { redirect_to edit_ranking_path(@ranking), alert: @ranking_item.errors.full_messages.join(", ") }
        format.json { render json: { errors: @ranking_item.errors.full_messages }, status: :unprocessable_entity }
      end
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
    # フロントエンドのドラッグ＆ドロップ操作の結果をデータベースに反映
    params[:item_position].each do |id, position|
      @ranking.ranking_items.find(id).update(position: position)
    end

    # HTTPステータスコード200（成功）のみをレスポンスとして返す
    head :ok
  end


  private

  def set_ranking
    @ranking = current_user.rankings.find(params[:ranking_id])
  end

  def set_ranking_item
    @ranking_item = @ranking.ranking_items.find(params[:id])
  end

  def ranking_item_params
    params.require(:ranking_item).permit(:shop_id, :menu_name, :position, :comment)
  end
end