import { Controller } from "@hotwired/stimulus"
import * as bootstrap from "bootstrap"
import { MapsHelper } from "../utilities/maps_helper"
import { hide } from "@popperjs/core"
import Results_controller from "./results_controller"

// Connects to data-controller="ranking-item"
export default class extends Controller {
  static targets = [
    "shopSearchModal",   // 店舗検索モーダル
    "menuInputModal",    // メニュー入力モーダル
    "manualForm",        // 手動入力フォーム
    "manualShopName",    // 手動入力の店舗名
    "manualShopAddress", // 手動入力の住所
    "menuNameInput",     // メニュー名入力フィールド
    "searchResults",     // 検索結果表示領域
    "newItemsContainer",  // 新しいアイテムを追加する場所
    "searchInput"        // 検索入力フィールド
  ]

  resultsController = null;

  // HTML要素から取得する値を設定 (data-ranking-hoge-value で指定)
  static values = {
    rankingId: Number, // ランキングID
    url: String        // 保存先URL
  }

  // 選択された店舗情報を保持するためのプロパティ
  selectedShop = null
  searchResult = []

  connect() {
    console.log("Ranking item controller connected")
    // targetsが取得できているか確認
    console.log("Controller targets:", {
      shopSearchModal: this.hasShopSearchModalTarget,
      searchInput: this.hasSearchInputTarget,
    });

    // モーダルを初期化
    this.shopSearchModal = new bootstrap.Modal(this.shopSearchModalTarget)
    this.menuInputModal = new bootstrap.Modal(this.menuInputModalTarget)
    this.editItemModal = new bootstrap.Modal(document.getElementById('edit-item-modal'))

    // 結果表示コントローラの初期化
    this.resultsController = new Results_controller();
    this.resultsController.initialize(this.selectMapShop.bind(this), true); // 簡易モードで初期化

    // 必要なターゲット要素を設定（二つのコントローラー間で同じDOM要素に対して操作を行う）
    if (this.hasSearchResultsTarget) {
      this.resultsController.searchResultsTarget = this.searchResultsTarget;
      this.resultsController.hasSearchResultsTarget = true;
    }

    // 既存の編集ボタンにイベントリスナーを追加
    this.setupEditButtons()

    // モーダルが閉じる前のイベントハンドラを追加
    this.shopSearchModalTarget.addEventListener('hide.bs.modal', this.handleModalHide.bind(this))
    this.menuInputModalTarget.addEventListener('hide.bs.modal', this.handleModalHide.bind(this))
    document.getElementById('edit-item-modal').addEventListener('hide.bs.modal', this.handleModalHide.bind(this))
  }

  // モーダルが閉じる前にフォーカスを移動するメソッド
  handleModalHide(event) {
    // フォーカスをモーダル外の要素に移動（例: ページのbody要素）
    document.body.focus()
    // または何も選択されていない状態にする
    document.activeElement.blur()
  }

  // 「ラーメンを追加」ボタンクリック時にモーダルを表示
  // data-action="click->ranking-item#openShopSearchModal"で呼び出される
  openShopSearchModal() {
    this.shopSearchModal.show()
  }

  // 手動登録フォームの表示切り替え
  // data-action="click->ranking-item#toggleManualForm"で呼び出される
  toggleManualForm(event) {
    event.preventDefault()

    // フォームの現在の表示状態を取得 (切り替えを行う前にチェック)
    const isCurrentlyVisible = this.manualFormTarget.style.display !== 'none';

    // フォームを現在表示されているなら非表示に、非表示なら表示にする
    this.manualFormTarget.style.display = isCurrentlyVisible ? 'none' : 'block';

    // 手動フォームの表示状態に応じて「選択して次へ」ボタンの状態を更新
    this.updateSelectButtonState();

    // もしフォームが（切り替え操作の後に）表示されているならば...
    // (切り替え前に非表示 isCurrentlyVisible === false だった場合)
    if (!isCurrentlyVisible) {
      console.log("手動フォームが表示されました。");
      // 地図検索結果リストのハイライトを解除する処理
      this.clearMapSelectionVisuals();
      // 地図検索で選択されていた可能性のある情報をリセット
      this.selectedShop = null;
      console.log("地図検索の選択状態と選択情報をリセットしました。");
    } else {
      console.log("手動フォームが非表示になりました。");
    }
  }

