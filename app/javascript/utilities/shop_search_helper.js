// app/javascript/utilities/shop_search_helper.js
import { MapsHelper } from './maps_helper';

export const ShopSearchHelper = {
  // 初期化：コールバック関数を設定
  initialize(callbacks = {}) {
    this.callbacks = {
      onSearchStart: callbacks.onSearchStart || (() => {}),
      onSearchComplete: callbacks.onSearchComplete || (() => {}),
      onSearchError: callbacks.onSearchError || (() => {}),
      onShopSelect: callbacks.onShopSelect || (() => {})
    };
    
    this.searchResults = [];
    return this;
  },

  // 店舗検索を実行するメソッド
  async searchShops(keyword) {
    if (!keyword || keyword.trim() === '') {
      throw new Error('検索キーワードが入力されていません');
    }

    // 検索開始のコールバックを呼び出し
    this.callbacks.onSearchStart();

    try {
      // Places APIを読み込んで検索実行
      const { Place } = await MapsHelper.loadMapsLibrary("places");

      // テキスト検索オプション
      const textSearchOptions = {
        textQuery: `${keyword} ラーメン`,
        fields: ["displayName", "location", "formattedAddress",
                "rating", "userRatingCount", "photos", "id"],
        maxResultCount: 15,
        language: "ja"
      };

      const { places } = await Place.searchByText(textSearchOptions);
      console.log("検索結果:", places);

      // 検索結果を保存
      this.searchResults = places || [];

      // 検索完了のコールバックを呼び出し
      this.callbacks.onSearchComplete(this.searchResults);
      
      return this.searchResults;
    } catch (error) {
      console.error("店舗検索中にエラーが発生しました", error);
      this.callbacks.onSearchError(error);
      throw error;
    }
  },

  // 店舗詳細情報を取得するメソッド
  async getShopDetails(placeId) {
    if (!placeId) {
      throw new Error("Place IDが指定されていません");
    }

    try {
      console.log(`Place ID: ${placeId} の詳細情報を取得します...`);
      const { Place } = await MapsHelper.loadMapsLibrary("places");
      const placeDetails = new Place({ id: placeId, requestedLanguage: "ja" });

      // ShopController#search に必要なフィールドを最低限指定
      await placeDetails.fetchFields({
        fields: ["displayName", "formattedAddress", "photos", "location"]
      });
      console.log("Google Place 詳細取得成功", placeDetails);
      
      return placeDetails;
    } catch (error) {
      console.error("店舗詳細情報の取得中にエラーが発生しました", error);
      throw error;
    }
  },

  // サーバーに店舗情報を送信し、DB上のIDを取得するメソッド
  async registerShopToServer(placeDetails, placeId, csrfToken) {
    if (!csrfToken) {
      throw new Error("CSRFトークンが取得できませんでした");
    }

    try {
      console.log("サーバーに店舗情報を送信し、Shop IDを取得します...");
      const response = await fetch('/shops/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-CSRF-Token': csrfToken
        },
        // 送信するデータ
        body: JSON.stringify({
          place_id: placeId,
          name: placeDetails.displayName,
          address: placeDetails.formattedAddress
        })
      });

      // レスポンスをJSONとして解析
      const result = await response.json();
      console.log("サーバーからの応答:", result);

      // レスポンスチェック
      if (!response.ok || result.status !== 'success' || !result.shop_id) {
        const errorDetail = result.message || result.errors?.join(', ') || `サーバーエラー (${response.status})`;
        throw new Error(`店舗情報の登録に失敗しました: ${errorDetail}`);
      }

      return {
        dbId: result.shop_id,
        placeId: placeId,
        name: placeDetails.displayName,
        address: placeDetails.formattedAddress
      };
    } catch (error) {
      console.error("サーバーへの店舗情報の送信中にエラーが発生しました", error);
      throw error;
    }
  }
};