require 'rails_helper'

RSpec.describe User, type: :model do
  describe 'バリデーションのテスト' do
    let(:user) { build(:user) }

    context '有効なユーザー' do
      it 'すべての属性が有効である場合、ユーザーは有効である' do
        expect(user).to be_valid
      end
    end

    context '無効なユーザー' do
      it 'メールアドレスが空の場合、無効である' do
        user.email = nil
        user.valid?
        expect(user.errors.full_messages).to include("Eメールを入力してください")
      end

      it 'メールアドレスが一意でない場合、無効である' do
        create(:user, email: user.email)
        user.valid?
        expect(user.errors.full_messages).to include("Eメールはすでに存在します")
      end

      it 'パスワードが空の場合、無効である' do
        user.password = nil
        user.valid?
        expect(user.errors.full_messages).to include("パスワードを入力してください")
      end

      it 'ニックネームが空の場合、無効である' do
        user.nickname = nil
        user.valid?
        expect(user.errors.full_messages).to include("Nicknameを入力してください")
      end
      
      it 'パスワードが6文字未満の場合、無効である' do
        user.password = 'short'
        user.password_confirmation = 'short'
        user.valid?
        expect(user.errors.full_messages).to include("パスワードは6文字以上で入力してください")
      end

      it 'パスワード確認が一致しない場合、無効である' do
        user.password_confirmation = 'different_password'
        user.valid?
        expect(user.errors.full_messages).to include("パスワード（確認用）とパスワードの入力が一致しません")
      end
    end
  end

  describe '認証関連のテスト' do
    let!(:user) { create(:user, password: 'password123') }

    context 'パスワード検証' do
      it '正しいパスワードで認証できる' do
        expect(user.valid_password?('password123')).to be true
      end

      it '誤ったパスワードでは認証できない' do
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
end
