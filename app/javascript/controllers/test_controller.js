import { Controller } from "@hotwired/stimulus"

// Connects to data-controller="test"
// stimulusの基本構文です

// data-controller="hello"のHTML要素に接続
export default class extends Controller {
  // HTML要素へのアクセス用 (例: data-hello-target="output")
  static targets = ["output"]

  // HTML要素から値を取得 (例: data-hello-name-value="世界")
  static values = {
    name: String,                         // 文字列型
    count: { type: Number, default: 0 }   // 数値型（デフォルト値：0）
  }

  // クラス名定義 (例: data-hello-active-class="bg-red-500")
  static classes = ["active"]

  // 初期化時に実行
  connect() {
    console.log("Helloコントローラー接続")

    if (this.hasNameValue) {
      this.outputTarget.textContent = `こんにちは、${this.nameValue}！`
    }
  }

  // ボタンクリック時のアクション (data-action="click->hello#greet")
  greet() {
    this.countValue++
    this.outputTarget.textContent = `${this.nameValue}さん、${this.countValue}回目のクリックです！`
    this.outputTarget.classList.toggle(this.activeClass)
  }

  // 値変更時のコールバック
  nameValueChanged(value, previousValue) {
    console.log(`名前が${previousValue}から${value}に変更されました`)
  }

  // 切断時に実行
  disconnect() {
    console.log("Helloコントローラー切断")
  }
}