import { Controller } from "@hotwired/stimulus";

export default class extends Controller {
  static targets = ["searchResults", "noResultsMessage", "loading"];

  // 店舗選択時のコールバック関数
  onPlaceSelected = null;

  // モード設定（true: 簡易モード、false: 通常モード）
  isSimpleMode = false;

  // 初期化処理
  connect() {
    this.hideLoading();
  }

  // 親コントローラーから店舗選択コールバックを受け取るメソッド
  initialize(onPlaceSelected, isSimpleMode = false) {
    this.onPlaceSelected = onPlaceSelected;
    this.isSimpleMode = isSimpleMode
    console.log(`ResultsController initialized: ${isSimpleMode ? "簡易モード" : "通常モード"}`);
  }

  // ローディング表示を制御するメソッド
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

  // 検索結果を表示するメソッド
  displayResults(places) {
    console.log("検索結果表示:", places ? places.length : 0, "件");

    // 検索結果表示領域の取得
    const container = this.isSimpleMode
      ? this.searchResultsTarget.querySelector('.search-results-container')
      : this.searchResultsTarget;

    if (!container) {
      console.warn("検索結果を表示する要素が見つかりません");
      return;
    }

    // 検索結果を初期化
    container.innerHTML = "";

    // 検索結果がなければメッセージを表示
    if (!places || places.length === 0) {
      this._displayNoResultsMessage(container);
      return;
    }

    // 検索結果があればメッセージを非表示
    if (this.hasNoResultsMessageTarget) {
      this.noResultsMessageTarget.style.display = 'none';
    }

    // 検索結果リストを作成
    const listGroup = document.createElement("div");
    listGroup.className = "list-group mt-2";
    listGroup.id = this.isSimpleMode ? "simple-results" : "google-results";

    places.forEach(place => {
      // 検索結果アイテムを作成して追加
      const listItem = this._createResultItem(place);
      listGroup.appendChild(listItem);
    });

    container.appendChild(listGroup);
  }

  // 検索結果なしメッセージの表示
  _displayNoResultsMessage(container) {
    if (this.hasNoResultsMessageTarget && !this.isSimpleMode) {
      this.noResultsMessageTarget.style.display = "block";
    } else {
      const message = this.isSimpleMode
        ? '<div class="alert alert-info">検索結果がありませんでした。別のキーワードで検索するか、手動で情報を入力してください。</div>'
        : "<p class='text-center mt-3'>検索結果がありませんでした</p>";

      container.innerHTML = message;
    }
  }

  // 検索結果アイテムの生成
  _createResultItem(place) {
    const listItem = document.createElement("a");
    listItem.href = "#";

    // 共通クラス設定
    listItem.className = "list-group-item list-group-item-action d-flex align-items-start";

    // データ属性とアクション設定
    if (this.isSimpleMode) {
      // 簡易モード用の設定
      listItem.dataset.shopId = place.id;
      listItem.dataset.shopName = place.displayName || "名称不明";
      listItem.dataset.shopAddress = place.formattedAddress || "住所情報なし";
      listItem.dataset.action = "click->ranking-item#selectMapShop";
    } else {
      // 通常モード用の設定
      listItem.dataset.placeId = place.id;
      listItem.dataset.action = "click->maps#handlePlaceSelection";
    }

    // 写真表示部分の作成
    const photoDiv = this._createPhotoElement(place);

    // 店舗情報部分の作成
    const infoDiv = this._createInfoElement(place);

    // リストアイテムに写真と情報を追加
    listItem.appendChild(photoDiv);
    listItem.appendChild(infoDiv);

    return listItem;
  }

  // 写真要素の作成
  _createPhotoElement(place) {
    const photoDiv = document.createElement("div");
    photoDiv.className = "flex-shrink-0 me-3";  // 画像用コンテナ

    if (place.photos && place.photos.length > 0) {
      // 店舗画像がある場合
      const photo = place.photos[0];  // 最初の写真を使用
      const img = document.createElement("img");
      img.src = photo.getURI({ maxWidth: 100, maxHeight: 100 });
      img.alt = `${place.displayName || '店舗'}の写真`;
      img.style.width = "80px";
      img.style.height = "80px";
      img.style.objectFit = "cover";
      img.classList.add("rounded");
      photoDiv.appendChild(img);
    } else {
      // 写真がない場合はプレースホルダーを表示
      const placeholderDiv = document.createElement("div");
      placeholderDiv.className = "bg-light d-flex align-items-center justify-content-center rounded";
      placeholderDiv.style.width = "80px";
      placeholderDiv.style.height = "80px";

      const icon = document.createElement("i");
      icon.className = "bi bi-shop text-secondary";
      icon.style.fontSize = "2rem";

      placeholderDiv.appendChild(icon);
      photoDiv.appendChild(placeholderDiv);
    }

    return photoDiv;
  }

  // 店舗情報要素の作成
  _createInfoElement(place) {
    const infoDiv = document.createElement("div");
    infoDiv.className = "flex-grow-1";

    // 店舗名
    const title = document.createElement("h5");
    title.className = "mb-1";
    title.textContent = place.displayName || "名称不明";

    // 住所
    const address = document.createElement("p");
    address.className = "mb-1";
    address.textContent = place.formattedAddress || "住所不明";

    // 評価情報
    const ratingP = document.createElement("p");
    ratingP.className = "mb-1 small text-muted";
    ratingP.textContent = `評価: ${place.rating || '－'} (${place.userRatingCount || 0}件)`;

    // Google検索結果であることを示すバッジ
    const badge = document.createElement("span");
    badge.className = "badge bg-warning";
    badge.textContent = "Google Maps";

    // infoDiv に子要素を追加
    infoDiv.appendChild(title);
    infoDiv.appendChild(address);
    infoDiv.appendChild(ratingP);
    infoDiv.appendChild(badge);

    // 簡易モードの場合は選択バッジも追加
    if (this.isSimpleMode) {
      const selectBadge = document.createElement("span");
      selectBadge.className = "badge bg-primary rounded-pill ms-2";
      selectBadge.textContent = "選択";
      infoDiv.appendChild(selectBadge);
    }

    return infoDiv;
  }
}