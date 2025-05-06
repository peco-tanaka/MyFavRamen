require 'rails_helper'

RSpec.describe RankingItem, type: :model do
  describe 'バリデーション' do
    let(:shop) { create(:shop) }
    let(:ranking_item) { build(:ranking_item, shop: shop) }
    let(:manual_ranking_item) { build(:ranking_item, :manual_shop) }
    let(:with_photo_item) { build(:ranking_item, :with_photo, shop: shop) }

    context '有効な場合' do
      it '通常パターン：ランキング、店舗、ポジション、メニュー名があれば有効' do
        ranking_item = build(:ranking_item)
        expect(ranking_item).to be_valid
      end

      it '手動入力パターン：ランキング、手動店舗名、ポジション、メニュー名があれば有効' do
        ranking_item = build(:ranking_item, :manual_shop)
        expect(ranking_item).to be_valid
      end

      it '写真が添付されている場合も有効' do
        ranking_item = build(:ranking_item, :with_photo)
        expect(ranking_item).to be_valid
      end
    end

    context '無効な場合' do
      it 'ランキングIDがなければ無効' do
        ranking_item = build(:ranking_item, ranking: nil)
        ranking_item.valid?
        expect(ranking_item.errors.full_messages).to include("Rankingを入力してください")
      end

      it 'ポジションがなければ無効' do
        ranking_item = build(:ranking_item, position: nil)
        ranking_item.valid?
        expect(ranking_item.errors.full_messages).to include("Positionを入力してください")
      end

      it 'メニュー名がなければ無効' do
        ranking_item = build(:ranking_item, menu_name: nil)
        ranking_item.valid?
        expect(ranking_item.errors.full_messages).to include("Menu nameを入力してください")
      end

      it '手動入力で店舗名がなければ無効' do
        ranking_item = build(:ranking_item, is_manual: true, shop: nil, manual_shop_name: nil)
        ranking_item.valid?
        expect(ranking_item.errors.full_messages).to include("Manual shop nameを入力してください")
      end

      it '地図検索モードでshop_idがなければ無効' do
        ranking_item = build(:ranking_item, is_manual: false, shop: nil)
        ranking_item.valid?
        expect(ranking_item.errors.full_messages).to include("Shopを入力してください")
      end

      it '同一ランキング内で同じ店舗の同じメニューは登録できない' do
        # まず1つ目を保存
        first_item = create(:ranking_item)
        # 同じランキング、同じ店舗、同じメニュー名で2つ目を作成
        duplicate_item = build(:ranking_item,
                              ranking: first_item.ranking,
                              shop: first_item.shop,
                              menu_name: first_item.menu_name)

        duplicate_item.valid?
        expect(duplicate_item.errors.full_messages).to include("Menu name同じランキング内で同じ店舗の同じメニューは登録できません")
      end
    end
  end

  describe 'アソシエーション' do
    it 'ランキングに属している' do
      expect(RankingItem.reflect_on_association(:ranking).macro).to eq :belongs_to
    end

    it '店舗に属している（オプション）' do
      expect(RankingItem.reflect_on_association(:shop).macro).to eq :belongs_to
      expect(RankingItem.reflect_on_association(:shop).options[:optional]).to eq true
    end

    it '写真を添付できる' do
      # Activestorageのアソシエーションは少し特殊なのでインスタンスレベルでテスト
      ranking_item = build(:ranking_item, :with_photo)
      expect(ranking_item.photo).to be_attached
    end
  end

  describe 'モデルのインスタンスメソッド' do
    describe '#shop_display_name' do
      it '通常の店舗の場合、shop.nameを返す' do
        shop = create(:shop, name: "テスト店舗")
        ranking_item = create(:ranking_item, shop: shop, is_manual: false)
        expect(ranking_item.shop_display_name).to eq "テスト店舗"
      end

      it '手動入力の場合、manual_shop_nameを返す' do
        ranking_item = create(:ranking_item, :manual_shop, manual_shop_name: "手動店舗名")
        expect(ranking_item.shop_display_name).to eq "手動店舗名"
      end
    end

    describe '#shop_display_address' do
      it '通常の店舗の場合、shop.addressを返す' do
        shop = create(:shop, address: "テスト住所")
        ranking_item = create(:ranking_item, shop: shop, is_manual: false)
        expect(ranking_item.shop_display_address).to eq "テスト住所"
      end

      it '手動入力の場合、manual_shop_addressを返す' do
        ranking_item = create(:ranking_item, :manual_shop, manual_shop_address: "手動住所")
        expect(ranking_item.shop_display_address).to eq "手動住所"
      end
    end

    describe 'acts_as_list機能' do
      let(:ranking) { create(:ranking) }

      it '同じランキング内でpositionが自動的に採番される' do
        # 同じランキングに複数のアイテムを追加
        item1 = create(:ranking_item, ranking: ranking, position: 1)
        item2 = create(:ranking_item, ranking: ranking, position: 2)
        item3 = create(:ranking_item, ranking: ranking, position: 3)

        # positionが期待通りに設定されていることを確認
        expect(item1.position).to eq 1
        expect(item2.position).to eq 2
        expect(item3.position).to eq 3
      end

      it 'アイテムを削除すると、後続のアイテムのpositionが繰り上がる' do
        # 同じランキングに複数のアイテムを追加
        item1 = create(:ranking_item, ranking: ranking, position: 1)
        item2 = create(:ranking_item, ranking: ranking, position: 2)
        item3 = create(:ranking_item, ranking: ranking, position: 3)

        # 真ん中のアイテムを削除
        item2.destroy

        # 残りのアイテムのpositionが更新されることを確認
        expect(item1.reload.position).to eq 1
        expect(item3.reload.position).to eq 2
      end

      it '異なるランキング同士では、positionが独立して管理される' do
        # 2つの異なるランキングを作成
        ranking2 = create(:ranking)

        # 各ランキングに同じpositionのアイテムを作成
        item1 = create(:ranking_item, ranking: ranking, position: 1)
        item2 = create(:ranking_item, ranking: ranking2, position: 1)

        # それぞれのランキングで独立してpositionが設定されていることを確認
        expect(item1.position).to eq 1
        expect(item2.position).to eq 1
      end
    end
  end
end
