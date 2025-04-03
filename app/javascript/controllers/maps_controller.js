import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["map"]

  connect() {
    if (this.hasMapTarget) {
      console.log("MapsController connected!")
      this.initMap()
    }
  }

  async initMap() {
    // Mapsライブラリを読み込む
    const { Map } = await google.maps.importLibrary("maps");

    // マップを初期化
    this.map = new Map(this.mapTarget, {
      center: { lat:35.6812, lng: 139.7671 },
      zoom: 14,
    });

    // Places APIを初期化（必要な場合）
    const { PlacesService } = await google.maps.importLibrary("places");
    this.placesService = new PlacesService(this.map);
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