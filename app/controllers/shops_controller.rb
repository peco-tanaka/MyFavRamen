class ShopsController < ApplicationController
  before_action :authenticate_user!

  def index
    if params[:keyword].present?
      @shops = Shop.where('name LIKE ?', "%#{params[:keyword]}%")
    else
      @shops = Shop.all.limit(10)
    end

    # この時点では Google API からの結果はまだなし
    # JavaScript側で API 検索を行う
  end

  def search
    @keyword = params[:keyword]
    @shops = find_shops_with_google_maps_api(@keyword)

    # ここで Google Maps API を使ってショップを検索し、結果を @shops に格納します
    # 例: @shops = GoogleMapsService.search_shops(@keyword)
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