  // 店舗選択ボタンをクリックしたときの処理
  // data-action="click->ranking-item#selectShop"で呼び出し
  selectShop() {
    // 1. 選択された店舗情報を取得（手動入力なので is_manual: true が含まれる）
    const manualData = this.getSelectedShopData();

    // 店舗名が入力されているかチェック
    if (!manualData || !manualData.name) {
      alert("店舗名を入力してください");
      return; // 処理を中断
    }

    // 2. ★ サーバー通信は行わず、this.selectedShop に情報を格納 ★
    this.selectedShop = {
      id: null,                  // Google Place ID はない
      name: manualData.name,
      address: manualData.address,
      is_manual: true,           // ★ 手動入力なので true ★
      dbId: null                   // ★ DB ID はないので null ★
    };

    console.log("手動入力店舗選択完了:", this.selectedShop);

    // 3. モーダル遷移 & UI調整
    this.manualFormTarget.style.display = 'none'; // 手動フォーム自体を隠す
    this.menuInputModal.show();
    this.shopSearchModal.hide()
    this.menuNameInputTarget.focus();
    this.updateSelectButtonState(); // ボタン状態を更新
  }

  // 「選択して次へ」ボタンの状態を更新するメソッド
  updateSelectButtonState() {
    // ボタン要素を取得 (IDで取得)
    const selectShopButton = document.getElementById('select-shop-btn');
    // manualForm ターゲットの存在も確認
    if (selectShopButton && this.hasManualFormTarget) {
      // 手動入力フォームが表示されている場合のみボタンを有効化 (disabled = false)
      selectShopButton.disabled = this.manualFormTarget.style.display === 'none';
    } else if (selectShopButton) {
        // 手動フォームターゲットがない場合は常に無効化
        selectShopButton.disabled = true;
    }
  }

  // 手動入力からの店舗データを取得
  getSelectedShopData() {
    // 手動入力フォームが表示されている場合
    if (this.hasManualFormTarget && this.manualFormTarget.style.display !== 'none') {
      const shopName = this.hasManualShopNameTarget ? this.manualShopNameTarget.value.trim() : null;
      const shopAddress = this.hasManualShopAddressTarget ? this.manualShopAddressTarget.value.trim() : '';

      if (!shopName) {
        return null;
      }

      // 手動入力データのみを返す
      return {
        name: shopName,
        address: shopAddress || '',  // 住所が空の場合は空文字を設定
        is_manual: true
      }
    }

    // 手動入力フォームが表示されていない場合はnullを返す
    return null;
  }

  // 店舗検索を実行するメソッド
  async searchShops() {
    const keyword = this.searchInputTarget.value.trim()

    if (!keyword) {
      alert('検索キーワードを入力してください')
      return
    }

    // 検索中の表示などがあれば表示
    this.showSearchingState()

    try {
      // Places APIを読み込んで検索実行
      const { Place } = await MapsHelper.loadMapsLibrary("places")

      // テキスト検索オプション
      const textSearchOptions = {
        textQuery: `${keyword} ラーメン`,
        fields: ["displayName", "location", "formattedAddress",
                "rating", "userRatingCount", "photos", "id"],
        maxResultCount: 15,
        language: "ja"
      }

      const { places } = await Place.searchByText(textSearchOptions)
      console.log("検索結果:", places)

      // 検索結果をプロパティに保存
      this.searchResults = places || []

      // resultsControllerを使って検索結果を表示
      this.resultsController.displayResults(this.searchResults)
      } catch (error) {
        console.error("店舗検索中にエラーが発生しました", error)
        this.displaySearchError()
      } finally {
        this.hideSearchingState()
      }
  }

