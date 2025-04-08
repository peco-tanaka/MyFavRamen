import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  HTMLから参照するための
  static targets = ["map", "loading", "searchResults", "searchInput", "searchForm"]

  static values = {
    latitude: Number,
    longitude: Number,
    shopName: String,
    keyword: String,
    hasDbResults: Boolean
  }

  connect() {
    if (this.hasMapTarget) {
      console.log("MapsController connected!")
      this.initMap()

      // キーワードが設定されていて、DBに結果がない場合には自動検索
      if (this.hasKeywordValue && this.keyWordValue && ! this.hasDbresultsValue) {
        this.searchShops()
      }
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

            // 現在地にピン打ち
            await this.addCurrentLocationMarker(currentPos);

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

  // 現在地にピンを打つ
  async addCurrentLocationMarker(position) {
    try {
      const { AdvancedMarkerElement, PinElement } = await google.maps.importLibrary("marker");

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
        this.infoWindow.setContent("<div><strong>現在地</strong></div>")
        this.infoWindow.open(this.map, this.currentLocationMarker);
      });

      console.log("現在地マーカーを設置しました", position);
    } catch(error) {
      console.error("現在地マーカーの作成中にエラーが発生しました", error)
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
        maxResultCount: 15,          // 最大結果数
        languageCode: "ja"           // 言語コード
      };

      // ⑤テキスト検索用のオプション
      // 新しい Places APIでは、テキスト検索(searchByText)を利用する
      const textSearchOptions = {
        textQuery: "ラーメン",
        locationBias: location,
        fields: ["displayName", "location", "formattedAddress", "rating", "userRatingCount"],
        maxResultCount: 15,
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

  // フォーム送信時に検索を実行するメソッド
  async searchShops(event) {
    if (event) event.preventDefault()

    let keyword
    if (this.hasSearchInputTarget) {
      keyword = this.searchInputTarget.value.trim()
    } else if (this.hasKeywordValue) {
      keyword = this.keywordValue
    }

    if (!keyword) return

    this.showLoading()
    console.log("検索キーワード:", keyword)

    // 検索結果を初期化
    if (this.hasSearchResultsTarget) {
      this.searchResultsTarget.innerHTML = ""
    }

    try {
      // Places APIからテキスト検索関連のクラスをインポート
      const { Place } = await google.maps.importLibrary("places")

      // テキスト検索オプション
      const textSearchOptions = {
        textQuery: `${keyword} ラーメン`,
        fields: ["displayName", "location", "formattedAddress", "rating", "userRatingCount", "id"],
        maxResultCount: 15,
        language: "ja"
      }

      // テキスト検索を実行
      const { places } = await Place.searchByText(textSearchOptions);
      console.log("検索結果:", places);

      if (places && places.length > 0) {
        // 検索結果を地図上に表示
        await this.displayRamenShops(places)

        // 検索結果リストを表示
        this.displaySearchResult(places)
      } else {
        console.log("検索結果がありませんでした")
        // 空の結果を渡す
        this.displaySearchResult([])
      }
    } catch(error) {
      console.error("店舗検索中にエラーが発生しました", error)
      // エラー時も空の結果を返す
      this.displaySearchResult([])
    } finally {
      this.hideLoading()
    }
  }

  // 検索結果リストを表示するメソッド
  displaySearchResult(places) {
    if (!this.hasSearchResultsTarget) return

    // 検索結果がなければメッセージを表示
    if(!places || places.length === 0 ) {
      this.searchResultsTarget.innerHTML = ""
      if (this.hasNoResultsMessageTarget && !this.hasDbResultsValue) {
        this.hasNoResultsMessageTarget.style.display = "block"
      }
      return
    }

    // 検索結果があればメッセージを非表示
    if (this.hasNoResultsMessageTarget) {
      this.noResultsMessageTarget.style.display = 'none'
    }

    // 検索結果リストの作成
    const listGroup = document.createElement("div")
    listGroup.className = "list-group mt-2"
    listGroup.id = "google-results"

    places.forEach(place => {
      const listItem = document.createElement("a")
      listItem.className = "list-group-item list-group-item-action"
      listItem.setAttribute("data-place-id", place.id)
      listItem.setAttribute("data-action", "click->maps#selectPlace")

      const title = document.createElement("h5")
      title.className = "mb-1"
      title.textContent = place.displayName || "名称不明"

      const address = document.createElement("p")
      address.className = "mb-1"
      address.textContent = place.formattedAddress || "住所不明"

      // Google検索結果であることを示すバッジ
      const badge = document.createElement("span")
      badge.className = "badge bg-warning"
      badge.textContent = "Google Maps"

      listItem.appendChild(title)
      listItem.appendChild(address)
      listItem.appendChild(badge)
      listGroup.appendChild(listItem)
    })
    this.searchResultsTarget.innerHTML = ""
    this.searchResultsTarget.appendChild(listGroup)
  }

  // 店舗を選択した時の処理
  async selectPlace(event) {
    event.preventDefault()

    // クリックした要素から店舗IDを取得
    const placeId = event.currentTarget.getAttribute("data-place-id")
    console.log("選択された店舗ID:", placeId)

    try {
      this.showLoading()

      // Places APIからPlaceクラスをインポート
      const { Place } = await google.maps.importLibrary("places")

      // Google Maps APIから詳細情報を取得
      const place = new Place({
        id: placeId,
        requestedLanguage: "ja",
      })

      await place.fetchFields({
        fields: ["displayName", "location", "formattedAddress", "nationalPhoneNumber", "rating", "businessStatus", "regularOpeningHours", "websiteURI"],
      })

      console.log("店舗詳細:", place)

      // バックエンドに店舗情報を送信し、DBに保存またはリダイレクト
      // fetch() でHTTPリクエストを送信
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
          latitude: place.location?.lat,
          longitude: place.location?.lng,
          business_hours: place.regularOpeningHours?.weekdayDescriptions?.join(', '),
          website: place.websiteURI
        })
      })

      const result = await response.json()

      if (result.status === 'success' && result.redirect_url) {
        window.location.href = result.redirect_url
      }
    } catch (error) {
      console.error("店舗詳細の取得中にエラーが発生しました", error)
    } finally {
      this.hideLoading()
    }
  }
}