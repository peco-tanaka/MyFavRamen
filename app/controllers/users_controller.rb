class UsersController < ApplicationController
  before_action :authenticate_user!, only: [ :show, :edit, :update ]
  before_action :set_user, only: [ :show, :edit, :update ]

  def show
  end

  def edit
    # ユーザーのランキングの公開状態を取得
    @all_rankings_public = @user.rankings.all?(&:is_public)
  end

  def update
    # デフォルト画像を使用する場合の処理
    if params[:user][:use_default] == "true"
      # 画像を削除
      @user.avatar.purge if @user.avatar.attached?

      # 画像関連パラメータを削除（新しい画像が設定されないようにする）
      params[:user].delete(:avatar)

      # 更新処理
      if @user.update(user_params)
        redirect_to @user, notice: "デフォルト画像が設定されました"
      else
        render :edit
      end
    return
    end

    # ランキングの公開設定を一括更新
    # check_box_tag を使うと params[:all_rankings_public] は "true" or "0" (デフォルト) になる
    if params.key?(:all_rankings_public)
      is_public = params[:all_rankings_public] == "true" # "true" の場合のみ true になる
      @user.rankings.update_all(is_public: is_public)
    end

    # 画像選択する場合の更新処理
    if @user.update(user_params)
      redirect_to @user, notice: "プロフィール情報が更新されました"
    else
      # 編集画面で必要な変数を再設定
      @all_rankings_public = @user.rankings.all?(&:is_public)
      render :edit
    end
  end

  private

  def user_params
    params.require(:user).permit(:nickname, :email, :password, :avatar, :prefecture_id)
  end

  def set_user
    @user = User.find(params[:id])
  end
end
