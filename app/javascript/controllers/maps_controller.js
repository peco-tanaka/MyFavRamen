import { Controller } from "@hotwired/stimulus"
import { MapsHelper } from "../utilities/maps_helper";
import BaseMapController from "./base_map_controller";
import MarkerController from "./marker_controller";
import SearchController from "./search_controller";
import ResultsController from "./results_controller";
import { end } from "@popperjs/core";

export default class extends Controller {
  // HTMLから参照するための
  static targets = ["map", "loading", "searchResults", "searchInput", "searchForm", "noResultsMessage"]

  static values = {
    latitude: Number,
    longitude: Number,
    shopName: String,
    keyword: String,
    hasDbResults: Boolean,
    isDetailPage: Boolean,
  }

  // 往路パティ定義（子コントローラーへの参照を維持）
  baseMapController = null;
  markerController = null;
  searchController = null;
  resultsController = null;

  // Google Maps関連オブジェクト
  map = null;
  infoWindow = null;

  connect() {
    if (this.hasMapTarget) {
      console.log("MapsController connected!");
      // ターゲット要素の存在を詳細にログ出力
      console.log("ターゲット検出状況:", {
        mapTarget: this.hasMapTarget,
        searchResultsTarget: this.hasSearchResultsTarget,
        searchInputTarget: this.hasSearchInputTarget,
        searchFormTarget: this.hasSearchFormTarget,
        noResultsMessageTarget: this.hasNoResultsMessageTarget,
        loadingTarget: this.hasLoadingTarget
      });

      this.initializeControllers()
    }
  }

  // 各コントローラーを初期化して連携させる（インスタンスを作成する）
  async initializeControllers() {
    try {
      this.showLoading();

      // 1.base_mapコントローラー初期化。BaseMapControllerのインスタンスを作成
      console.log("BaseMapController を初期化します...");
      this.baseMapController = new BaseMapController();

      // initMap に渡す引数を準備
      const mapElement = this.mapTarget; // 親(maps_controller)が持つターゲット要素
      const loadingElement = this.hasLoadingTarget ? this.loadingTarget : null;
      let initialCenter = null;
      let initialZoom = 15; // 検索ページのデフォルトズーム
      let shopTitle = null;

      // 詳細ページか判定し、引数の値を設定
      if (this.isDetailPageValue && this.hasLatitudeValue && this.hasLongitudeValue) {
        console.log("詳細ページとして地図を初期化します。");
        initialCenter = { lat: this.latitudeValue, lng: this.longitudeValue };
        initialZoom = 16; // 詳細ページは拡大
        shopTitle = this.hasShopNameValue ? this.shopNameValue : null;
      } else {
        console.log("検索/一覧ページとして地図を初期化します。");
      }

      // initialCenter.map()に引数を渡して実行
      await this.baseMapController.initMap(
        mapElement,
        loadingElement,
        initialCenter,
        initialZoom,
        shopTitle
      )

      // 初期化されたマップとInfoWindowの参照を取得
      this.map = this.baseMapController.map;
      this.infoWindow = this.baseMapController.infoWindow;

      // 2.マーカーコントローラーを初期化
      console.log("MarkerController を初期化します...");
      this.markerController = new MarkerController();
      this.markerController.initialize(this.map, this.infoWindow);

      // 3.ページ状態に応じた残りのコントローラーの初期化
      if (this.isDetailPageValue) {
        // ★★★ 詳細ページの場合 ★★★
        console.log("詳細ページの地図初期化完了")
        console.log("詳細ページのため、Results/Search Controller の初期化をスキップします。");
      } else {
        // ★★★ 詳細ページでない場合 (検索/一覧ページ) ★★★
        console.log("検索/一覧ページの初期化を開始します");

        // 3.2 ResultsController 初期化
        this.resultsController = new ResultsController();
        // 店舗選択を処理するコールバック関数を渡す
        this.resultsController.initialize((placeId) => {
          this.handlePlaceSelection(placeId)
        });

        // 結果表示要素があれば共有
        if (this.hasSearchResultsTarget) {
          this.resultsController.searchResultsTarget = this.searchResultsTarget;
          // hasSearchResultsTargetフラグを手動で設定
          this.resultsController.hasSearchResultsTarget = true;
          console.log("searchResultsTargetを設定しました:", this.searchResultsTarget);
        } else {
          console.warn("searchResultsTargetが見つかりません")
        }
        if (this.hasNoResultsMessageTarget) {
          this.resultsController.noResultsMessageTarget = this.noResultsMessageTarget;
          this.resultsController.hasNoResultsMessageTarget = true;
        }
        if (this.hasLoadingTarget) {
          this.resultsController.loadingTarget = this.loadingTarget;
          this.resultsController.hasLoadingTarget = true;
        }

        // 3.3 searchコントローラーを初期化
        this.searchController = new SearchController();
        // 将来の検索結果を処理するためのコールバック関数を渡す
        this.searchController.initialize(this.map, (places) => {
          // 検索が完了した時に得られる結果（places）の表示
          this.resultsController.displayResults(places);
          // マーカーの表示
          this.markerController.addShopMarkers(places);
        });

        // 検索フォーム要素があれば共有
        if (this.hasSearchInputTarget) this.searchController.searchInputTarget = this.searchInputTarget;
        if (this.hasSearchFormTarget) this.searchController.searchFormTarget = this.searchFormTarget;
        if (this.hasKeywordValue) this.searchController.keywordValue = this.keywordValue;
        if (this.hasHasDbResultsValue) this.searchController.hasDbResultsValue = this.hasDbResultsValue;
        if (this.hasSearchResultsTarget) this.searchController.searchResultsTarget = this.searchResultsTarget;

        // 3.4現在地ボタンの設定
        this.setupLocationButton();
      }
    } catch(error) {
      console.error("コントローラーの初期化中にエラーが発生しました", error)
    } finally {
      this.hideLoading();
    }
  }