  // 検索結果から店舗を選択
  async selectMapShop(event) {
    event.preventDefault()
    const selectedButton = event.currentTarget // クリックされた要素を保存

    // ★ dataset から placeId を取得 (dataset.shopId ではなく placeId に変更)
    const placeId = selectedButton.dataset.placeId;

    if (!placeId) {
      console.error("Place IDが取得できませんでした。HTMLの data-place-id 属性を確認してください。")
      alert("店舗情報の取得に失敗しました")
      return;
    }

    // 手動入力フォームが表示されていれば隠す
    if (this.hasManualFormTarget && this.manualFormTarget.style.display !== 'none') {
      this.manualFormTarget.style.display = 'none'
      this.updateSelectButtonStatus();  // ボタン状態を更新
    }

    // 視覚的な選択状態表示 (変更なし)
    this.searchResultsTarget.querySelectorAll('.list-group-item').forEach(item => item.classList.remove('active'));
    selectedButton.classList.add('active');

    this.showSavingIndicator("店舗情報を登録中...");  // 保存中インジケーターを流用

    try {
      // 1.Places APIを読み込んで選択した店舗の詳細情報を取得
      console.log(`Place ID: ${placeId} の詳細情報を取得します...`);
      const { Place } = await MapsHelper.loadMapsLibrary("places")
      const placeDetails = new Place({ id: placeId, requestedLanguage: "ja" });

      // ShopController#search に必要なフィールドを最低限指定
      await placeDetails.fetchFields({
        fields: ["displayName", "formattedAddress", "photos", "location"]
      });
      console.log("Google Place 詳細取得成功", placeDetails);

      // 2.バックエンド（/shop/search）に情報を送信して、Shop IDを取得
      console.log("サーバーに店舗情報を送信し、Shop IDを取得します...");
      const csrfToken = this.getCSRFToken() // CSRFトークンを取得
      if (!csrfToken) {
        throw new Error("CSRFトークンが取得できませんでした。ページをリロードしてください。")
      }

      const response = await fetch('/shops/search', {   //POSTリクエスト
        method: 'POST',
        headers: {
          'Content-Type': 'application/json', // リクエスト: JSON形式
          'Accept': 'application/json',       // レスポンス: JSON形式
          'X-CSRF-Token': csrfToken           // CSRFトークンをヘッダーに追加
        },
        // 送信するデータ (place_id, name, address は ShopController が期待するキー)
        body: JSON.stringify({
          place_id: placeId,
          name: placeDetails.displayName,
          address: placeDetails.formattedAddress
        })
      });

      // レスポンスをJSONとして解析
      const result = await response.json();
      console.log("サーバーからの応答:", result);

      // ★ レスポンスをチェック
      // response.ok は HTTPステータスが 200-299 かどうか
      // result.status は Rails側で設定した 'success' かどうか
      // result.shop_id が存在するかどうか
      if (!response.ok || result.status !== 'success' || !result.shop_id) {
        // エラーメッセージを組み立てて例外をスロー
        const errorDetail = result.message || result.errors?.join(', ') || `サーバーエラー (${response.status})`;
        throw new Error(`店舗情報の登録に失敗しました: ${errorDetail}`);
      }

      // 3.成功した場合、this.selectedShopに必要な情報を格納
      this.selectedShop = {
        id: placeId,          // Google Place ID（placeId）
        name: placeDetails.displayName,
        address: placeDetails.formattedAddress,
        is_manual: false,    // 地図からの選択なので false
        dbId: result.shop_id // ★★★ 取得したDB上のShop IDを設定 ★★★
      }
      console.log("店舗選択とDB登録/検索が完了:", this.selectedShop);

      // 4.店舗検索モーダルを閉じてメニュー入力モーダルを開いて入力欄にフォーカスを当てる
      this.shopSearchModal.hide()
      this.menuInputModal.show()
      this.menuNameInputTarget.focus();

    } catch (error) {
      console.error("店舗情報の取得中にエラーが発生しました", error)
      alert(`エラーが発生しました: ${error.message}`); // ユーザーにエラーを通知
      // エラーが起きたら選択状態を解除する
      selectedButton.classList.remove('active');
      this.selectedShop = null; // 選択情報もリセット
    } finally {
      // ★ ローディング表示を非表示にする
      this.hideSavingIndicator();
    }
  }

