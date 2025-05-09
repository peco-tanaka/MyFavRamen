# MyFavらぁめん
---
[![Image from Gyazo](https://i.gyazo.com/8018ea0e6fdd967120e7191139074a73.png)](https://gyazo.com/8018ea0e6fdd967120e7191139074a73)

出会った推しのラーメンをランキング付けして残したい！  
みんなのランキングから、新たなラーメンを開拓したい！  
そんなラーメン好きの願望を叶える、自分だけのラーメンランキング作成・共有アプリです。  
  

## URL
https://myfavramen.onrender.com/

#### テスト用アカウント
mail: sampleramen@gmail.com  
password: 11111a

#### Basic認証
ID: abcabc  
password: 123123

## アプリの使い方
1. 会員登録
2. ラーメン店を検索・登録
3. ドラッグ&ドロップでランキング作成

## 開発の経緯
ラーメン好きにとって、自分だけのお気に入りラーメン店を記録できるサービスが少ない！と感じていました。  
ランキング上位のアプリを使用してみたところ、店舗レビューやSNSに特化したサービスが多く、  
コツコツとお気に入りのラーメンを記録していくのには不向きに感じました。  

そこで、「評価」ではなく「個人ランキング」という概念を中心に据え、自分だけのラーメンランキングを作成できるサービスを開発しました。  
一人でランキングを作って記録を残していく楽しさを提供し、他のユーザーのランキングから新しいラーメンとの出会いも創出する事が出来る。  
そんなラーメン好きに愛されるサービスを目指します！  

## ユーザーのメリット
- 訪問したラーメン店を自分だけの基準でランキング付けして記録できる
- 食べ歩きの記録を視覚的に残すことができる
- Google Maps APIを活用した簡単な店舗検索・登録が可能
- スマートフォン前提のUIにより、外出先でもすぐに記録できる
- 将来的に他のラーメン愛好家との交流でお気に入り店舗の開拓ができる

## 主要機能
#### トップ画面
オレンジと白を基調としたデザインで統一  
中央にランキングの見本とデモ操作を体験できるセクションを用意  
[![Image from Gyazo](https://i.gyazo.com/da0701110dd206686fc2a70252010b3d.gif)](https://gyazo.com/da0701110dd206686fc2a70252010b3d)  
  
スマートフォンではシンプルな構成に変更  
[![Image from Gyazo](https://i.gyazo.com/ccc5492d938aed32d9b501d7000d4ab8.gif)](https://gyazo.com/ccc5492d938aed32d9b501d7000d4ab8)  

#### 店舗検索機能
googlemapから店舗検索可能  
「近くのお店を検索」ボタンで現在地を取得して近隣のラーメン店を検索  
[![Image from Gyazo](https://i.gyazo.com/8b55c17de1af06b7e3625721f62d9899.gif)](https://gyazo.com/8b55c17de1af06b7e3625721f62d9899)  

#### ランキング作成機能
google mapから店舗を検索可能  
店舗が見つからない場合、手動登録にも対応  
[![Image from Gyazo](https://i.gyazo.com/0d5ce479a180096c59c8917c0f066add.gif)](https://gyazo.com/0d5ce479a180096c59c8917c0f066add)  
  
ドラッグ&ドロップで直感的に作成可能  
基本的な削除・編集ボタンを搭載  
[![Image from Gyazo](https://i.gyazo.com/c9d3d6d1ef65761fba88750992ea04ae.gif)](https://gyazo.com/c9d3d6d1ef65761fba88750992ea04ae)  

#### ジャンル別ランキング画面
ランキングはジャンルごとに作成可能  
[![Image from Gyazo](https://i.gyazo.com/086d6e69fa8d69a273561fc38bac66fe.gif)](https://gyazo.com/086d6e69fa8d69a273561fc38bac66fe)  
  
スマートフォンではヘッダーがジャンル切り替えボタンに切り替わる  
[![Image from Gyazo](https://i.gyazo.com/a97511702ac1c9e1e73be96a3461ce8a.gif)](https://gyazo.com/a97511702ac1c9e1e73be96a3461ce8a)  

## 実装予定の機能
- お気に入り店舗登録機能
- 訪問履歴機能。訪問回数カウント機能
- 他のユーザーのランキング閲覧機能
- X投稿連携機能
- フォロー機能

## データベース設計

[![Image from Gyazo](https://i.gyazo.com/9ecbceb5a261869dbe1e095b24e52855.png)](https://gyazo.com/9ecbceb5a261869dbe1e095b24e52855)


## 画面遷移図

[![Image from Gyazo](https://i.gyazo.com/8283d862d47e0cc5eafda254175e6881.png)](https://gyazo.com/8283d862d47e0cc5eafda254175e6881)

## 使用技術

#### 言語・フレームワーク
- Ruby 3.2.7
- Ruby on Rails 7.2.2.1
- HTML5 / CSS3
- JavaScript (ES6)

#### データベース
- PostgreSQL 15.12

#### フロントエンド
- Bootstrap 5.3
- SortableJS (ドラッグ&ドロップ機能)
- Stimulus.js (Railsと連携したJavaScript)

#### 外部サービス
- Google Maps API
- AWS S3 (画像ストレージ)

#### インフラ
- Render (初期デプロイ)
- Docker / Docker Compose (開発環境)

#### 主要Gem
- devise（ユーザー認証機能）
- propshaft（アセットパイプライン）
- stimulus-rails（JavaScriptフレームワーク）
- rubocop（コード解析ツール）
- aws-sdk-s3（画像アップロード）

#### 主要JavaScriptライブラリ
- sortablejs（ドラッグ&ドロップ機能）
- esbuild（ビルドツール）

## 工夫したポイント
- GoogleMap APIを使用して近くの店舗から検索機能などを実装
- GoogleMap APIを使うこと登録店舗のデータベースに一貫性を持たせる
- ドラッグ&ドロップで直感的なランキング作成を重視
- スマホ前提の使用感を目指してレスポンシブ化
- PWA化してよりネイティブアプリに近い操作感を実現

## 改善点
- ランキングレイアウトを1〜3位までスクロール無しで閲覧できるよう変更
- 継続利用を促すゲーミフィケーション要素の検討（称号機能など）
- ユーザーログインの敷居の高さの改善（googleアカウントを利用するなど）
- 店舗検索からそのままランキングに追加できるよう導線を整備

## 制作時間
1ヶ月