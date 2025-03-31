// Entry point for the build script in your package.json
import { Application } from "@hotwired/stimulus"
import "@hotwired/turbo-rails"
import * as bootstrap from "bootstrap"
import Sortable from "sortablejs"

// Stimulusアプリケーションを開始
const application = Application.start()

// 必要に応じてSortableをグローバルに公開
window.Sortable = Sortable

// Bootstrapコンポーネントの初期化（必要に応じて）
// document.addEventListener("DOMContentLoaded", function() {
//   // 例: トーストの初期化
//   const toastElList = [].slice.call(document.querySelectorAll('.toast'))
//   toastElList.map(function(toastEl) {
//     return new bootstrap.Toast(toastEl)
//   })
// })

// controllersディレクトリからコントローラーをインポート
import "./controllers"

// アプリケーションをエクスポート（他のファイルで使用可能に）
export { application }