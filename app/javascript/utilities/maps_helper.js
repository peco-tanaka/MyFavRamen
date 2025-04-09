// app/javascript/utilities/maps_helper.js
export const MapsHelper = {
  // Google Maps APIライブラリの読み込み
  async loadMapsLibrary(libraryName) {
    try {
      return await google.maps.importLibrary(libraryName);
    } catch (error) {
      console.error(`${libraryName}ライブラリの読み込みに失敗しました`, error);
      throw error;
    }
  },

  // デフォルト位置（東京）
  getDefaultLocation() {
    return { lat: 35.6812, lng: 139.7671 };
  },

  // 読み込み中表示/非表示の共通関数
  showElement(element) {
    if (element) {
      element.style.display = 'flex';
    }
  },

  hideElement(element) {
    if (element) {
      element.style.display = 'none';
    }
  }
};