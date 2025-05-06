require 'rails_helper'

RSpec.describe Shop, type: :model do
  describe 'バリデーション' do
    context '有効な場合' do
      it '名前があれば有効' do
        shop = build(:shop)
        expect(shop).to be_valid
      end

      it '住所がなくても有効' do
        shop = build(:shop, address: nil)
        expect(shop).to be_valid
      end

      it 'google_place_idが一意であること' do
        # Google Place IDがユニークかどうかをテスト
        create(:shop, google_place_id: "unique_id_123")
        shop = build(:shop, google_place_id: "unique_id_123")
        shop.valid?
        expect(shop.errors.full_messages).to include("Google placeはすでに存在します")
      end
    end

    context '無効な場合' do
      it '名前がなければ無効' do
        shop = build(:shop, name: nil)
        shop.valid?
        expect(shop.errors.full_messages).to include("Nameを入力してください")
      end
    end
  end

  describe 'アソシエーション' do
    it 'ランキングアイテムを複数持つ' do
      expect(Shop.reflect_on_association(:ranking_items).macro).to eq :has_many
    end

    it 'ランキングアイテムを通して複数のランキングを持つ' do
      expect(Shop.reflect_on_association(:rankings).macro).to eq :has_many
      expect(Shop.reflect_on_association(:rankings).options[:through]).to eq :ranking_items
    end

    it 'ランキングアイテムと依存関係を持つ（店舗が削除されるとショップIDがnullになる）' do
      expect(Shop.reflect_on_association(:ranking_items).options[:dependent]).to eq :nullify
    end
  end

  describe 'データ操作' do
    it '店舗情報を更新できる' do
      shop = create(:shop, name: "元の名前")

      # 情報を更新
      shop.update(name: "新しい名前")
      expect(shop.reload.name).to eq "新しい名前"
    end

    it '店舗を削除できる' do
      shop = create(:shop)
      expect { shop.destroy }.to change(Shop, :count).by(-1)
    end

    it '店舗が削除されてもランキングアイテムは削除されない' do
      shop = create(:shop)
      ranking_item = create(:ranking_item, shop: shop)

      expect { shop.destroy }.not_to change(RankingItem, :count)

      # ランキングアイテムのshop_idはnilになる
      expect(ranking_item.reload.shop_id).to be_nil
    end
  end
end
