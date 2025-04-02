import { Controller } from "@hotwired/stimulus"

// Connects to data-controller="hello"

// Controllerクラスを継承した新しいクラスを定義し、デフォルトエクスポート
export default class extends Controller {
  // このコントローラが操作するHTML要素を「ターゲット」として定義。nameとoutputの2つのターゲットを指定
  // ターゲットはHTML要素のdata-属性で指定される
  // 例えば、data-hello-target="name"のように指定することで、nameTargetとして参照できるようになる
  // これにより、コントローラ内でHTML要素を簡単に操作できるようになる
  static targets = [ "name", "output"]

  connect() {
    // コントローラが接続されたときに実行されるコード（必要に応じて）
    console.log("HelloController connected")
  }

  greet() {
    this.outputTarget.textContent = `Hello, ${this.nameTarget.value}!`
  }

}
