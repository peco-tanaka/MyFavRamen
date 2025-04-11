class UsersController < ApplicationController
  !before_action :authenticate_user!, only: [:show, :edit, :update]
  before_action :set_user, only: [:show, :edit, :update]

  def show
    set_user
  end

  def edit
    set_user
  end

  def update

  end

  private

  def set_user
    @user = User.find(params[:id])
  end

end
