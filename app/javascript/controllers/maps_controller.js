import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  HTMLから参照するための
  static targets = ["map", "loading"]

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

  showLoading() {
    if (this.hasLoadingTarget) {
      this.loadingTarget.style.display = 'flex'
    }
  }

  hideLoading() {
    if (this.hasLoadingTarget) {
      this.loadingTarget.style.display = 'none'
    }
  }

  // Place APIが必要になった場合に、APIを読み込むgetterメソッド
  get needsPlacesApi() {
    return true;
  }

  // マップを初期化するメソッド
  async initMap() {
    try {
      // Maps, Markerライブラリを読み込む
      const { Map } = await google.maps.importLibrary("maps");
      const { AdvancedMarkerElement, PinElement } = await google.maps.importLibrary("marker");

      // 店舗の位置を優先して使用
      let center;

      // 店舗の経緯・緯度がわかる場合は使用
      if(this.hasLatitudeValue && this.hasLongitudeValue) {
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

      // マップを初期化してクラスプロパティとして保存
      const map = new google.maps.Map(this.mapTarget, {
        mapId: "491ead61da4cd4ad",  // マップIDを指定
        center: center,
        zoom: 15,
        mapTypeControl: false
      });

      // 他のメソッドでもアクセスできるようにコントローラーのインスタンスプロパティとして保存
      this.map = map;

      if(this.hasLatitudeValue && this.hasLongitudeValue) {
        // マーカーを作成
        const marker = new AdvancedMarkerElement({
          map: this.map,         // map オブジェクトを渡す
          position: center,
          title: this.hasShopNameValue ? this.shopNameValue : "ラーメン店",
        });
        console.log("マーカーが設置されました", center);
      }

      // ポップアップウィンドウを定義してコントローラープロパティとして保存
      this.infoWindow = new google.maps.InfoWindow();

      // ここで handleLocationError 関数をローカルに定義
      const handleLocationError = (browserHasGeolocation, pos) => {
        this.infoWindow.setPosition(pos);
        this.infoWindow.setContent(
          browserHasGeolocation
            ? "エラー: 位置情報の取得に失敗しました。"
            : "エラー: お使いのブラウザは位置情報をサポートしていません。"
        );
        this.infoWindow.open(map); // ローカル関数内ではmapにアクセスできます
      };

      // 現在地取得ボタンの作成
      const locationButton = document.createElement("button");
      locationButton.innerHTML = '<i class="bi bi-geo-alt"></i> 近くのお店を検索';
      locationButton.className = "btn btn-primary btn-sm rounded-5 m-2";
      this.map.controls[google.maps.ControlPosition.TOP_CENTER].push(locationButton);

      // ボタンクリック時の挙動を定義
      locationButton.addEventListener("click", async () => {
        // 検索開始時に読み込み表示を表示
        this.showLoading()

        // 位置情報が利用可能か確認
        if (navigator.geolocation) {
          try {
            // 現在地を取得（Promiseを利用して非同期処理）
            const position = await new Promise((resolve, reject) => {
              navigator.geolocation.getCurrentPosition(resolve, reject, {
                enableHighAccuracy: false,
                timeout: 10000,
                maximumAge: 0
              });
              console.log("現在地取得中...");
            });

            // 現在地の座標を設定
            const currentPos = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            };

            // 地図の中心を現在地に移動
            this.map.setCenter(currentPos);
            console.log("現在地を取得しました:", currentPos);

            await this.searchNearbyRamenShops(currentPos)
          } catch (geoError) {
            console.warn("現在地の取得に失敗しました。デフォルト位置を使用します", geoError);
            handleLocationError(true, this.map.getCenter());
          } finally {
            // 位置情報取得後に非表示にする
            this.hideLoading()
          }
        } else {
          console.warn("お使いのブラウザは位置情報をサポートしていません");
          handleLocationError(false, this.map.getCenter());
          // 読み込み表示を非表示にする
          this.hideLoading()
        }
      });

      if (this.needsPlacesApi) {
        try {
          console.log("Places APIを初期化中です");

          // Places APIをコントローラーで直接保存せず使用時にimportLibraryから取得（新版）
          await google.maps.importLibrary("places");

          console.log("Places APIの初期化が完了しました");

          if(this.hasLatitudeValue && this.hasLongitudeValue) {
            await this.searchNearbyRamenShops({
              // 店舗の位置を中心に検索
              lat: this.latitudeValue,
              lng: this.longitudeValue
            })
          } else {
            // デフォルト位置を中心に検索
            await this.searchNearbyRamenShops(center);
          }
        } catch {
          console.log("Places APIの初期化中にエラーが発生しました", error);
          this.hideLoading();
        }
      }
    } catch (error) {
      console.error("マップの初期化中にエラーが発生しました", error)
      // 読み込み表示を非表示にする
      this.hideLoading()
    }
  }

  // 近隣のラーメン店を検索するメソッド。locationは検索の基準となる位置情報
  async searchNearbyRamenShops(location) {
    console.log("近隣のラーメン店を検索します", location);
    this.showLoading();

    try {
      // Places APIから場所情報クラスと周辺検索ランキング設定をインポート
      const {Place, SearchNearbyRankPreference } = await google.maps.importLibrary("places")

      // 必須フィールドを含む検索オプションを定義
      const searchOptions = {
        // ①必須：取得したいフィールドを指定
        fields: ["displayName", "location", "formattedAddress", "rating", "userRatingCount"],

        // 必須②：検索範囲を指定
        locationRestriction : {
            center: location, // 検索の中心位置
            radius: 5000 // 検索半径（メートル）
        },

        // ③検索タイプ: restaurantを指定
        includedPrimaryTypes: ["restaurant"], // 検索対象のタイプを設定

        // ④オプション： 最大結果数、言語設定
        maxResultCount: 20,          // 最大結果数
        languageCode: "ja"           // 言語コード
      };

      // ⑤テキスト検索用のオプション
      // 新しい Places APIでは、テキスト検索(searchByText)を利用する
      const textSearchOptions = {
        textQuery: "ラーメン",
        locationBias: location,
        fields: ["displayName", "location", "formattedAddress", "rating", "userRatingCount"],
        maxResultCount: 20,
        language: "ja"
      };

      // ⑦テキスト検索を実行
      const { places } = await Place.searchByText(textSearchOptions);
      console.log("検索結果:", places);

      if (places && places.length > 0) {
        // 検索結果を地図上に表示
        await this.displayRamenShops(places);
      } else {
        console.log("検索結果がありませんでした");
      }
    } catch (error) {
      console.error("ラーメン店の検索中にエラーが発生しました", error);
    } finally {
      this.hideLoading();
    }
  }

  async displayRamenShops(places) {
    try {
      // ①markerライブラリを読み込む
      const { AdvancedMarkerElement, PinElement } = await google.maps.importLibrary("marker");

      for (const place of places ) {
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
          })

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
        } catch (detailError) {
          console.warn("店舗情報の取得中にエラーが発生しました", detailError);
        }
      }
    } catch(error) {
      console.error("マーカー表示中にエラーが発生しました", error)
    }
  }
}