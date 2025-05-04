class UsersController < ApplicationController
  before_action :authenticate_user!, only: [ :show, :edit, :update, :destroy ]
  before_action :set_user, only: [ :show, :edit, :update ]
  before_action :ensure_current_user, only: [ :destroy ]

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

  # 退会機能（ハードデリート）
  def destroy
    # 現在ログインしているユーザーのみ削除可能
    user = current_user

    # トランザクションで囲み、関連データもまとめて削除する
    ActiveRecord::Base.transaction do
      # 実装済みの関連データのみ削除する
      RankingItem.where(ranking_id: user.rankings.pluck(:id)).destroy_all
      user.rankings.destroy_all
      user.avatar.purge if user.avatar.attached?

      # 未実装の関連を使わず直接削除 (コールバックは実行されない)
      User.where(id: user.id).delete_all
    end

    # ログアウト処理と通知メッセージの設定
    sign_out(user)
    redirect_to root_path, notice: "アカウントが完全に削除されました。ご利用ありがとうございました。"
  rescue => e
    Rails.logger.error("アカウント削除エラー: #{e.message}")
    Rails.logger.error(e.backtrace.join("\n"))
    redirect_to edit_user_path(current_user), alert: "アカウントの削除に失敗しました。お手数ですが、再度お試しください。"
  end

  private

  def user_params
    params.require(:user).permit(:nickname, :email, :password, :avatar, :prefecture_id)
  end

  def set_user
    @user = User.find(params[:id])
  end

  # 現在のユーザーが本人であることを確認
  def ensure_current_user
    @user = User.find(params[:id])
    unless @user == current_user
      redirect_to root_path, alert: "他のユーザーのアカウントは削除できません"
    end
  end
end
