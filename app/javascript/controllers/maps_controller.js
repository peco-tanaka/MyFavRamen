import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["map"]
  static values = {
    latitude: Number,
    longitude: Number,
    shopName: String
  }

  connect() {
    if (this.hasMapTarget) {
      console.log("MapsController connected!")
      this.initMap()
    }
  }

  // Place APIが必要になった場合は、trueに設定
  get needsPlacesApi() {
    return false;
  }

  async initMap() {
    try {
      // Maps, Markerライブラリを読み込む
      const { Map } = await google.maps.importLibrary("maps");
      const { AdvancedMarkerElement, PinElement } = await google.maps.importLibrary("marker");

      // 店舗の位置を優先して使用
      let center;

      if(this.hasLatitudeValue && this.hasLongitudeValue) {
        // 店舗の経緯・緯度がわかる場合は使用
        center = {
          lat: this.latitudeValue,
          lng: this.longitudeValue
        };
        console.log("店舗の位置情報を取得しました:", center);
      } else {
        // デフォルト位置（東京）
        center = { lat: 35.6812, lng: 139.7671 };
        console.log("デフォルト位置を使用します:", center);
      }

      // マップを初期化
      const map = new google.maps.Map(this.mapTarget, {
        mapId: "491ead61da4cd4ad",  // マップIDを指定
        center: center,
        zoom: 15,
      });

      if(this.hasLatitudeValue && this.hasLongitudeValue) {
        // マーカーを作成
        const marker = new AdvancedMarkerElement({
          map: map,         // map オブジェクトを渡す
          position: center,
          title: this.hasShopNameValue ? this.shopNameValue : "ラーメン店",
        });
        console.log("マーカーが設置されました", center);
      }

      // ポップアップウィンドウを定義
      const infoWindow = new google.maps.InfoWindow();

      // ここで handleLocationError 関数をローカルに定義
      const handleLocationError = (browserHasGeolocation, infoWindow, pos) => {
        infoWindow.setPosition(pos);
        infoWindow.setContent(
          browserHasGeolocation
            ? "エラー: 位置情報の取得に失敗しました。"
            : "エラー: お使いのブラウザは位置情報をサポートしていません。"
        );
        infoWindow.open(map); // ローカル関数内ではmapにアクセスできます
      };

      // 現在地取得ボタンの作成
      const locationButton = document.createElement("button");
      locationButton.textContent = "現在地に移動";
      locationButton.classList.add("custom-map-control-button");
      map.controls[google.maps.ControlPosition.TOP_CENTER].push(locationButton);
      // ボタンが作成
      console.log("現在地取得ボタンが作成されました");

      // ここでボタンクリック時の挙動を定義しています
      locationButton.addEventListener("click", async () => {
        // 位置情報が利用可能か確認
        if (navigator.geolocation) {
          try {
            // 現在地を取得（Promiseを利用して非同期処理）
            const position = await new Promise((resolve, reject) => {
              navigator.geolocation.getCurrentPosition(resolve, reject, {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 0
              });
              console.log("現在地取得完了");
            });

            // 現在地の座標を設定
            const currentPos = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            };

            // 情報ウィンドウを表示
            infoWindow.setPosition(currentPos);
            infoWindow.setContent("現在地を取得しました");
            infoWindow.open(map);

            // 地図の中心を現在地に移動
            map.setCenter(currentPos);

            console.log("現在地を取得しました:", currentPos);
          } catch (geoError) {
            console.warn("現在地の取得に失敗しました。デフォルト位置を使用します", geoError);
            handleLocationError(true, infoWindow, map.getCenter());
          }
        } else {
          console.warn("お使いのブラウザは位置情報をサポートしていません");
          handleLocationError(false, infoWindow, map.getCenter());
        }
      });

      // Places APIを初期化（必要な場合）
      if (this.needsPlacesApi) {
        const { Place } = await google.maps.importLibrary("places");
        const { places } = await Place.search({ location: center, radius: 500 });
        // 周辺のラーメン店を検索する例
        // const searchResults = await this.placeSearch.nearbySearch({
        //   location: center,
        //   radius: 1000,
        //   keyword: 'ラーメン'
        // });

        // 検索結果を処理するコードをここに追加
      }
    } catch (error) {
      console.error("マップの初期化中にエラーが発生しました", error)
    }
  }
}