  // 現在地から検索するボタンを設定
  setupLocationButton() {

    const locationButton = document.createElement("button");
    locationButton.innerHTML = '<i class="bi bi-geo-alt"></i> 近くのお店を検索';
    locationButton.className = "btn btn-primary btn-sm rounded-5 m-2";

    this.map.controls[google.maps.ControlPosition.TOP_CENTER].push(locationButton);

    locationButton.addEventListener("click", async () => {
      await this.getCurrentLocation();
    });
  }

  // 現在地を取得して周辺検索を実行
  async getCurrentLocation() {
    this.showLoading();

    try {
      // 位置情報が利用可能か確認
      if (navigator.geolocation) {
        try {
          // 現在地を取得
          const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: false,
              timeout: 10000,
              maximumAge: 0
            });
            console.log("現在地取得中...");
          });

          // 現在地の座標を指定
          const currentPos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };

          // 地図の中心を現在地に移動
          this.map.setCenter(currentPos);

          // 現在地にピン打ち
          await this.markerController.addCurrentLocationMarker(currentPos);

          // 現在地周辺のラーメン店を検索
          await this.searchController.searchNearbyRamenShops(currentPos);

        } catch (geoError) {
          console.warn("現在地の取得に失敗しました。デフォルト位置を使用します", geoError);
          alert("現在地の取得に失敗しました。");
        }
      } else {
        console.warn("お使いのブラウザは位置情報をサポートしていません");
        alert("お使いのブラウザは位置情報をサポートしていません。");
      }
    } catch (error) {
      console.error("現在地取得処理中にエラーが発生しました", error);
    } finally {
      this.hideLoading();
    }
  }

  // 検索フォーム（html.erbの送信フォーム）送信時の処理
  async search(event) {
    if (event) event.preventDefault();

    console.log("Search method called, searchController:", this.searchController);

    // searchController の存在チェック（呼び出し前に行う方が安全）
    if (!this.searchController) {
      console.error("検索コントローラーが初期化されていません。");
      // 必要であればここで初期化を試みるか、エラーメッセージを表示
      // await this.initializeControllers(); // ここで初期化するかどうかは設計次第
      // if (!this.searchController) {
      //   console.error("検索コントローラーの再初期化に失敗しました。");
      //   return;
      // }
      return; // シンプルに中断する場合
    }

    // searchInputTarget からキーワードを取得
    const keyword = this.hasSearchInputTarget ? this.searchInputTarget.value.trim() : '';

    console.log("検索開始時のキーワード値:", {
      "入力欄の値": keyword, // 取得した値を使用
      "keywordValue(Stimulus)": this.hasKeywordValue ? this.keywordValue : "値なし", 
      "data属性": this.element.getAttribute('data-maps-keyword-value')
    });

    // キーワードが空の場合はここで処理を中断しても良い
    if (!keyword) {
      console.log("検索キーワードが入力されていません。");
      // alert("検索キーワードを入力してください。"); // ユーザーへの通知
      return;
    }

    this.showLoading();
    try {
      // ★★★ searchShops に取得した keyword を渡す ★★★
      await this.searchController.searchShops(keyword);
    } catch {
    // searchShops内でエラーが捕捉されなかった場合のエラーハンドリング
    console.error("検索処理の呼び出し中にエラーが発生しました:", error);
    } finally {
      this.hideLoading();
    }
  }

  // 店舗選択時の処理。引数が event オブジェクトの場合と、直接 placeId (文字列) の場合の両方に対応
  async handlePlaceSelection(eventOrPlaceId) {
    this.showLoading();
    let placeId = null

    // 1.引数がイベントオブジェクトかどうかを判定
    if (eventOrPlaceId && typeof eventOrPlaceId === 'object' && eventOrPlaceId.currentTarget) {
      // 引数がイベントオブジェクトの場合
      const event = eventOrPlaceId;
      console.log("handlePlaceSelection がイベントオブジェクトを受け取りました");

      // ★★★ イベントのデフォルト動作（aタグの遷移など）をキャンセル ★★★
      event.preventDefault();

      // ★★★ イベントターゲット（クリックされた要素）から data-place-id を取得 ★★★
      // event.currentTarget は data-action が設定された要素を指す
      placeId = event.currentTarget.getAttribute("data-place-id");
      console.log("イベントから placeId を取得:", placeId);

    } else if (typeof eventOrPlaceId === 'string') {
      // 引数が文字列(placeId)の場合（将来的にコールバック経由などで呼ばれる可能性も考慮）
      console.log("handlePlaceSelection が placeId 文字列を受け取りました:", eventOrPlaceId)
      placeId = eventOrPlaceId
    }

    // 2.placeIdが取得できたか確認
    if (!placeId) {
      console.error("handlePlaceSelection: placeId を特定できませんでした。引数:", eventOrPlaceId);
      alert("店舗情報の取得に失敗しました。");
      this.hideLoading();
      return;
    }

    // 3.placeIdを使って Place オブジェクトを作成
    try {
      const { Place } = await MapsHelper.loadMapsLibrary("places");

      // Google Maps APIから店舗の詳細情報を取得
      // ★★★ ここで placeId が文字列として正しく渡される（idは文字列しか受け取らない） ★★★
      const place = new Place({
        id: placeId,
        requestedLanguage: "ja",
      });

      // 取得したい店舗のフィールドを指定
      await place.fetchFields({
        fields: ["displayName", "location", "formattedAddress",
          "nationalPhoneNumber", "rating", "businessStatus",
          "regularOpeningHours", "websiteURI"],
      });

      console.log("場所の詳細情報:", place);

      // 位置情報の取得
      let latitude = null;
      let longitude = null;

      // placeのlocationプロパティから、緯度と経度を取り出して変数に格納
      // 緯度 (lat) の型が数値型であるか関数型であるかをチェック（古いAPI方式に対応）
      if (place.location) {
        if (typeof place.location.lat === 'number') {
          latitude = place.location.lat;
          longitude = place.location.lng;
        } else if (typeof place.location.lat === 'function') {
          latitude = place.location.lat();
          longitude = place.location.lng();
        }
      }

      // バックエンドに店舗情報を送信
      const response = await fetch('/shops/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': document.querySelector("[name='csrf-token']").content
        },
        body: JSON.stringify({
          place_id: place.id,
          name: place.displayName,
          address: place.formattedAddress,
          phone: place.nationalPhoneNumber,
          latitude: latitude,
          longitude: longitude,
          business_hours: place.regularOpeningHours?.weekdayDescriptions?.join(', '),
          website: place.websiteURI
        })
      });

      const result = await response.json();



      if (result.status === 'success' && result.redirect_url) {
        window.location.href = result.redirect_url;
      } else {
        console.error("サーバーでの店舗処理に失敗:", result);
        alert("店舗情報の処理中にエラーが発生しました。");
      }
    } catch (error) {
      console.error("店舗詳細の取得またはサーバー送信中にエラーが発生しました", error);
      alert(`店舗情報の取得中にエラーが発生しました: ${error.message || error}`); // エラー内容を通知
    } finally {
      this.hideLoading(); // 元コードの this.hideLoading を this.hideLoading() に修正
    }
  }
  // ユーティリティメソッド:ローディング
  showLoading() {
    if (this.hasLoadingTarget) {
      this.loadingTarget.style.display = 'flex';
    }
  }

  hideLoading() {
    if (this.hasLoadingTarget) {
      this.loadingTarget.style.display = 'none';
    }
  }

}
