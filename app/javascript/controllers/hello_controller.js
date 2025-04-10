// デフォルトで生成されたStimulusコントローラです。構文参照用

import { Controller } from "@hotwired/stimulus"

// Connects to data-controller="hello"
export default class extends Controller {
  // ターゲットの定義
  static targets = [ "name", "output" ]

  static values = {
    greeting: { type: String, default: "Hello" }
  }

  connect() {
    console.log("HelloController connected")
  }

  greet() {
    const name = this.nameTarget.value
    this.outputTarget.textContent = `${this.greetingValue}, ${name}!`
  }
}
// 公式ドキュメントコード
// let map;
// let placesService;

// document.addEventListener('turbo:load', function() {

//   initMap();
// });

// async function initMap() {
//   const { Map } = await google.maps.importLibrary("maps");

//   map = new Map(document.getElementById("map"), {
//     center: { lat: -34.397, lng: 150.644 },
//     zoom: 8,
//   });
// }

// initMap()