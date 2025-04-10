import { Controller } from "@hotwired/stimulus";

export default class extends Controller {
  static targets = ["searchResults", "noResultsMessage", "loading"];

  // 店舗選択時のコールバック関数
  onPlaceSelected = null;

  // 初期化処理
  connect() {
    this.hideLoading();
  }

  // 親コントローラーから店舗選択コールバックを受け取るメソッド
  initialize(onPlaceSelected) {
    this.onPlaceSelected = onPlaceSelected;
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

    if (!this.searchResultsTarget) {
      console.warn("検索結果を表示する要素が見つかりません");
      return;
    }

    // 検索結果領域を初期化
    this.searchResultsTarget.innerHTML = "";

    // 検索結果がなければメッセージを表示
    if (!places || places.length === 0) {
      if (this.hasNoResultsMessageTarget) {
        this.noResultsMessageTarget.style.display = "block";
      } else {
        this.searchResultsTarget.innerHTML =
          "<p class='text-center mt-3'>検索結果がありませんでした</p>";
      }
      return;
    }

    // 検索結果があればメッセージを非表示
    if (this.noResultsMessageTarget) {
      this.noResultsMessageTarget.style.display = 'none';
    }

    // 検索結果リストを作成
    const listGroup = document.createElement("div");
    listGroup.className = "list-group mt-2";
    listGroup.id = "google-results";

    places.forEach(place => {
      const listItem = document.createElement("a");
      listItem.className = "list-group-item list-group-item-action d-flex align-items-start";
      listItem.setAttribute("data-place-id", place.id);
      listItem.setAttribute("data-action", "click->maps#handlePlaceSelection");

      // 写真表示部分
      const photoDiv = document.createElement("div");
      photoDiv.className = "flex-shrink-0 me-3";  // 画像用コンテナ
      if (place.photos && place.photos.length > 0) {
        const photo = place.photos[0];  // 最初の写真を使用
        const img = document.createElement("img");
        //getURI()で写真URLを取得。サイズを指定可能
        img.src = photo.getURI({ maxWidth: 100, maxHeight: 100 });
        img.alt = `${place.displayName || '店舗'}の写真`;
        img.style.width = "80px"; // 表示サイズをCSSで調整（例）
        img.style.height = "80px";
        img.style.objectFit = "cover"; // 画像のアスペクト比を保ちつつ表示
        img.classList.add("rounded");
        photoDiv.appendChild(img);
      }

      // 店舗情報部分
      const infoDiv = document.createElement("div");
      infoDiv.className = "flex-grow-1";

      const title = document.createElement("h5");
      title.className = "mb-1";
      title.textContent = place.displayName || "名称不明";

      const address = document.createElement("p");
      address.className = "mb-1";
      address.textContent = place.formattedAddress || "住所不明";

      const ratingP = document.createElement("p");
      ratingP.className = "mb-1 small text-muted";
      ratingP.textContent = `評価: ${place.rating || '－'} (${place.userRatingCount || 0}件)`;

      // Google検索結果であることを示すバッジ（必要になったらコメントはずす）
      const badge = document.createElement("span");
      badge.className = "badge bg-warning";
      badge.textContent = "Google Maps";

      // 組み立て
      infoDiv.appendChild(title);
      infoDiv.appendChild(address);
      infoDiv.appendChild(ratingP);
      infoDiv.appendChild(badge);

      // リストアイテムに写真と情報を追加
      listItem.appendChild(photoDiv);
      listItem.appendChild(infoDiv);
      // ここまで店舗情報部分

      listGroup.appendChild(listItem);
    });

    this.searchResultsTarget.appendChild(listGroup);
  }
}