require 'rails_helper'

RSpec.describe Ranking, type: :model do
  describe 'バリデーション' do
    let(:user) { create(:user) } # 先にユーザーを明示的に作成
    let(:ranking) { build(:ranking, user: user) } # 作成したユーザーを関連付け

    context '有効な場合' do
      it 'ユーザーID、ジャンルID、公開フラグが正しい場合' do
        expect(ranking).to be_valid
      end
    end

    context '無効な場合' do
      it 'ユーザーIDがnilの場合' do
        ranking.user_id = nil
        ranking.valid?
        expect(ranking.errors.full_messages).to include("Userを入力してください")
      end

      it 'ジャンルIDがnilの場合' do
        ranking.genre_id = nil
        ranking.valid?
        expect(ranking.errors.full_messages).to include("Genreを入力してください")
      end

      it '公開フラグがnilの場合' do
        ranking.is_public = nil
        ranking.valid?
        expect(ranking.errors.full_messages).to include("Is publicは一覧にありません")
      end

      it 'ユーザーIDとジャンルIDの組み合わせが重複する場合' do
        ranking.save # 一つ目のランキングを保存
        duplicate_ranking = build(:ranking, user: ranking.user, genre_id: ranking.genre_id) # 同じユーザーとジャンルIDで新しいランキングを作成
        duplicate_ranking.valid? # バリデーションを実行
        expect(duplicate_ranking.errors.full_messages).to include("Genreはすでに存在します")
      end
    end
  end

  describe 'アソシエーション' do
    it 'ユーザーに関連付けられている' do
      expect(Ranking.reflect_on_association(:user).macro).to eq(:belongs_to)
    end

    it 'ジャンルに関連付けられている' do
      expect(Ranking.reflect_on_association(:genre).macro).to eq(:belongs_to)
    end

    it '複数のランキングアイテムを持つ' do
      expect(Ranking.reflect_on_association(:ranking_items).macro).to eq(:has_many)
    end

    it 'ランキングアイテムを通して複数の店舗を持つ' do
      expect(Ranking.reflect_on_association(:shops).macro).to eq(:has_many)
      expect(Ranking.reflect_on_association(:shops).options[:through]).to eq(:ranking_items)
    end
  end

  describe '依存関係' do
    it 'ランキングが削除されると関連するランキングアイテムも削除される' do
      ranking = create(:ranking)
      create(:ranking_item, ranking: ranking)
      create(:ranking_item, ranking: ranking)
      # 削除前のランキングアイテムの数を確認
      expect {
        ranking.destroy
      }.to change(RankingItem, :count).by(-2)
    end
  end
end
