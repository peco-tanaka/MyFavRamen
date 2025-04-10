import { Controller } from "@hotwired/stimulus"
import { MapsHelper } from "../utilities/maps_helper";

export default class extends Controller {
  // マップ、現在地マーカー、情報ウィンドウの保持用
  map = null;
  infoWindow = null;
  currentLocationMarker = null;

  // 親コントローラで作成されたマップとInfoWindowをこのコントローラで利用できるようにするメソッド
  // （データ共有のための入口として機能します）
  initialize(map, infoWindow) {
    this.map = map;
    this.infoWindow = infoWindow;
  }

  // 現在地にピンを打つ
  async addCurrentLocationMarker(position) {
    try {
      const { AdvancedMarkerElement, PinElement } = await MapsHelper.loadMapsLibrary("marker");

      // 既存マーカーがあれば削除
      if (this.currentLocationMarker) {
        this.currentLocationMarker.map = null;
      }

      // カスタムピンを作成（赤色）
      const pinElement = new PinElement({
        background: "#FF0000",  // 赤色
        borderColor: "#CC0000", // 濃い赤
        glyphColor: "#FFFFFF",  // 白色の文字
        scale: 1.3,             // 少し大きめに
      });

      // 新しいマーカーを作成
      this.currentLocationMarker = new AdvancedMarkerElement({
        map: this.map,
        position: position,
        title: "現在地",
        content: pinElement.element
      });

      // マーカーがクリックされた時の処理
      this.currentLocationMarker.addListener("gmp-click", () => {
        this.infoWindow.setContent("<div><strong>現在地</strong></div>");
        this.infoWindow.open(this.map, this.currentLocationMarker);
      });

      console.log("現在地マーカーを設置しました", position);

      // 作成したマーカーオブジェクトを呼び出し元に返す
      return this.currentLocationMarker;
    } catch(error) {
      console.error("現在地マーカーの作成中にエラーが発生しました", error);
      return null; // エラー時は明示的に null を返す
    }
  }

  // ラーメン店マーカーを表示
  async addShopMarkers(places) {
    try {
      // markerライブラリを読み込む
      const { AdvancedMarkerElement, PinElement } = await MapsHelper.loadMapsLibrary("marker");
      const markers = [];

      for (const place of places) {
        try {
          // 場所の位置情報がない場合はスキップ
          if (!place.location) {
            console.warn("位置情報のないプレイスをスキップします", place);
            continue;
          }

          // カスタムピンを作成
          const pinElement = new PinElement({
            background: "#FF9800",
            borderColor: "#FFC107",
            glyphColor: "#FFFFFF",
          });

          // マーカーを地図に追加
          const marker = new AdvancedMarkerElement({
            map: this.map,
            position: place.location,
            title: place.displayName,
            content: pinElement.element
          });

          // マーカーがクリックされた時の処理
          marker.addListener("gmp-click", () => {
            const content = `
            <div class="info-window">
              <h5>${place.displayName || '名称不明'}</h5>
              <p>${place.formattedAddress || '住所不明'}</p>
              <p>評価: ${place.rating || '評価なし'} (${place.userRatingCount || 0}件)</p>
            </div>
            `;

            this.infoWindow.setContent(content);
            this.infoWindow.open(this.map, marker);
          });

          markers.push(marker);
        } catch (detailError) {
          console.warn("店舗情報の取得中にエラーが発生しました", detailError);
        }
      }
      return markers;
    } catch(error) {
      console.error("マーカー表示中にエラーが発生しました", error);
      return [];
    }
  }

  async addSingleShopMarker(position, title, customContent = null) {
    try {
      const { AdvancedMarkerElement, PinElement } = await MapsHelper.loadMapsLibrary("marker");

      // カスタムピンを作成
      const pinElement = new PinElement({
        background: "#E65100",
        borderColor: "#FB8C00",
        glyphColor: "#FFFFFF",
        scale: 1.3,
      });

      // マーカーを地図に追加
      const marker = new AdvancedMarkerElement({
        map: this.map,
        position: position,
        title: title,
        content: pinElement.element
      });

      // マーカーがクリックされた時の処理
      marker.addListener("gmp-click", () => {
        const content = customContent || `
          <div class="info-window">
            <h5>${title || '店舗情報'}</h5>
            <p>緯度: ${position.lat.toFixed(6)}, 経度: ${position.lng.toFixed(6)}</p>
          </div>
        `;
        this.infoWindow.setContent(content);
        this.infoWindow.open(this.map, marker);
      });

      console.log(`単一マーカーを追加しました: ${title}`, position )
      return marker; //作成したマーカーを返す
    } catch {
      console.error("単一マーカーの作成中にエラー:", error);
      return null;
    }
  }
}