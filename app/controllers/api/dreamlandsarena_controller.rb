class Api::DreamlandsarenaController < ApplicationController
  before_action :authenticate_user!

  def has_arena_player
    user = current_user
    arena_player = ArenaPlayer.find_by(user_id: user.id)

    render json: { hasArenaPlayer: arena_player.present? }
  end

  def current_arena_player
    user = current_user
    arena_player = ArenaPlayer.find_by(user_id: user&.id)
    if arena_player.nil?
      render json: { currentArenaPlayer: nil }
      return
    end
    render json: { currentArenaPlayer: arena_player.to_gameplay_info }
  end

  def create_arena_player
    user = current_user
    new_player = ArenaPlayer.create!(user_id: user.id)
    render json: { currentArenaPlayer: new_player.to_gameplay_info }
  end

  def equip_body_part
    body_part_to_equip = ArenaPlayerBodyPart.find(params[:id])
    current_player.equip_body_part(body_part_to_equip)
  end

  private

  def current_player
    ArenaPlayer.find_by(user_id: current_user&.id)
  end
end