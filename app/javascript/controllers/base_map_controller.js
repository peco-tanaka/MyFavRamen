import { MapsHelper } from "../utilities/maps_helper";

// 通常のJavascriptとして扱う
export default class BaseMapController {



  showLoading() {
    MapsHelper.showElement(this.hasLoadingTarget ? this.loadingTarget : null);
  }

  hideLoading() {
    MapsHelper.hideElement(this.hasLoadingTarget ? this.loadingTarget : null);
  }

  // マップを初期化するメソッド
  async initMap(mapElement, loadingElement, initialCenter = null, initialZoom = 15, shopTitle = null) {
    // mapElement: 地図を表示する DOM 要素 (旧 this.mapTarget の代わり)。
    // loadingElement: ローディング要素 (旧 this.loadingTarget の代わり)。
    // initialCenter: 地図の初期中心座標 (旧 this.latitudeValue, this.longitudeValue から決定していたもの)。
    // initialZoom: ズームレベル。
    // shopTitle: 店舗名 (マーカー表示用、旧 this.shopNameValue の代わり)。
    // 内部では引数 mapElement, loadingElement, initialCenter などを使用
    try {
      this.showLoading();

      // Maps, Markerライブラリを読み込む
      const { Map } = await MapsHelper.loadMapsLibrary("maps");
      const { AdvancedMarkerElement } = await MapsHelper.loadMapsLibrary("marker");

      // 中心座標を決定
      let center = initialCenter; // ★ 引数で受け取った initialCenter を使用

      // initialCenter が有効な座標でなければデフォルト位置を使う
      if (!center || typeof center.lat !== 'number' || typeof center.lng !== 'number') {
        center = MapsHelper.getDefaultLocation();
        console.log("デフォルト位置を使用します:", center);
      } else {
        console.log("指定された中心位置を使用します:", center);
      }

      // Map 初期化で引数 mapElement を使用
      this.map = new Map(mapElement, { /* ... */ });

      // マップを初期化
      this.map = new Map(mapElement, {
        mapId: "491ead61da4cd4ad",
        center: center,
        zoom: initialZoom,
        mapTypeControl: false
      });

      // InfoWindowを初期化
      this.infoWindow = new google.maps.InfoWindow();

      // ★ 初期中心が設定され、かつそれがデフォルト位置でない場合 (店舗座標が渡された場合)
      if (initialCenter && center.lat !== MapsHelper.getDefaultLocation().lat) {
        await this.addShopMarker(center, shopTitle || "店舗の場所"); // ★ shopTitle も使う
      }

      // マップの初期化完了後の処理（子クラスでオーバーライド可能）
      this.afterMapInitialized();

    } catch (error) {
      console.error("マップの初期化中にエラーが発生しました", error);
    } finally {
      this.hideLoading();
    }
  }

  // 店舗マーカーを追加
  async addShopMarker(position, title = "店舗の場所") {
    // titleがなければデフォルトを指定（または呼び出し側で保証）
    if (!title) title = "店舗の場所";

    try {
      const { AdvancedMarkerElement } = await MapsHelper.loadMapsLibrary("marker");

      // マーカーを作成
      const marker = new AdvancedMarkerElement({
        map: this.map,
        position: position,
        title: title,
      });

      console.log("店舗マーカーが設置されました", title, position);
      return marker;
    } catch (error) {
      console.error("店舗マーカーの作成中にエラーが発生しました", error);
    }
  }

  // 子クラスでオーバーライドするためのメソッド
  afterMapInitialized() {
    // 子クラスで実装
  }
}