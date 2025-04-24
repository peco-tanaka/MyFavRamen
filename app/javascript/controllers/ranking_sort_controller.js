import { Controller } from "@hotwired/stimulus"
import Sortable from "sortablejs"

// Connects to data-controller="ranking-sort"
export default class extends Controller {
  static targets = ["container", "item"]

  static values = {
    rankingId: Number,
    demo: { type: Boolean, default: false }
  }

  connect() {
    console.log("RankingSortController connected")
    this.initSortable()
  }

  initSortable() {
    if (this.hasContainerTarget) {
      console.log("Initializing Sortable on:", this.containerTarget)

      // タッチデバイス検出
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

      this.sortable = new Sortable(this.containerTarget, {
        animation: 150,
        delay: 150,  // 長押し後にドラッグ開始
        ghostClass: "sortable-ghost",
        dragClass: "sortable-drag",
        delayOnTouchOnly: true,
        touchStartThreshold: 3, // タッチ開始時の移動許容量
        chosenClass: "sortable-chosen",
        forceFallback: isTouchDevice, // タッチデバイスではフォールバックモードを強制
        fallbackClass: "sortable-fallback", // フォールバックモード用のクラス
        onEnd: this.onSortEnd.bind(this),  // bind(this)でonSortEndメソッドの中でもコントローラーのプロパティやメソッドでアクセス可能にする
      })
    } else {
      console.warn("Container target not found")
    }
  }

  onSortEnd(event) {
    console.log("Sort ended:", event)
    // 順番が変わったことをコンソールに出力
    console.log(`Item moved from position ${event.oldIndex} to ${event.newIndex}`)

    // 新しい順序を計算
    this.updatePositions()

    // デモモードでない場合のみサーバーに順序の変更を送信
    if (!this.demoValue) {
      this.saveNewOrder()
    } else {
      console.log("デモモードのため、サーバー通信をスキップします")
    }
  }

  // 順序を変更するメソッド（この段階ではDBに保存されない）
  updatePositions() {
    // 全てのアイテムを取得して新しい位置を割り当て
    this.itemTargets.forEach((item, index) => {
      // 1-index のポジションを設定（1から始まる順番）
      const position = index + 1
      // datasetプロパティでアクセスしてデータ属性を更新
      item.dataset.position = position

      // アイテム内に順序を表示する要素があれば更新
      const positionElement = item.querySelector('.position-number')
      if (positionElement) {
        positionElement.textContent = position
      }

      console.log(`Item ${item.dataset.id} position updated to ${position}`)
    })
  }

  // サーバーに順序の変更を送信するメソッド
  async saveNewOrder() {
    // デモモードの場合は処理をスキップ
    if (this.demoValue) {
      console.log("デモモードのため、サーバー通信をスキップします")
      return
    }

    try {
      // データの準備
      const rankingId = this.rankingIdValue
      // rankingIdが設定されていない場合も処理をスキップ
      if (!rankingId) {
        console.log("rankingIdが設定されていないため、サーバー通信をスキップします")
        return
      }

      const itemPositions = {}

      // 各アイテムのIDと新しい位置を取得
      this.itemTargets.forEach((item, index) => {
        const itemId = item.dataset.id
        // 1-index のポジションを設定
        const position = index + 1
        itemPositions[itemId] = position
      })

      console.log("Saving new order:", itemPositions )

      // サーバーにデータを送信
      const response = await fetch(`/rankings/${rankingId}/ranking_items/sort`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': document.querySelector('[name="csrf-token"]').content
        },
        body: JSON.stringify({ item_position: itemPositions })
      })

      if (response.ok) {
        console.log("順序の保存に成功しました")
      } else {
        console.error("順序の保存に失敗しました")
        const errorText = await response.text()
        console.error("エラーが発生しました:", "error")
      }
    } catch (error) {
      console.error("順序の保存中にエラーが発生しました:", error)
    }
  }
}
