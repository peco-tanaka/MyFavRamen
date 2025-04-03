import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["map"]

  connect() {
    if (this.hasMapTarget) {
      console.log("MapsController connected!")
      this.initMap()
    }
  }

  async initMap() {
    try {
      // Mapsライブラリを読み込む
      const { Map } = await google.maps.importLibrary("maps");

      // デフォルト位置（東京）
      let center = { lat: 35.6812, lng: 139.7671 };

      // 位置情報が利用可能か確認
      if (navigator.geolocation) {
        try {
          // 現在地を取得（Promiseを利用して非同期処理）
          const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 5000,
              maximumAge: 0
            })
          });

          // 現在地の座標を設定
          center = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          console.log("現在地を取得しました:", center);
        } catch (geoError) {
          console.warn("現在地の取得に失敗しました。デフォルト位置（東京）を使用します", geoError);
        };
      };

      // マップを初期化
      this.map = new Map(this.mapTarget, {
        center: { lat:35.6812, lng: 139.7671 },
        zoom: 14,
      });

      // Places APIを初期化（必要な場合）
      const { PlacesService } = await google.maps.importLibrary("places");
      this.placesService = new PlacesService(this.map);
  } catch (error) {
    console.error("マップの初期化中にエラーが発生しました", error)
  }

}

// 公式ドキュメントコード
// let map;
// let placesService;

// document.addEventListener('turbo:load', function() {

//   initMap();
// });

// async function initMap() {
//   const { Map } = await google.maps.importLibrary("maps");

//   map = new Map(document.getElementById("map"), {
//     center: { lat: -34.397, lng: 150.644 },
//     zoom: 8,
//   });
// }

// initMap()