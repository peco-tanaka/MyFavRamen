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
    begin
      # DBとの重複がないか確認
      existing_shop = Shop.find_by(name: place_params[:name], address: place_params[:address])

      if existing_shop
        # 既存店舗が見つかった時は、そのページへリダイレクト
        render json: { status: "success", redirect_url: shop_path(existing_shop) }
      else
        # 新しい店舗レコードを作成
        shop = Shop.new(
          name: place_params[:name],
          address: place_params[:address],
          phone: place_params[:phone],
          latitude: place_params[:latitude],
          longitude: place_params[:longitude],
          business_hours: place_params[:business_hours],
          website: place_params[:website]
        )
        if shop.save
          # 保存成功時は新店舗の詳細ページURLを返す
          render json: { status: "success", redirect_url: shop_path(shop) }
        else
          # 保存失敗時はエラーメッセージを返す
          render json: { status: "error", errors: shop.errors.full_messages }, status: unprocessable_entity
        end
      end
    rescue ActionController::ParameterMissing => e
      # パラメータがない場合はJson形式でエラーを返す
      render json: { status: "error", message: e.message }, status: :bad_request
    rescue => e
      # その他のエラー時もJson形式で返す
      render json: { status: "error", message: e.message }, status: :internal_server_error
    end
  end

  def show
    set_shop
  end

  private

  def set_shop
    @shop = Shop.find(params[:id])
  end

  # ストロングパラメーター（フロントのデータ用）
  def place_params
    params.permit(:place_id, :name, :address, :phone, :latitude, :longitude, :business_hours, :website
    )
  end
end
