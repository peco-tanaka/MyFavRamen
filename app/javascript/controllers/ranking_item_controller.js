import { Controller } from "@hotwired/stimulus"
import * as bootstrap from "bootstrap"
import { MapsHelper } from "../utilities/maps_helper"
import { hide } from "@popperjs/core"
import Results_controller from "./results_controller"
import { ShopSearchHelper } from "../utilities/shop_search_helper"
import { RankingItemHelper } from "../utilities/ranking_item_helper"

// Connects to data-controller="ranking-item"
export default class extends Controller {
  static targets = [
    "shopSearchModal",   // 店舗検索モーダル
    "menuInputModal",    // メニュー入力モーダル
    "manualForm",        // 手動入力フォーム
    "manualShopName",    // 手動入力の店舗名
    "manualShopAddress", // 手動入力の住所
    "menuNameInput",     // メニュー名入力フィールド
    "menuPhotoInput",    // メニュー写真入力フィールド（追加）
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

  // ヘルパーモジュールの参照
  shopSearchHelper = null
  rankingItemHelper = null

  connect() {
    console.log("Ranking item controller connected")
    
    // ターゲットの確認
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

    // 結果表示用のDOMを設定
    if (this.hasSearchResultsTarget) {
      this.resultsController.searchResultsTarget = this.searchResultsTarget;
      this.resultsController.hasSearchResultsTarget = true;
    }

    // ShopSearchHelperの初期化（オブジェクトリテラル形式に対応）
    this.shopSearchHelper = Object.create(ShopSearchHelper);
    this.shopSearchHelper.initialize({
      onSearchStart: this.showSearchingState.bind(this),
      onSearchComplete: (results) => {
        this.resultsController.displayResults(results);
      },
      onSearchError: () => this.displaySearchError(),
    });

    // RankingItemHelperの初期化（オブジェクトリテラル形式に対応）
    this.rankingItemHelper = Object.create(RankingItemHelper);
    this.rankingItemHelper.initialize({
      onSaveStart: () => this.showSavingIndicator("ランキングに保存中..."),
      onSaveSuccess: (result) => this.handleSaveSuccess(result),
      onSaveError: (error) => this.handleSaveError(error),
      onUpdateStart: () => this.showSavingIndicator(),
      onUpdateSuccess: (result) => this.handleEditSuccess(result),
      onUpdateError: (error) => this.handleEditError(error)
    });

    // 既存の編集ボタンにイベントリスナーを追加
    this.setupEditButtons()

    // 画像プレビュー機能の設定
    if (this.hasMenuPhotoInputTarget) {
      this.menuPhotoInputTarget.addEventListener('change', this.handlePhotoInputChange.bind(this));
    }

    // モーダルが閉じる前のイベントハンドラを追加
    this.shopSearchModalTarget.addEventListener('hide.bs.modal', this.handleModalHide.bind(this))
    this.menuInputModalTarget.addEventListener('hide.bs.modal', this.handleModalHide.bind(this))
    document.getElementById('edit-item-modal').addEventListener('hide.bs.modal', this.handleModalHide.bind(this))
  }

  // モーダルが閉じる前にフォーカスを移動するメソッド
  handleModalHide(event) {
    // フォーカスをモーダル外の要素に移動
    document.body.focus()
    // または何も選択されていない状態にする
    document.activeElement.blur()
  }

  // 「ラーメンを追加」ボタンクリック時にモーダルを表示
  openShopSearchModal() {
    this.shopSearchModal.show()
  }

  // 手動登録フォームの表示切り替え
  toggleManualForm(event) {
    event.preventDefault()

    // フォームの現在の表示状態を取得
    const isCurrentlyVisible = this.manualFormTarget.style.display !== 'none';

    // フォームの表示状態を切り替え
    this.manualFormTarget.style.display = isCurrentlyVisible ? 'none' : 'block';

    // 手動フォームの表示状態に応じて「選択して次へ」ボタンの状態を更新
    this.updateSelectButtonState();

    // フォームが表示されたらマップ検索の選択状態をリセット
    if (!isCurrentlyVisible) {
      console.log("手動フォームが表示されました。");
      this.clearMapSelectionVisuals();
      this.selectedShop = null;
      console.log("地図検索の選択状態と選択情報をリセットしました。");
    } else {
      console.log("手動フォームが非表示になりました。");
    }
  }

  // 店舗選択ボタンをクリックしたときの処理
  selectShop() {
    // 1. 選択された店舗情報を取得
    const manualData = this.getSelectedShopData();

    // 店舗名が入力されているかチェック
    if (!manualData || !manualData.name) {
      alert("店舗名を入力してください");
      return;
    }

    // 2. 手動入力データを格納
    this.selectedShop = {
      id: null,                  // Google Place ID はない
      name: manualData.name,
      address: manualData.address,
      is_manual: true,           // 手動入力フラグ
      dbId: null                 // DB ID はない
    };

    console.log("手動入力店舗選択完了:", this.selectedShop);

    // 3. モーダル遷移 & UI調整
    this.manualFormTarget.style.display = 'none';
    this.menuInputModal.show();
    this.shopSearchModal.hide()
    this.menuNameInputTarget.focus();
    this.updateSelectButtonState();
  }

  // 「選択して次へ」ボタンの状態を更新するメソッド
  updateSelectButtonState() {
    const selectShopButton = document.getElementById('select-shop-btn');
    if (selectShopButton && this.hasManualFormTarget) {
      selectShopButton.disabled = this.manualFormTarget.style.display === 'none';
    } else if (selectShopButton) {
      selectShopButton.disabled = true;
    }
  }

  // 手動入力からの店舗データを取得
  getSelectedShopData() {
    if (this.hasManualFormTarget && this.manualFormTarget.style.display !== 'none') {
      const shopName = this.hasManualShopNameTarget ? this.manualShopNameTarget.value.trim() : null;
      const shopAddress = this.hasManualShopAddressTarget ? this.manualShopAddressTarget.value.trim() : '';

      if (!shopName) {
        return null;
      }

      return {
        name: shopName,
        address: shopAddress || '',
        is_manual: true
      }
    }
    return null;
  }

  // 店舗検索を実行するメソッド
  async searchShops() {
    const keyword = this.searchInputTarget.value.trim()

    if (!keyword) {
      alert('検索キーワードを入力してください')
      return
    }

    try {
      // ShopSearchHelperを使用して検索
      await this.shopSearchHelper.searchShops(keyword);
    } catch (error) {
      console.error("店舗検索中にエラーが発生しました", error);
      this.displaySearchError();
    }
  }

  // 検索結果から店舗を選択
  async selectMapShop(event) {
    event.preventDefault()
    const selectedButton = event.currentTarget
    const placeId = selectedButton.dataset.placeId;

    if (!placeId) {
      console.error("Place IDが取得できませんでした。HTMLの data-place-id 属性を確認してください。")
      alert("店舗情報の取得に失敗しました")
      return;
    }

    // 手動入力フォームが表示されていれば隠す
    if (this.hasManualFormTarget && this.manualFormTarget.style.display !== 'none') {
      this.manualFormTarget.style.display = 'none'
      this.updateSelectButtonState();
    }

    // 視覚的な選択状態表示
    this.searchResultsTarget.querySelectorAll('.list-group-item').forEach(item => item.classList.remove('active'));
    selectedButton.classList.add('active');

    this.showSavingIndicator("店舗情報を登録中...");

    try {
      // 1. 店舗詳細情報を取得
      const placeDetails = await this.shopSearchHelper.getShopDetails(placeId);
      
      // 2. サーバーに店舗情報を送信してShop IDを取得
      const csrfToken = this.getCSRFToken();
      if (!csrfToken) {
        throw new Error("CSRFトークンが取得できませんでした。ページをリロードしてください。");
      }
      
      const shopInfo = await this.shopSearchHelper.registerShopToServer(placeDetails, placeId, csrfToken);

      // 3. 店舗情報を保存
      this.selectedShop = {
        id: placeId,           // Google Place ID
        name: shopInfo.name,
        address: shopInfo.address,
        is_manual: false,      // 地図からの選択
        dbId: shopInfo.dbId    // DB上のShop ID
      }
      console.log("店舗選択とDB登録/検索が完了:", this.selectedShop);

      // 4. モーダル遷移
      this.shopSearchModal.hide()
      this.menuInputModal.show()
      this.menuNameInputTarget.focus();

    } catch (error) {
      console.error("店舗情報の取得中にエラーが発生しました", error)
      alert(`エラーが発生しました: ${error.message}`);
      selectedButton.classList.remove('active');
      this.selectedShop = null;
    } finally {
      this.hideSavingIndicator();
    }
  }

  // メニュー写真が選択されたときの処理
  handlePhotoInputChange(event) {
    const fileInput = event.target;
    const previewContainer = document.getElementById('photo-preview');
    const previewImg = document.getElementById('photo-preview-img');

    if (fileInput.files && fileInput.files[0]) {
      const reader = new FileReader();
      
      reader.onload = function(e) {
        previewImg.src = e.target.result;
        previewContainer.style.display = 'block';
      };
      
      reader.readAsDataURL(fileInput.files[0]);
    } else {
      previewContainer.style.display = 'none';
    }
  }

  // メニュー追加処理
  addMenu() {
    // メニュー名を取得
    const menuName = this.menuNameInputTarget.value.trim()
    if (!menuName) { alert("メニュー名を入力してください。"); return; }
    if (!this.selectedShop) { alert("店舗が選択されていません。"); return; }

    // FormDataオブジェクトを作成して送信データを構築
    const formData = new FormData();
    
    if (this.selectedShop.is_manual) {
      // 手動入力の場合
      if (!this.selectedShop.name) { alert("手動入力の店舗名が設定されていません。"); return; }
      formData.append('ranking_item[menu_name]', menuName);
      formData.append('ranking_item[is_manual]', 'true');
      formData.append('ranking_item[manual_shop_name]', this.selectedShop.name);
      formData.append('ranking_item[manual_shop_address]', this.selectedShop.address || '');
    } else {
      // 地図検索の場合
      if (!this.selectedShop.dbId) { alert("店舗IDが取得できていません。店舗を選択し直してください。"); return; }
      formData.append('ranking_item[shop_id]', this.selectedShop.dbId);
      formData.append('ranking_item[menu_name]', menuName);
      formData.append('ranking_item[is_manual]', 'false');
    }
    
    // 写真がアップロードされていれば追加
    if (this.hasMenuPhotoInputTarget && this.menuPhotoInputTarget.files && this.menuPhotoInputTarget.files[0]) {
      formData.append('ranking_item[photo]', this.menuPhotoInputTarget.files[0]);
    }

    // サーバーにデータを送信
    this.rankingItemHelper.saveRankingItemWithFormData(formData, this.urlValue, this.rankingIdValue);

    this.menuInputModal.hide();

    // 入力欄や選択状態をクリア
    this.menuNameInputTarget.value = '';
    if (this.hasMenuPhotoInputTarget) {
      this.menuPhotoInputTarget.value = '';
    }
    document.getElementById('photo-preview').style.display = 'none';
  }

  // 編集ボタンにイベントリスナーを追加するメソッド
  attachEditButtonEvent(button) {
    if (!button) return

    button.addEventListener('click', (event) => {
      const itemId = event.currentTarget.dataset.id
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
      // 編集用フォームをRankingItemHelperから取得
      const html = await this.rankingItemHelper.fetchEditForm(this.rankingIdValue, itemId);

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
    const form = event.currentTarget
    const itemId = form.dataset.rankingItemId
    
    try {
      // RankingItemHelperを使用して更新処理
      const result = await this.rankingItemHelper.updateRankingItem(form);
      // 編集成功のハンドラーは、コールバックでRankingItemHelperから呼び出される
    } catch (error) {
      // エラーハンドラーはコールバックで処理される
      console.error("更新処理に失敗しました", error);
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
    // resultsControllerが結果を表示するため何もしない
  }

  // 検索エラーを表示
  displaySearchError() {
    const container = this.searchResultsTarget.querySelector('.search-results-container')
    container.innerHTML = '<div class="alert alert-danger">検索中にエラーが発生しました。時間をおいて再度お試しください。</div>'
  }

  // 保存中の表示
  showSavingIndicator(message = "保存中...") {
    console.log(message)
    // 必要に応じてUIにインジケーターを表示
  }

  // 保存中表示を非表示
  hideSavingIndicator() {
    // インジケーターを非表示
  }

  // 地図検索結果の視覚的な選択状態（ハイライト）を解除するメソッド
  clearMapSelectionVisuals() {
    if (this.hasSearchResultsTarget) {
      const activeItem = this.searchResultsTarget.querySelector('.list-group-item.active, .list-group-item-action.active');
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
    // ヘルパーを使ってDOMにアイテムを追加
    const newItem = this.rankingItemHelper.addItemToDom(result, this.rankingIdValue);
    
    if (newItem) {
      // 編集ボタンにイベントリスナーを追加
      this.attachEditButtonEvent(newItem.querySelector('.edit-item-btn'));
    }

    // 入力フィールドをクリア
    this.menuNameInputTarget.value = '';
    this.searchInputTarget.value = '';
    if (this.hasMenuPhotoInputTarget) {
      this.menuPhotoInputTarget.value = '';
      document.getElementById('photo-preview').style.display = 'none';
    }

    // 選択された店舗情報をリセット
    this.selectedShop = null;
  }

  // 保存エラー時の処理
  handleSaveError(error) {
    // エラーメッセージを表示
    const errorMessage = document.createElement('div');
    errorMessage.className = 'alert alert-danger alert-dismissible fade show';
    errorMessage.innerHTML = `
      <strong>エラー!</strong> 保存中に問題が発生しました。もう一度お試しください。
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    document.querySelector('.main-content').prepend(errorMessage);
  }

  // 編集成功時の処理
  handleEditSuccess(result) {
    // モーダルを閉じる
    this.editItemModal.hide();

    // 画面上のアイテム情報を更新
    this.rankingItemHelper.updateItemInDom(result, result.id);
  }

  // 編集エラー時の処理
  handleEditError(error) {
    // エラーメッセージを表示
    const errorMessage = document.createElement('div');
    errorMessage.className = 'alert alert-danger alert-dismissible fade show';
    errorMessage.innerHTML = `
      <strong>エラー!</strong> 更新中に問題が発生しました。もう一度お試しください。
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    document.querySelector('.main-content').prepend(errorMessage);

    // モーダルは閉じない（ユーザーが再試行できるようにする）
  }
}