  // メニュー追加処理
  // data-action="click->ranking-item#addMenu"で呼び出される
  addMenu() {
    // メニュー名を取得
    const menuName = this.menuNameInputTarget.value.trim()
    if (!menuName) { alert("メニュー名を入力してください。"); return; }
    if (!this.selectedShop) { alert("店舗が選択されていません。"); return; } // selectedShop 自体の存在をチェック

    // ★ is_manual フラグを見て送信データを構築 ★
    let rankingItemData = {}; // 送信データを格納するオブジェクト

    if (this.selectedShop.is_manual) {
      // --- 手動入力の場合 ---
      // 店舗名が設定されているか確認 (getSelectedShopDataでチェック済みのはずだが念のため)
      if (!this.selectedShop.name) { alert("手動入力の店舗名が設定されていません。"); return; }
      rankingItemData = {
        menu_name: menuName,
        is_manual: true,                 // ★ 手動フラグを送信 ★
        manual_shop_name: this.selectedShop.name, // ★ 手動店舗名を送信 ★
        manual_shop_address: this.selectedShop.address || '' // ★ 手動住所を送信 ★
        // shop_id は含めない
        // comment, photo など他の共通属性は必要なら追加
      };
    } else {
      // --- 地図検索の場合 ---
      // dbId が存在するか (サーバー通信が成功したか) 確認
      if (!this.selectedShop.dbId) { alert("店舗IDが取得できていません。店舗を選択し直してください。"); return; }
      rankingItemData = {
        shop_id: this.selectedShop.dbId, // ★ DBのShop IDを送信 ★
        menu_name: menuName,
        is_manual: false                // ★ false を送信 (または省略可) ★
        // comment, photo など他の共通属性は必要なら追加
      };
    }

    // 最終的なデータ構造
    const data = { ranking_item: rankingItemData };
    console.log("ランキングアイテム保存データ:", data);

    // サーバーにデータを送信
    this.saveRankingItem(data)

    this.menuInputModal.hide()

    // 入力欄や選択状態をクリア
    this.menuNameInputTarget.value = '';
  }

