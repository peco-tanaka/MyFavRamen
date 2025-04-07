class ShopsController < ApplicationController
  before_action :authenticate_user!
  before_action :set_shop, only: [:show]

  def index
    @keyword = params[:keyword]

    # キーワードが入力されている場合のみ検索を実行
    if @keyword.present?
      # DBから検索
      @shops = Shop.where('name LIKE ?', "%#{@keyword}%").limit(20)
      # 検索結果が０件の場合、Google Maps APIの検索結果を使用
      @search_keyword = @keyword if @shops.empty?
    else
      @shops = Shop.none
    end
  end

  def search
    render json: { status: 'success' }
  end

  def show
    set_shop
  end

  private

  def set_shop
    @shop = Shop.find(params[:id])
  end

  def find_shops_with_google_maps_api(keyword)
    # Use Google Maps API to find shops based on the keyword
    # This is a placeholder for actual API integration
    # You would typically use HTTParty or RestClient to make a request to the Google Maps API
    # and parse the response to get shop details.
    # For now, we'll just return an empty array.
    []
  end
end
