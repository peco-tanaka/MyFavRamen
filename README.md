# MyFavRamen

# 大事にしたところ
## 一人でも楽しめる
- ユーザーにはランキングを作り上げていく楽しさを一番味わって欲しい。
- 現実的に、他人のラーメン投稿を見たところで、地方のユーザーはいけないことがほとんど。
- よって、SNSはおまけ程度。交流は最小限で。

# 参考アプリ
- 毎日がラーメン
-- UIを参考
- ラーメン手帳
-- 機能はこっちに近い。名前をgooglemapからつけれるのいい

# アイデア
- ショップ情報に「みんなのランキング」が載る
-- 「〜さんの1位のメニュー！」

# DB設計

## usersテーブル
column|type|options
name, string, null: false
email, string, null: false
prefecture_id, integer, null: false


### association
has_many :favs
has_many :
belongs_to_active_hash :prefecture


## shopsテーブル

### association

## rankingsテーブル

### association

## ranking_itemsテーブル

### association

## favsテーブル

### association

## visitsテーブル

### association


## followsテーブル

### association