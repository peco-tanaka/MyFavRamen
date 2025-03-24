# MyFavらぁめん データベース設計

## 1. usersテーブル
ユーザー情報を管理するテーブル

| column           | type    | options                   |
| ---------------- | ------- | ------------------------- |
| id               | integer | null: false, primary key  |
| nickname         | string  | null: false               |
| email            | string  | null: false, unique: true |
| encrypted_password | string  | null: false               |
| prefecture_id    | integer |                           |
| avatar           | string  |                           |
| favorite_type    | string  |                           |
| created_at       | datetime | null: false              |
| updated_at       | datetime | null: false              |

### association
- has_many :rankings
- has_many :ranking_items, through: :rankings
- has_many :favs
- has_many :fav_shops, through: :favs, source: :shop
- has_many :records
- has_many :active_follows, class_name: "Follow", foreign_key: "follower_id"
- has_many :passive_follows, class_name: "Follow", foreign_key: "followed_id"
- has_many :following, through: :active_follows, source: :followed
- has_many :followers, through: :passive_follows, source: :follower
- belongs_to_active_hash :prefecture

## 2. shopsテーブル
ラーメン店舗情報を管理するテーブル

| column           | type    | options                  |
| ---------------- | ------- | ------------------------ |
| id               | integer | null: false, primary key |
| name             | string  | null: false              |
| address          | string  | null: false              |
| latitude         | float   |                          |
| longitude        | float   |                          |
| business_hours   | string  |                          |
| phone            | string  |                          |
| website          | string  |                          |
| created_at       | datetime | null: false             |
| updated_at       | datetime | null: false             |

### association
- has_many :ranking_items
- has_many :rankings, through: :ranking_items
- has_many :favs
- has_many :users_who_fav, through: :favs, source: :user
- has_many :records

## 3. rankingsテーブル
ユーザーごとの各ジャンルのランキングを管理するテーブル

| column           | type    | options                                |
| ---------------- | ------- | -------------------------------------- |
| id               | integer | null: false, primary key               |
| user_id          | integer | null: false, foreign_key: true         |
| genre_id         | integer | null: false                            |
| created_at       | datetime | null: false                           |
| updated_at       | datetime | null: false                           |

### association
- belongs_to :user
- belongs_to_active_hash :genre
- has_many :ranking_items
- has_many :shops, through: :ranking_items

## 4. ranking_itemsテーブル
ランキング内の各店舗の順位情報を管理するテーブル

| column           | type    | options                                |
| ---------------- | ------- | -------------------------------------- |
| id               | integer | null: false, primary key               |
| ranking_id       | integer | null: false, foreign_key: true         |
| shop_id          | integer | null: false, foreign_key: true         |
| position         | integer | null: false                            |
| comment          | text    |                                        |
| photo            | string  |                                        |
| menu_name        | string  | null: false                            |
| created_at       | datetime | null: false                           |
| updated_at       | datetime | null: false                           |

### association
- belongs_to :ranking
- belongs_to :shop

*photoカラムの画像はActive_storageで管理

## 5. favsテーブル
ユーザーのお気に入り店舗を管理する中間テーブル

| column           | type    | options                                |
| ---------------- | ------- | -------------------------------------- |
| id               | integer | null: false, primary key               |
| user_id          | integer | null: false, foreign_key: true         |
| shop_id          | integer | null: false, foreign_key: true         |
| created_at       | datetime | null: false                           |
| updated_at       | datetime | null: false                           |

### association
- belongs_to :user
- belongs_to :shop

## 6. recordsテーブル
ユーザーのラーメン食べた記録を管理するテーブル

| column           | type    | options                                |
| ---------------- | ------- | -------------------------------------- |
| id               | integer | null: false, primary key               |
| user_id          | integer | null: false, foreign_key: true         |
| shop_id          | integer | null: false, foreign_key: true         |
| menu_name        | string  | null: false                            |
| visited_at       | date    | null: false                            |
| comment          | text    |                                        |
| photo            | string  |                                        |
| created_at       | datetime | null: false                           |
| updated_at       | datetime | null: false                           |

### association
- belongs_to :user
- belongs_to :shop

## 7. followsテーブル
ユーザー間のフォロー関係を管理する中間テーブル

| column           | type    | options                                |
| ---------------- | ------- | -------------------------------------- |
| id               | integer | null: false, primary key               |
| follower_id      | integer | null: false, foreign_key: {to_table: :users} |
| followed_id      | integer | null: false, foreign_key: {to_table: :users} |
| created_at       | datetime | null: false                           |
| updated_at       | datetime | null: false                           |

### association
- belongs_to :follower, class_name: "User"
- belongs_to :followed, class_name: "User"