class ShopsController < ApplicationController
  before_action :authenticate_user!

  def index
    @keyword = params[:keyword]

    # キーワードが入力されている場合のみ検索を実行
    if @keyword.present?
      @shops = Shop.where('name LIKE ?', "%#{@keyword}%").limit(20)
    else
      @shops = []
    end
  end

  def search
    @keyword = params[:keyword]
    @shops = find_shops_with_google_maps_api(@keyword)
    render :index
  end

  def show
    @shop = Shop.find(params[:id])
  end

  private


  def find_shops_with_google_maps_api(keyword)
    # Use Google Maps API to find shops based on the keyword
    # This is a placeholder for actual API integration
    # You would typically use HTTParty or RestClient to make a request to the Google Maps API
    # and parse the response to get shop details.
    # For now, we'll just return an empty array.
    []
  end
end
