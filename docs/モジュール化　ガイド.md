# JavaScript・Stimulusコントローラーのモジュール化ガイド

## 目次
1. [はじめに](#はじめに)
2. [モジュール化の目的](#モジュール化の目的)
3. [モジュール化の流れ](#モジュール化の流れ)
4. [各モジュールの役割](#各モジュールの役割)
5. [使用したデザインパターン](#使用したデザインパターン)
6. [実装のポイント](#実装のポイント)
7. [モジュール間の連携方法](#モジュール間の連携方法)
8. [まとめ](#まとめ)

## はじめに

大規模になってしまったJavaScriptコード、特にStimulusコントローラーをモジュール化する方法について解説します。今回は「MapsController」という巨大なクラスを複数の小さなコントローラーに分割するプロセスを紹介します。

### 元のコードの問題点

- 1つのファイルが約300行以上と巨大
- 複数の異なる責任（マップ、マーカー、検索、表示）が混在
- コードの再利用が困難
- 保守性と可読性が低下

## モジュール化の目的

1. **責任の分離**: 各コントローラーが特定の機能セットに集中
2. **コードの再利用性**: 機能ごとのモジュールを他の場所でも再利用可能に
3. **テスト容易性**: 小さなモジュールは個別にテストが容易
4. **可読性の向上**: コードの理解と修正がしやすくなる
5. **拡張性**: 将来の機能追加が容易になる

## モジュール化の流れ

モジュール化は以下の5つの主要ステップで行いました：

### ステップ1: コードの分析と責任の識別

まず元のコントローラーを分析し、主要な責任を特定しました：
- マップの初期化と設定
- マーカーの作成と表示
- 検索機能
- 検索結果の表示

### ステップ2: 共通ユーティリティモジュールの作成

共通で使われる機能を抽出して「MapsHelper」モジュールを作成しました。

```javascript
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
  
  // その他の共通メソッド...
};
```

### ステップ3: 基本マップコントローラーの作成

マップ初期化の責任を持つ基本コントローラーを作成しました。

```javascript
// app/javascript/controllers/base_map_controller.js
import { Controller } from "@hotwired/stimulus";
import { MapsHelper } from "../utilities/maps_helper";

export default class extends Controller {
  static targets = ["map", "loading"];
  
  // 共通プロパティとメソッド...
  
  async initMap() {
    // マップの初期化処理...
  }
}
```

### ステップ4: 機能別コントローラーの作成

マーカー、検索、結果表示のためのコントローラーを作成しました。

```javascript
// app/javascript/controllers/marker_controller.js
// app/javascript/controllers/search_controller.js
// app/javascript/controllers/results_controller.js
```

### ステップ5: メインコントローラーのリファクタリング

最後に元のMapsControllerを、作成したモジュールを利用するオーケストレーター（指揮者）として書き換えました。

```javascript
// app/javascript/controllers/maps_controller.js
import { Controller } from "@hotwired/stimulus";
import { MapsHelper } from "../utilities/maps_helper";
import BaseMapController from "./base_map_controller";
import MarkerController from "./marker_controller";
import SearchController from "./search_controller";
import ResultsController from "./results_controller";

export default class extends Controller {
  // 各コントローラーの初期化と連携...
}
```

## 各モジュールの役割

### MapsHelper
- Google Maps APIとの連携の抽象化
- 共通ユーティリティ関数の提供
- エラーハンドリングの一元化

### BaseMapController
- Googleマップの初期化と設定
- 基本的なマップ操作の提供
- 他のコントローラーが利用するマップオブジェクトの準備

### MarkerController
- マーカーの作成と管理
- マーカークリックなどのインタラクション処理
- マーカーの一括操作機能

### SearchController
- キーワード検索機能
- 周辺検索機能
- Places APIとの連携

### ResultsController
- 検索結果のUI表示
- 結果リストのイベント処理
- ローディング状態の管理

### MapsController（リファクタリング後）
- 各コントローラーの調整役（オーケストレーター）
- データとイベントの仲介
- ページレベルの状態管理

## 使用したデザインパターン

### 1. モジュールパターン
各機能を独立したモジュールとして分離し、APIを通じて連携させました。

### 2. 依存性注入（Dependency Injection）
各コントローラーが必要とするオブジェクト（mapやinfoWindow）を外部から提供しました。

```javascript
// 依存性注入の例
initialize(map, infoWindow) {
  this.map = map;
  this.infoWindow = infoWindow;
}
```

### 3. オブザーバーパターン（コールバック関数版）
イベント発生時に通知するためにコールバック関数を使用しました。

```javascript
// コールバック関数の使用例
this.searchController.initialize(this.map, (places) => {
  // 検索結果を処理
  this.resultsController.displayResults(places);
});
```

### 4. ファサードパターン
MapsHelperが複雑なGoogle Maps APIへのアクセスを簡素化しました。

### 5. メディエーターパターン
MapsControllerが他のコントローラー間の調整役として機能しています。

## 実装のポイント

### 1. 明示的な初期化順序
依存関係のあるコントローラーは適切な順序で初期化する必要があります。

```javascript
// 初期化の順序の例
async initializeControllers() {
  // 1. ベースマップの初期化（他の全てが依存）
  this.baseMapController = new BaseMapController();
  await this.baseMapController.initMap();
  
  // 2. マップに依存する他のコントローラーの初期化
  this.markerController = new MarkerController();
  this.markerController.initialize(this.map, this.infoWindow);
  
  // 3. 以下同様...
}
```

### 2. エラーハンドリングの階層化
各モジュールは自身の責任範囲でエラーを処理し、必要に応じて上位に伝播させます。

```javascript
async someMethod() {
  try {
    // 処理
  } catch (error) {
    console.error("エラー詳細", error);
    // 必要に応じてエラーを上位に伝播
    throw error; // または return null/[] などで処理継続
  }
}
```

### 3. 状態の明示的な共有
コントローラー間で状態を共有する際は明示的に行います。

```javascript
// 状態共有の例
if (this.hasSearchInputTarget) {
  this.searchController.searchInputTarget = this.searchInputTarget;
}
```

### 4. 配列を使ったオブジェクト管理
作成したオブジェクト（マーカーなど）を配列で管理し、一括操作を可能にします。

```javascript
// 配列によるオブジェクト管理
const markers = [];
// マーカー作成後に配列に追加
markers.push(marker);
// 後で一括操作が可能
markers.forEach(marker => marker.map = null); // 全マーカー削除
```

## モジュール間の連携方法

### 1. プロパティの共有
HTMLターゲット要素などのプロパティを共有します。

```javascript
// プロパティ共有の例
this.markerController.mapTarget = this.mapTarget;
```

### 2. メソッド呼び出し
あるコントローラーのメソッドから別のコントローラーのメソッドを呼び出します。

```javascript
// メソッド呼び出しの例
const places = await this.searchController.searchShops();
this.markerController.addShopMarkers(places);
```

### 3. コールバック関数
非同期処理の結果を通知するためにコールバック関数を使用します。

```javascript
// コールバック登録の例
this.resultsController.initialize((placeId) => {
  this.handlePlaceSelection(placeId);
});

// コールバック呼び出しの例
if (this.onResultsFound && typeof this.onResultsFound === 'function') {
  this.onResultsFound(places || []);
}
```

## まとめ

### モジュール化の効果
- コードの可読性と保守性が大幅に向上
- 各コントローラーが特定の責任に集中し、開発効率が向上
- テストが容易になり、品質向上に寄与
- 将来的な機能追加が簡単に

### 学習のポイント
1. **責任の分離**: 一つのモジュールには一つの責任を持たせる
2. **依存関係の明示**: モジュール間の依存関係を明示的にする
3. **インターフェースの設計**: モジュール間の連携方法を慎重に設計する
4. **エラーハンドリング**: 各モジュールで適切にエラーを処理する
5. **状態管理**: 共有状態を明示的に管理する

### 学習リソース
- [Single Responsibility Principle](https://en.wikipedia.org/wiki/Single-responsibility_principle)
- [Stimulus公式ドキュメント](https://stimulus.hotwired.dev/)
- [JavaScript Design Patterns](https://www.patterns.dev/posts#design-patterns)
- [Clean Code in JavaScript](https://github.com/ryanmcdermott/clean-code-javascript)

このガイドが、あなたの今後の開発におけるコードの構造化と設計の参考になれば幸いです。モジュール化は最初は手間がかかりますが、長期的には大きなメリットをもたらします。