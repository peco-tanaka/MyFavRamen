import { Controller } from "@hotwired/stimulus"
import * as bootstrap from "bootstrap"
import { MapsHelper } from "../utilities/maps_helper"
import { hide } from "@popperjs/core"

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

    // モーダルを初期化
    this.shopSearchModal = new bootstrap.Modal(this.shopSearchModalTarget)
    this.menuInputModal = new bootstrap.Modal(this.menuInputModalTarget)
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
  }

  // 店舗選択ボタンをクリックしたときの処理
  // data-action="click->ranking-item#selectShop"で呼び出し
  selectShop() {
    // 選択された店舗情報を取得
    this.selectedShop = this.getSelectedShopData()

    if (!this.selectedShop) {
      alert("店舗が選択されていません")
      return
    }

    // 店舗検索モーダルを閉じてメニュー入力モーダルを開く
    this.shopSearchModal.hide()
    this.menuInputModal.show()
  }

  // 地図または手動入力からの店舗データを取得
  getSelectedShopData() {
    // 手動入力フォームが表示されている場合
    if (this.manualFormTarget.style.display !== 'none') {
      const shopName = this.manualShopNameTarget.value
      const shopAddress = this.manualShopAddressTarget.value

      if (!shopName) {
        return null
      }

      return {
        name: shopName,
        address: shopAddress || '',  // 住所が空の場合は空文字を設定
        is_manual: true
      }
    } else {
      // 地図選択からデータを取得
      return this.getSelectedMapShop()
    }
  }

  // 地図から選択された店舗データを取得（プレースホルダー）
  getSelectedMapShop() {
    // 次のステップで実装
    // 現時点ではプレースホルダー
    return window.selectedMapShop || null
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
        shop_id: this.selectedShop.id, // APIから取得した場合
        menu_name: menuName,
        // その他必要なデータ
      }
    }

    // 手動入力の場合は店舗情報も送信
    if (this.selectedShop.is_manual) {
      data.shop = {
        name: this.selectedShop.name,
        address: this.selectedShop.address
      }
    }

    // 次のステップで実装するサーバー送信処理
    // this.saveRankingItem(data)

    // モーダルを閉じる
    this.menuInputModal.hide()
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

      this.displaySearchResults(this.searchResults)
      } catch (error) {
        console.error("店舗検索中にエラーが発生しました", error)
        this.displaySearchError()
      } finally {
        this.hideSearchingState()
      }
  }

  // 検索結果を表示するメソッド
  displaySearchResults(results) {
    const container = this.searchResultsTarget.querySelector('.search-results-container')
    container.innerHTML = '' // 既存の結果をクリア

    if (results.length === 0) {
      container.innerHTML = '<div class="alert alert-info">検索結果がありませんでした。別のキーワードで検索するか、手動で情報を入力してください。</div>'
      return
    }

    // 結果リストの作成
    const listGroup = document.createElement('div')
    listGroup.className = 'list-group'

    results.forEach(shop => {
      // Google Places APIの結果からデータを抽出
      const shopId = shop.id
      const shopName = shop.displayName
      const shopAddress = shop.formattedAddress || '住所情報なし'
      const rating = shop.rating || '評価なし'

      const item = document.createElement('a')
      item.href = '#'
      item.className = 'list-group-item list-group-item-action'
      item.dataset.shopId = shopId
      item.dataset.shopName = shopName
      item.dataset.shopAddress = shopAddress
      item.dataset.action = 'click->ranking-item#selectMapShop'

      item.innerHTML = `
        <div class="d-flex justify-content-between align-items-center">
          <div>
            <h5 class="mb-1">${shopName}</h5>
            <p class="mb-1 small text-muted">${shopAddress}</p>
          </div>
          <span class="badge bg-primary rounded-pill">選択</span>
        </div>
      `

      listGroup.appendChild(item)
    })

    container.appendChild(listGroup)
  }

  // 地図の検索結果から店舗を選択
  selectMapShop(event) {
    event.preventDefault()

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

    // 選択された店舗を保存
    this.selectedMapShop = {
      id: shopId,
      name: shopName,
      address: shopAddress
    }
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
}
