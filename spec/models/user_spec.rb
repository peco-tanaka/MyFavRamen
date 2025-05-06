require 'rails_helper'

RSpec.describe User, type: :model do
  describe 'ユーザー登録機能' do
    let(:user) { build(:user) }

    context '登録できる場合' do
      it 'すべての属性が有効である場合、登録できる' do
        expect(user).to be_valid
      end

      it '画像が添付されている場合も登録できる' do
        user = build(:user, :with_avatar)
        expect(user).to be_valid
      end
    end

    context '登録できない場合' do
      it 'メールアドレスが空の場合、登録できない' do
        user.email = nil
        user.valid?
        expect(user.errors.full_messages).to include("Eメールを入力してください")
      end

      it 'メールアドレスが一意でない場合、登録できない' do
        create(:user, email: user.email)
        user.valid?
        expect(user.errors.full_messages).to include("Eメールはすでに存在します")
      end

      it 'パスワードが空の場合、登録できない' do
        user.password = nil
        user.valid?
        expect(user.errors.full_messages).to include("パスワードを入力してください")
      end

      it 'ニックネームが空の場合、登録できない' do
        user.nickname = nil
        user.valid?
        expect(user.errors.full_messages).to include("Nicknameを入力してください")
      end

      it 'パスワードが6文字未満の場合、登録できない' do
        user.password = 'short'
        user.password_confirmation = 'short'
        user.valid?
        expect(user.errors.full_messages).to include("パスワードは6文字以上で入力してください")
      end

      it 'パスワード確認が一致しない場合、登録できない' do
        user.password_confirmation = 'different_password'
        user.valid?
        expect(user.errors.full_messages).to include("パスワード（確認用）とパスワードの入力が一致しません")
      end
    end
  end

  describe 'ログイン機能' do
    let!(:user) { create(:user, password: 'password123') }

    context 'パスワード検証' do
      it '正しいパスワードでログインできる' do
        expect(user.valid_password?('password123')).to be true
      end

      it '誤ったパスワードではログインできない' do
        expect(user.valid_password?('wrong_password')).to be false
      end
    end

    context 'パスワードリセット' do
      it 'パスワードリセットトークンを生成できる' do
        expect {
          user.send_reset_password_instructions
        }.to change { user.reload.reset_password_token }.from(nil)
      end
    end
  end

  describe 'アソシエーションのテスト' do
    let(:user) { build(:user) }

    it 'ランキングを持つことができる' do
      expect(User.reflect_on_association(:rankings).macro).to eq :has_many
    end

    it 'ランキングアイテムを持つことができる（ランキングを介して）' do
      expect(User.reflect_on_association(:ranking_items).macro).to eq :has_many
    end

    it '都道府県に属する' do
      expect(user.prefecture).to be_present
    end

    it 'ユーザーが削除された時、関連するランキングも削除される' do
      user = create(:user)
      ranking = create(:ranking, user: user)
      expect { user.destroy }.to change { Ranking.count }.by(-1)
    end
  end
end