  // サーバーにデータを送信するメソッド
  async saveRankingItem(data) {
    this.showSavingIndicator("ランキングに保存中...");
    try {
      // 保存中の表示
      this.showSavingIndicator()

      // ランキングIDと保存先URLを取得
      const rankingId = this.rankingIdValue
      const baseUrl = this.urlValue

      // ★★★ リクエストURLの末尾に ".json" を追加 ★★★
      const url = baseUrl.endsWith('/') ? `${baseUrl.slice(0, -1)}.json` : `${baseUrl}.json`;
      // もしくは単純に: const url = `${this.urlValue}.json`; でも通常はOK

      console.log("Requesting URL:", url); // デバッグ用にURLを確認

      // フェッチAPIを使ってPOSTリクエストを送信
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': this.getCSRFToken()
        },
        body: JSON.stringify(data)
      })

      // baseUrlだとJSONレスポンスが返ってこないので、.jsonをつける必要があった
      if (!response.ok) {
        throw new Error(`サーバーエラー： ${response.status}`)
      }

      const result = await response.json()

      // 保存成功時の処理
      this.handleSaveSuccess(result)
    } catch (error) {
      console.error("保存中にエラーが発生しました", error)
      // 保存エラー時の処理
      this.handleSaveError(error)
    } finally {
      // 保存中の表示を非表示
      this.hideSavingIndicator()
    }
  }

  // ランキングアイテムをDOMに追加するメソッド
  addNewItemToDom(item) {
    // 新しいランキングアイテム要素を作成
    const newItem = document.createElement('div')
    newItem.className = 'card mb-2 border-0 shadow-sm ranking-item'
    newItem.dataset.id = item.id
    newItem.dataset.rankingSortTarget = 'item'

    // 現在の最後の順位を取得して新しいアイテムの順位を設定
    const currentItems = document.querySelectorAll('[data-ranking-sort-target="item"]')
    const newPosition = currentItems.length + 1

    // ランキングアイテムの内容を構築
    newItem.innerHTML = `
      <div class="card-body p-2">
        <div class="row align-items-center">
          <div class="col-1 text-center ps-2">
            <!-- ランク表示 -->
            <span class="position-number fw-bold fs-6 ${newPosition <= 3 ? 'text-' + ['warning', 'secondary', 'danger'][newPosition-1] : ''}">
              ${newPosition}
            </span>
          </div>

          <div class="col-auto px-0">
            <!-- 画像プレビュー -->
            <div class="placeholder-img img-thumbnail d-flex align-items-center justify-content-center"
                style="width: 70px; height: 70px; background-color: #f8f9fa; border-radius: 0.25rem;">
              <i class="bi bi-image text-muted"></i>
            </div>
          </div>

          <div class="col text-start px-1">
            <!-- 店舗・メニュー情報 -->
            <h6 class="card-title mb-0 fs-6">
              ${item.shop_name}
              ${item.is_manual ? '<span class="badge bg-secondary ms-1" style="font-size: 0.5em;">手動登録</span>' : ''}
            </h6>
            <p class="card-text small text-muted mb-0" style="font-size: 0.7rem;">${item.menu_name}</p>
          </div>

          <div class="col-1 text-end d-flex flex-column align-items-end px-1">
            <!-- 操作ボタン -->
            <button type="button" class="btn btn-sm btn-outline-primary edit-item-btn mb-2" data-id="${item.id}" 
                style="font-size: 0.7rem; padding: 0.15rem 0.3rem; width: 100%; height: auto; display: flex; flex-direction: column; align-items: center;">
              <i class="bi bi-pencil-fill"></i>
              <span class="d-none d-md-block" style="font-size: 0.65rem; margin-top: 2px;">編集</span>
            </button>
            <a href="/rankings/${this.rankingIdValue}/ranking_items/${item.id}" 
              data-turbo-method="delete"
              data-turbo-confirm="このラーメン店をランキングから削除してもよろしいですか？"
              class="btn btn-sm btn-outline-danger"
              style="font-size: 0.7rem; padding: 0.15rem 0.3rem; width: 100%; height: auto; display: flex; flex-direction: column; align-items: center;">
              <i class="bi bi-trash-fill"></i>
              <span class="d-none d-md-block" style="font-size: 0.65rem; margin-top: 2px;">削除</span>
            </a>
          </div>
        </div>
      </div>
    `

    // 新しいアイテムを追加する前にからのランキングメッセージがあれば削除
    const emptyMessage = document.querySelector('.empty-ranking-message')
    if (emptyMessage) {
      emptyMessage.remove()
    }

    // ランキングアイテムリストに新しいアイテムを追加
    const rankingList = document.querySelector('[data-ranking-sort-target="container"]')
    rankingList.appendChild(newItem)

    // 編集ボタンにイベントリスナーを追加
    this.attachEditButtonEvent(newItem.querySelector('.edit-item-btn'))
  }

  // 編集ボタンにイベントリスナーを追加するメソッド
  attachEditButtonEvent(button) {
    if (!button) return

    button.addEventListener('click', (event) => {
      const itemId = event.currentTarget.dataset.id
      // 編集モーダルを開く
      this.openEditModal(itemId)
    })
  }

  setupEditButtons() {
    const editButtons = document.querySelectorAll('.edit-item-btn')
    editButtons.forEach(button => {
      this.attachEditButtonEvent(button)
    })
  }

  async openEditModal(itemId) {
    console.log(`アイテムID: ${itemId} の編集モーダルを開きます`)

    try {
      // 編集用フォームサーバーから取得
      const response = await fetch(`/rankings/${this.rankingIdValue}/ranking_items/${itemId}/edit`, {
        headers: {
          'Accept': 'text/html',
          'X-Requested-With': 'XMLHttpRequest'
        }
      })

      if (!response.ok) {
        throw new Error(`サーバーエラー： ${response.status}`)
      }

      // レスポンスからHTMLを取得
      const html = await response.text()

      // 編集フォームコンテナにHTMLを挿入
      document.getElementById('edit-item-form-container').innerHTML = html

      // モーダルを表示
      this.editItemModal.show()

      // フォーム送信イベントの設定
      this.setupEditFormSubmitEvent(itemId)
    } catch (error) {
      console.error("編集フォームの取得中にエラーが発生しました", error)
      alert("編集フォームの取得に失敗しました。時間をおいて再度お試しください。")
    }
  }

  // 編集フォームの送信イベントを設定
  setupEditFormSubmitEvent(itemId) {
    const form = document.querySelector('#edit-item-form-container form')

    if (!form){
      console.error("編集フォームが見つかりません")
      return
    }

    // 既存のイベントリスナーを削除
    form.removeEventListener('submit', this.handleEditFormSubmit)

    // 新しいイベントリスナーを追加
    form.addEventListener('submit', (event) => {
      event.preventDefault()
      this.handleEditFormSubmit(event, itemId)
    })
    console.log("編集フォームの送信イベントを設定しました")
  }

  // 編集フォームの送信処理
  async handleEditFormSubmit(event) {
    event.preventDefault()

    // フォームデータの取得
    const form = event.currentTarget
    const formData = new FormData(form)

    const itemId = form.dataset.rankingItemId

    try {
      // 保存中の表示
      this.showSavingIndicator()

      // サーバーにデータを送信（form_withで生成されたURLを使用）
      const response = await fetch(form.action, {
        method: form.method,
        headers: {
          'X-CSRF-Token': this.getCSRFToken(),
          'Accept': 'application/json'
        },
        body: formData
      })

      if (!response.ok) {
        throw new Error(`サーバーエラー： ${response.status}`)
      }

      const result = await response.json()

      // 保存成功時の処理
      this.handleEditSuccess(result, itemId)
    } catch (error) {
      console.error("保存中にエラーが発生しました", error)
      // 保存エラー時の処理
      this.handleEditError(error)
    } finally {
      this.hideSavingIndicator()
    }
  }

  // DOM上のアイテム情報を更新するメソッド
  updateItemInDom(item, itemId) {
    // 更新対象の要素を取得
    const itemElement = document.querySelector(`[data-id="${itemId}"]`)

    if (!itemElement) {
      console.error(`ID: ${itemId} もアイテムが見つかりません`)
      return
    }

    // 店舗名とメニュー名を更新
    const shopNameElement = itemElement.querySelector('.card-title')
    const menuNameElement = itemElement.querySelector('.card-text')

    if (shopNameElement) shopNameElement.textContent = item.shop_name
    if (menuNameElement) menuNameElement.textContent = item.menu_name

    // 画像があれば更新
    if (item.photo_url) {
      const imgContainer = itemElement.querySelector('.col-2')
      if (imgContainer) {
        imgContainer.innerHTML = `
        <img src="${item.photo_url}" class="img-thumbnail"
          style="width: 70px; height: 70px; object-fit: cover;">
      `
      }
    }

    // 1位のコメントがあれば更新
    if (item.position === 1 && item.comment) {
      const commentContainer = itemElement.querySelector('.col-5 p:last-child')

      // コメントがまだなければ新規追加
      if (!commentContainer || !commentContainer.querySelector('.bi-chat-quote-fill')) {
        const textContainer = itemElement.querySelector('.col-5')
        if (textContainer) {
          const commentEl = document.createElement('p')
          commentEl.className = 'small mb-0 text-truncate'
          commentEl.innerHTML = `
            <i class="bi bi-chat-quote-fill text-warning me-1"></i>
            ${item.comment.length > 30 ? item.comment.substring(0, 27) + '...' : item.comment}
          `
          textContainer.appendChild(commentEl)
        }
      } else if (commentContainer) {
        // コメント要素があれば内容だけ更新
        const commentText = commentContainer.lastChild
        commentText.textContent = item.comment.length > 30 ? item.comment.substring(0, 27) + '...' : item.comment
      }
    }
  }

  // CSRFトークンを取得するヘルパーメソッド
  getCSRFToken() {
    const metaTag = document.querySelector('meta[name="csrf-token"]')
    return metaTag ? metaTag.content : ''
  }

  showSearchingState() {
    const container = this.searchResultsTarget.querySelector('.search-results-container')
    container.innerHTML = '<div class="text-center py-3"><div class="spinner-border text-primary" role="status"></div><p class="mt-2">検索中...</p></div>'
  }

  // 検索中の状態を非表示
  hideSearchingState() {
    // 何もしない（displaySearchResultsが結果を上書きするため）
  }

  // 検索エラーを表示
  displaySearchError() {
    const container = this.searchResultsTarget.querySelector('.search-results-container')
    container.innerHTML = '<div class="alert alert-danger">検索中にエラーが発生しました。時間をおいて再度お試しください。</div>'
  }

    // 保存中の表示
  showSavingIndicator() {
    // 保存中を示すインジケーターなどを表示（オプション）
    console.log("保存中...")
  }

  // 保存中表示を非表示
  hideSavingIndicator() {
    // インジケーターを非表示
  }

  // 地図検索結果の視覚的な選択状態（ハイライト）を解除するメソッド
  clearMapSelectionVisuals() {
    // searchResultsTarget (検索結果を表示するコンテナ) が存在するか確認
    if (this.hasSearchResultsTarget) {
      // コンテナ内の .active クラスを持つ要素（選択されている項目）を探す
      const activeItem = this.searchResultsTarget.querySelector('.list-group-item.active, .list-group-item-action.active');
      // もし選択されている項目があれば、active クラスを削除する
      if (activeItem) {
        activeItem.classList.remove('active');
        console.log("地図検索結果のハイライトを解除しました。");
      }
    } else {
      console.warn("clearMapSelectionVisuals: searchResultsTarget が見つかりません。");
    }
  }

  // 保存成功時の処理
  handleSaveSuccess(result) {
    // 画面にアイテムを追加
    this.addNewItemToDom(result)

    // 入力フィールドをクリア
    this.menuNameInputTarget.value = ''
    this.searchInputTarget.value = ''

    // 選択された店舗情報をリセット
    this.selectedShop = null
  }

  // 保存エラー時の処理
  handleSaveError(error) {
    // エラーメッセージを表示
    const errorMessage = document.createElement('div')
    errorMessage.className = 'alert alert-danger alert-dismissible fade show'
    errorMessage.innerHTML = `
      <strong>エラー!</strong> 保存中に問題が発生しました。もう一度お試しください。
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `
    document.querySelector('.main-content').prepend(errorMessage)
  }

  // 編集成功時の処理
  handleEditSuccess(result, itemId) {
    // モーダルを閉じる
    this.editItemModal.hide()

    // 画面上のアイテム情報を更新
    this.updateItemInDom(result, itemId)
  }

  // 編集エラー時の処理
  handleEditError(error) {
    // エラーメッセージを表示
    const errorMessage = document.createElement('div')
    errorMessage.className = 'alert alert-danger alert-dismissible fade show'
    errorMessage.innerHTML = `
      <strong>エラー!</strong> 更新中に問題が発生しました。もう一度お試しください。
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `
    document.querySelector('.main-content').prepend(errorMessage)

    // モーダルは閉じない（ユーザーが再試行できるようにする）
  }

}
