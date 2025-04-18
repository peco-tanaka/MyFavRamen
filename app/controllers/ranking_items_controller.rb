class RankingItemsController < ApplicationController
  before_action :authenticate_user!
  before_action :set_ranking
  before_action :set_ranking_item, only: [ :update, :destroy, :edit ]

  def create
    # 1 .Strong Parameters を使用してRankingItem オブジェクトを作成、変数に格納
    # ranking_item_params で :shop_id が許可され、フロントから送られてくる前提
    @ranking_item = @ranking.ranking_items.build(ranking_item_params)

    # 2 .Photo のattach 処理
    if params[:ranking_item].present? && params[:ranking_item][:photo].present? &&
        params[:ranking_item][:photo].respond_to?(:tempfile) # アップロードされたファイルか簡易チェック
      @ranking_item.photo.attach(params[:ranking_item][:photo])
    end

    # 3 .順位（position）の設定。末尾に追加する場合
    if @ranking_item.position.blank?
      current_max_position = @ranking.ranking_items.maximum(:position) || 0
      @ranking_item.position = current_max_position + 1
    end

    # 4. 保存処理とレスポンス
    respond_to do |format|
      if @ranking_item.save # 保存成功時
        format.html { redirect_to edit_ranking_path(@ranking) }
        format.json {
          render json: {
            id: @ranking_item.id,
            shop_name: @ranking_item.shop&.name,
            menu_name: @ranking_item.menu_name,
            position: @ranking_item.position,
            comment: @ranking_item.comment,
            # photo があれば URLを含める
            photo_url: @ranking_item.photo.attached? ? url_for(@ranking_item.photo) : nil
          }, status: :created
        }
      else # 保存失敗時
        format.html { redirect_to edit_ranking_path(@ranking), alert: @ranking_item.errors.full_messages.join(", ") }
        format.json {
          render json: {
            errors: @ranking_item.errors.full_messages # errorsキーにエラーメッセージ配列をセット
          }, status: :unprocessable_entity # ステータスコードを指定
        }
      end
    end
  end

  def edit
    respond_to do |format|
      # AJAXリクエストの場合はレイアウトなしでレンダリング
      format.html {
        if request.xhr?
          render partial: "shared/form", locals: { ranking: @ranking, ranking_item: @ranking_item }, layout: false
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
      # Photo のattach 処理
      photo_to_attach = params[:ranking_item][:photo] if params[:ranking_item].present?

      if @ranking_item.update(ranking_item_params_for_update)
        @ranking_item.photo.attach(photo_to_attach) if photo_to_attach.present? && photo_to_attach.respond_to?(:tempfile)
        format.html { redirect_to edit_ranking_path(@ranking) }
        format.json {
          render json: {
          # JSON形式で必要な情報を返す
          id: @ranking_item.id,
          shop_name: @ranking_item.shop&.name,
          menu_name: @ranking_item.menu_name,
          position: @ranking_item.position,
          comment: @ranking_item.comment,
          photo_url: @ranking_item.photo.attached? ? url_for(@ranking_item.photo) : nil
          }, status: :ok
        }
      else
        format.html {
          render :edit, status: :unprocessable_entity
        }
        format.json {
          render json: {
            errors: @ranking_item.errors.full_messages
          }, status: :unprocessable_entity
        }
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


  private

  def set_ranking
    @ranking = current_user.rankings.find(params[:ranking_id])
  end

  def set_ranking_item
    @ranking_item = @ranking.ranking_items.find(params[:id])
  end

  def ranking_item_params
    # ★ RankingItem モデルが直接持つ (または関連で受け付ける) 属性と手動入力用属性を許可 ★
    params.require(:ranking_item).permit(
      :shop_id,     # ★ フロントから送られてくるDB上のShop ID
      :menu_name,   # メニュー名
      :comment,     # コメント (なければ nil or 空文字)
      :position,     # 順位 (並び替え機能があるなら、ここでは不要かも？)
      :is_manual,           # ★ 手動入力フラグを追加 ★
      :manual_shop_name,    # ★ 手動入力用店舗名を追加 ★
      :manual_shop_address  # ★ 手動入力用住所を追加 ★
    )
  end

  # update 用の params。shop_id は更新させない
  def ranking_item_params_for_update
    params.require(:ranking_item).permit(
      :menu_name,
      :comment,
      :position,
      :manual_shop_name,
      :manual_shop_address)
  end
end
