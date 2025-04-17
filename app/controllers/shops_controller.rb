class ShopsController < ApplicationController
  before_action :authenticate_user!
  before_action :set_shop, only: [ :show ]

  def index
    @keyword = params[:keyword]

    # キーワードが入力且つボタンが押された場合のみ検索を実行
    if @keyword.present? && params[:commit].present?
      # DBから検索
      @shops = Shop.where("name LIKE ?", "%#{@keyword}%").limit(15)
      # 検索結果がDBに存在するか確認し、その真偽地を変数に格納
      @has_db_results = @shops.exists?
    else
      @keyword = nil
      @shops = []
      @has_db_results = false
    end

    @search_keyword = @keyword
  end

  def search
    # 1. 必要なパラメータがあるかチェック
    # ヘルパーメソッド place_params_present? を後で定義
    unless place_params_present?
      # パラメータが不足している場合はエラーレスポンスを返す
      render json: { status: "error", message: "店舗情報の特定に必要なパラメータ（place_id または name と address）が不足しています。" }, status: :bad_request
      return # ここで処理を終了
    end

    # 2. Shop の検索 または 新規作成を試みる
    shop = find_or_create_shop_from_params

    # 3. 処理結果に応じてJSONレスポンスを返す
    if shop&.persisted? # shop オブジェクトが存在し、かつDBに保存されているか？
      # 成功！ shop_id を含んだJSONを返す
      render json: {
        status: "success",
        shop_id: shop.id, # ★★★ これが最も重要な情報 ★★★
        redirect_url: shop_path(shop),   # ★ shop_path ヘルパーで詳細ページのURLを生成し、redirect_url として追加
        message: "店舗情報を取得しました。" # 必要に応じてメッセージを追加
      }, status: :ok # HTTP 200 OK (既存が見つかった場合、または新規作成成功した場合)
    elsif shop # shopオブジェクトはできたが、保存に失敗した場合 (バリデーションエラーなど)
      # 保存失敗
      render json: {
        status: "error",
        errors: shop.errors.full_messages # バリデーションエラーメッセージを返す
      }, status: :unprocessable_entity # HTTP 422 Unprocessable Entity
    else
      # shop が nil の場合 (find_or_create_shop_from_params で予期せぬ問題)
      render json: {
        status: "error",
        message: "店舗情報の処理中に不明なエラーが発生しました。"
      }, status: :internal_server_error # HTTP 500 Internal Server Error
    end
  # 4. 例外処理
  rescue ActionController::ParameterMissing => e
    # params.require などで発生する可能性のあるエラー
    render json: { status: "error", message: "リクエストパラメータが不正です: #{e.message}" }, status: :bad_request
  rescue => e # その他の予期せぬエラー (DB接続エラーなど)
    # エラーログを出力しておくことが重要
    Rails.logger.error "ShopsController#search でエラーが発生しました: #{e.message}"
    Rails.logger.error e.backtrace.join("\n")
    render json: { status: "error", message: "サーバー内部でエラーが発生しました。" }, status: :internal_server_error
  end

  def show
    set_shop
  end

  private

  def set_shop
    @shop = Shop.find(params[:id])
  end

  # shop を検索 または 新規作成するロジック
  def find_or_create_shop_from_params
    # ストロングパラメーターで許可された値を取得
    permitted_params = place_params
    place_id = permitted_params[:place_id]
    name = permitted_params[:name]
    address = permitted_params[:address]

    # 結果を格納する変数を初期化
    shop = nil

    # 1. Google Place ID で検索
    if place_id.present?
      # find_by は見つからない場合に nil を返す
      shop = Shop.find_by(google_place_id: place_id)
      return shop if shop
    end

    # 2. 手動入力の場合は name と address で検索
    if name.present? && address.present?
      shop = Shop.find_by(name: name, address: address)
      return shop if shop
    end

    # 3. 新規作成
    # 上記の検索で見つからなかった場合、新しい Shop オブジェクトを作成
    # Shop.new はメモリ上にオブジェクトを作るだけで、まだDBには保存しない
    shop = Shop.new(
      google_place_id: place_id,
      name: name,
      address: address,
      phone: permitted_params[:phone],
      latitude: permitted_params[:latitude],
      longitude: permitted_params[:longitude],
      business_hours: permitted_params[:business_hours],
      website: permitted_params[:website]
    )

    # DBへの保存を試みる
    # 失敗した場合でも、shop オブジェクトには errors が格納されている
    shop.save

    # 作成された (または保存に失敗した) shop オブジェクトを返す
    shop
  end

  # 必要なパラメータがあるかチェックするメソッド
  def place_params_present?
    # JavaScriptからは place_id (Google Place ID) が送られてくるはず。
    # または、手動入力の場合は name と address が送られてくる想定。
    # どちらかがあればOK
    params[:place_id].present? || (params[:name].present? && params[:address].present?)
  end

  # ストロングパラメーター（フロントのデータ用）
  # JavaScriptから送られてくるキーを許可する
  def place_params
    params.permit(
      :place_id, # Google Place ID (重要)
      :name,
      :address,
      :phone,
      :latitude,
      :longitude,
      :business_hours,
      :website
    )
  end
end
