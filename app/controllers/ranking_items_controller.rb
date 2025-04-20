class RankingItemsController < ApplicationController
  before_action :authenticate_user!
  before_action :set_ranking
  before_action :set_ranking_item, only: [ :update, :destroy, :edit ]

  def create
    @current_ranking = @ranking

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
        format.html { redirect_to edit_genre_ranking_rankings_path(@current_ranking.genre_id) }
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
        format.html { redirect_to edit_genre_ranking_rankings_path(@current_ranking.genre_id), alert: @ranking_item.errors.full_messages.join(", ") }
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
    @current_ranking = @ranking

    respond_to do |format|
      # Photo のattach 処理
      photo_to_attach = params[:ranking_item][:photo] if params[:ranking_item].present?

      if @ranking_item.update(ranking_item_params_for_update)
        @ranking_item.photo.attach(photo_to_attach) if photo_to_attach.present? && photo_to_attach.respond_to?(:tempfile)
        format.html { redirect_to edit_genre_ranking_rankings_path(@current_ranking.genre_id) }
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
    @current_ranking = @ranking

    # 削除するアイテムの現在の順位を保存。後で他のアイテムの順位を更新する際に使用
    position = @ranking_item.position
    @ranking_item.destroy

    # 削除後の順位を再整列
    @ranking.ranking_items.where("position > ?", position).each do |item|
      item.update(position: item.position - 1)
    end

    respond_to do |format|
      format.html { redirect_to edit_genre_ranking_rankings_path(@current_ranking.genre_id), notice: "ラーメンをランキングから削除しました" }
      format.json { head :no_content }
    end
  end

  def sort
    # --- 1. パラメータ検証・整形フェーズ ---
    begin
      # to_unsafe_h で順位情報ハッシュ形式にして一度受け取る
      raw_item_positions = params.require(:item_position).to_unsafe_h

      # 受け取ったデータが本当に { ID(数値文字列) => Position(数値文字列) } か検証・整形
      item_positions = {} # ★ item_positions をここで定義 ★
      raw_item_positions.each do |id_key, position_val|
        # キーと値が nil でないことを確認
        next if id_key.nil? || position_val.nil?
        # キーと値を文字列に変換
        id_str = id_key.to_s
        position_str = position_val.to_s
        # 数字のみかチェック
        next unless id_str.match?(/\A\d+\z/) && position_str.match?(/\A\d+\z/)
        # 整数に変換して新しいハッシュに入れる
        item_positions[id_str.to_i] = position_str.to_i
      end

      # もし有効なデータが一つもなければエラー (ArgumentErrorを発生させる)
      if item_positions.empty? && !raw_item_positions.empty?
        raise ArgumentError, "不正な形式のパラメータです。"
      end

    # --- パラメータ検証フェーズのエラーを捕捉 ---
    rescue ActionController::ParameterMissing => e
      Rails.logger.error("ParameterMissing in RankingItemsController#sort: #{e.message}")
      render json: { error: "必須パラメータ(item_position)がありません: #{e.message}" }, status: :bad_request # 400
      return # メソッドを抜ける
    rescue ArgumentError => e
      Rails.logger.error("ArgumentError (validation) in RankingItemsController#sort: #{e.message}")
      render json: { error: e.message }, status: :bad_request # 400
      return # メソッドを抜ける
    end # begin に対する end

    # --- 2. データベース更新フェーズ ---
    begin
      ActiveRecord::Base.transaction do
        # ★★★ 検証済みの item_positions を使って DB 更新 ★★★
        item_positions.each do |id, position|
          item = @ranking.ranking_items.find(id)
          item.insert_at(position)
        end
      end
      head :ok # 成功したら 200 OK を返す

    # --- DB 更新フェーズのエラーを捕捉 ---
    rescue ActiveRecord::RecordInvalid => e
      Rails.logger.error("RecordInvalid in RankingItemsController#sort: #{e.message}")
      Rails.logger.error(e.backtrace.join("\n"))
      render json: { error: "更新内容に問題があります: #{e.message}" }, status: :unprocessable_entity # 422
    rescue ActiveRecord::RecordNotFound => e
      Rails.logger.error("RecordNotFound in RankingItemsController#sort: #{e.message}")
      Rails.logger.error(e.backtrace.join("\n"))
      render json: { error: "指定されたアイテムが見つかりません: #{e.message}" }, status: :not_found # 404
    rescue => e # その他の予期せぬエラー
      Rails.logger.error("Unexpected DB error in RankingItemsController#sort: #{e.class.name} - #{e.message}")
      Rails.logger.error(e.backtrace.join("\n"))
      render json: { error: "順序の更新中に予期せぬエラーが発生しました: #{e.message}" }, status: :internal_server_error # 500
    end # begin に対する end
  end # def sort に対する end

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
      :is_manual,           # 手動入力フラグ
      :manual_shop_name,    # 手動入力用店舗名
      :manual_shop_address  # 手動入力用住所
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
