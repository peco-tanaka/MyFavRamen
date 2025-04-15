import { Controller } from "@hotwired/stimulus"
import Sortable from "sortablejs"

// Connects to data-controller="ranking-sort"
export default class extends Controller {
  static targets = ["container", "item"]

  connect() {
    console.log("RankingSortController connected")
    this.initSortable()
  }

  initSortable() {
    if (this.hasContainerTarget) {
      console.log("Initializing Sortable on:", this.containerTarget)

      this.sortable = new Sortable(this.containerTarget, {
        animation: 150,
        ghostClass: "sortable-ghost",
        dragClass: "sortable-drag",
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
    this.updatePositions() {
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

    // サーバーに順序の変更を送信
    this.saveNewOrder() {
      // データの準備
      const rankingId = this.element.dataset.rankingId
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
      fetch(`/rankings/${rankingId}/ranking_items/sort`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': document.querySelector('[name="csrf-token"]').content
        },
        body: JSON.stringify({ item_position: itemPositions })

        .then(response => {
          if (response.ok) {
            console.log("順序の保存に成功しました")
            // ユーザーに通知
            this.showNotification("順序が保存されました", "success")
          } else {
            console.error("順序の保存に失敗しました")
          }
        })
        .catch(error => {
          console.error("エラーが発生しました:", "error")
          // ユーザーに通知
          this.showNotification("エラーが発生しました", "error")
        })
      })

    }
  }
}
