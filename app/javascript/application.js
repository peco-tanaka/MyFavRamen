// Entry point for the build script in your package.json
import "@hotwired/turbo-rails"
import * as bootstrap from "bootstrap"
import Sortable from "sortablejs"
import "./controllers"

// PWA対応のためのServiceWorker登録
import "./pwa"

console.log("Hello from application.js!")

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