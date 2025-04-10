import { Controller } from "@hotwired/stimulus"
import { MapsHelper } from "../utilities/maps_helper"

export default class extends Controller {
  static targets = ["searchInput", "searchForm", "searchResults"];

  static values = {
    keyword: String,
    hasDbResults: Boolean
  };

  // マップと検索結果を処理するコールバック関数の参照用
  map = null;
  onResultsFound = null;

  // 親コントローラーから必要なオブジェクトとコールバックを受け取るメソッド
  initialize(map, onResultsFound) {
    this.map = map;
    this.onResultsFound = onResultsFound;
  }

  // フォーム送信時、キーワード検索を実行するメソッド
  async searchShops(keyword) {
    console.log("searchShopsにアクセス成功！")

    // ★ 引数 keyword のチェックに変更
    if (!keyword) {
      console.log("検索キーワードが空のため検索を中止します");
      // 結果がないことを親コントローラーに通知
      if (this.onResultsFound && typeof this.onResultsFound === 'function') {
          this.onResultsFound([]);
      }
      return; // 検索中止
    }

    console.log("検索処理を開始します。キーワード:", keyword);

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

      // 結果を親コントローラーに通知
      if (this.onResultsFound && typeof this.onResultsFound === 'function') {
        this.onResultsFound(places || []);
      }
    } catch(error) {
      console.error("店舗検索中にエラーが発生しました", error);

      // エラー時も親コントローラーに通知
      if (this.onResultsFound && typeof this.onResultsFound === 'function') {
        this.onResultsFound([]);
      }
    }
  }

  // 現在地周辺のラーメン店を検索するメソッド
  async searchNearbyRamenShops(location) {
    console.log("近隣のラーメン店を検索します", location);

    try {
      const { Place } = await MapsHelper.loadMapsLibrary("places");

      // 必須フィールドを含む検索オプションを定義
      const textSearchOptions = {
        textQuery: "ラーメン",
        locationBias: location,
        fields: ["displayName", "location", "formattedAddress", "rating", "userRatingCount", "photos", "id"],
        maxResultCount: 15,
        language: "ja"
      };

      // テキスト検索を実行
      const { places } = await Place.searchByText(textSearchOptions);
      console.log("検索結果:", places);

      // 検索結果を親コントローラーに通知
      if (this.onResultsFound && typeof this.onResultsFound === 'function') {
        this.onResultsFound(places || []);
      }

      return places || [];
    } catch (error) {
      console.error("ラーメン店の検索中にエラーが発生しました", error);

      if (this.onResultsFound && typeof this.onResultsFound === 'function') {
        this.onResultsFound([]);
      }

      return [];
    }
  }
}