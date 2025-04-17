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

  // 値の定義 - HTML要素から取得する値
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
    this.manualFormTarget.style.display =
      this.manualFormTarget.style.display === 'none' ? 'block' : 'none'

    // 手動フォームの表示状態に応じて「選択して次へ」ボタンの状態を更新
    this.updateSelectButtonState();

    // 手動フォームが表示された場合、地図検索結果の選択状態を解除する
    if (!isVisible) { // isVisibleは変更前の状態なので、!isVisibleは表示された時
      this.clearMapSelectionVisuals();
      // this.selectedShop = null; // 必要に応じて選択自体も解除
    }
  }

  // 店舗選択ボタンをクリックしたときの処理
  // data-action="click->ranking-item#selectShop"で呼び出し
  selectShop() {
    // 選択された店舗情報を取得
    this.selectedShop = this.getSelectedShopData();

    if (!this.selectedShop || !this.selectedShop.is_manual) {
      if (!this.selectedShop && this.hasManualFormTarget && this.manualFormTarget.style.display !== 'none') {
        // 手動フォームが表示されていて、店舗名が空の場合のアラート
        alert("店舗名を入力してください");
      } else {
        // 予期せぬケース用
        console.warn("手動入力フォームが無効な状態で selectShop が呼び出されました。");
      }
     return; // 処理を中断
    }

    // 店舗検索モーダルを閉じてメニュー入力モーダルを開く
    this.shopSearchModal.hide()
    this.menuInputModal.show()
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
  selectMapShop(event) {
    event.preventDefault()

    if (this.hasManualFormTarget && this.manualFormTarget.style.display !== 'none') {
      this.manualFormTarget.style.display = 'none'
      this.updateSelectButtonStatus();  // ボタン状態を更新
    }

    // 選択された店舗の情報を取得
    const selectedItem = event.currentTarget  // クリックされた要素を保存
    const shopId = selectedItem.dataset.shopId
    const shopName = selectedItem.dataset.shopName
    const shopAddress = selectedItem.dataset.shopAddress

    // 選択状態を視覚的に表示
    this.searchResultsTarget.querySelectorAll('.list-group-item').forEach(item => {
      item.classList.remove('active')
    })
    selectedItem.classList.add('active')

    // 選択された店舗情報を selectedShop に直接セット
    this.selectedShop = {
      id: shopId,          // Google Place ID
      name: shopName,
      address: shopAddress,
      is_manual: false     // 地図からの選択なので false
    };

    // すぐにモーダルを遷移
    this.shopSearchModal.hide();
    this.menuInputModal.show();
  }

  // メニュー追加処理
  // data-action="click->ranking-item#addMenu"で呼び出される
  addMenu() {
    const menuName = this.menuNameInputTarget.value

    if (!menuName) {
      alert("メニュー名を入力してください。")
      return
    }

    if (!this.selectedShop) {
      alert("店舗が選択されていません。")
      return
    }

    // サーバーに送信するデータを準備
    const data = {
      ranking_item: {
        menu_name: menuName,
        // Google Places APIから取得した場合
        google_place_id: this.selectedShop.id || null,
        shop_name: this.selectedShop.name,
        shop_address: this.selectedShop.address,
        shop_id: this.selectedShop.dbId || null  // データベース上のIDがあれば使用
      }
    }

    // 手動入力の場合は店舗情報も送信
    if (this.selectedShop.is_manual) {
      data.ranking_item.is_manual = true
    }

    // 次のステップで実装するサーバー送信処理
    this.saveRankingItem(data)

    // モーダルを閉じる
    this.menuInputModal.hide()
  }

  // サーバーにデータを送信するメソッド
  async saveRankingItem(data) {
    try {
      // 保存中の表示
      this.showSavingIndicator()

      // ランキングIDと保存先URLを取得
      const rankingId = this.rankingIdValue
      const url = this.urlValue

      // フェッチAPIを使ってPOSTリクエストを送信
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': this.getCSRFToken()
        },
        body: JSON.stringify(data)
      })

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
    newItem.className = 'card mb-2 border-0 shadow-sm'
    newItem.dataset.id = item.id
    newItem.dataset.rankingSortTarget = 'item'

    // 現在の最後の順位を取得して新しいアイテムの順位を設定
    const currentItems = document.querySelectorAll('[data-ranking-sort-target="item"]')
    const newPosition = currentItems.length + 1

    // ランキングアイテムの内容を構築
    newItem.innerHTML = `
      <div class="card-body p-2">
        <div class="row align-items-center">
          <div class="col-1 text-center">
            <!-- ランク表示 -->
            <span class="position-number fw-bold fs-5 ${newPosition <= 3 ? 'text-' + ['warning', 'secondary', 'danger'][newPosition-1] : ''}">
              ${newPosition}
            </span>
          </div>

          <div class="col-2">
            <!-- 画像プレビュー -->
            <div class="placeholder-img d-flex align-items-center justify-content-center"
                style="width: 70px; height: 70px; background-color: #f8f9fa; border-radius: 0.25rem;">
              <i class="bi bi-image text-muted"></i>
            </div>
          </div>

          <div class="col-5 text-start">
            <!-- 店舗・メニュー情報 -->
            <h5 class="card-title mb-0">${item.shop_name}</h5>
            <p class="card-text small text-muted mb-0">${item.menu_name}</p>
          </div>

          <div class="col-4 text-end">
            <!-- 操作ボタン -->
            <button type="button" class="btn btn-sm btn-outline-primary edit-item-btn" data-id="${item.id}">
              <i class="bi bi-pencil-fill"></i> 編集
            </button>
            <a href="/rankings/${this.rankingIdValue}/ranking_items/${item.id}" 
              data-turbo-method="delete"
              data-turbo-confirm="このラーメン店をランキングから削除してもよろしいですか？"
              class="btn btn-sm btn-outline-danger">
              <i class="bi bi-trash-fill"></i> 削除
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
  }

  // 編集フォームの送信処理
  async handleEditFormSubmit(event, itemId) {
    event.preventDefault()

    // フォームデータの取得
    const form = event.targets
    const formData = new FormData(form)

    try {
      // 保存中の表示
      this.showSavingIndicator()

      // サーバーにデータを送信
      const response = await fetch(`/rankings/${this.rankingIdValue}/ranking_items/${itemId}`, {
        method: 'PATCH',
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
      this.hideSavingIndicator
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

  // 保存成功時の処理
  handleSaveSuccess(result) {
    // 成功メッセージを表示
    const successMessage = document.createElement('div')
    successMessage.className = 'alert alert-success alert-dismissible fade show'
    successMessage.innerHTML = `
      <strong>成功!</strong> 「${result.shop_name}: ${result.menu_name}」をランキングに追加しました。
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `
    document.querySelector('.main-content').prepend(successMessage)

    // 画面にアイテムを追加（後のステップで実装）
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
    // 成功メッセージを表示
    const successMessage = document.createElement('div')
    successMessage.className = 'alert alert-success alert-dismissible fade show'
    successMessage.innerHTML = `
      <strong>成功!</strong> 「${result.shop_name}: ${result.menu_name}」の情報を更新しました。
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `
    document.querySelector('.main-content').prepend(successMessage)

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
