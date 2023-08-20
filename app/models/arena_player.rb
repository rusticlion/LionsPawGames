# == Schema Information
#
# Table name: arena_players
#
#  id         :bigint           not null, primary key
#  affinity   :string
#  created_at :datetime         not null
#  updated_at :datetime         not null
#  user_id    :bigint           not null
#
# Indexes
#
#  index_arena_players_on_user_id  (user_id)
#
# Foreign Keys
#
#  fk_rails_...  (user_id => users.id)
#
class ArenaPlayer < ApplicationRecord
  belongs_to :user
  has_many :arena_player_body_parts

  has_one :equipped_head, -> { where(equipped: true, slot: 'head') }, class_name: 'ArenaPlayerBodyPart'
  has_one :equipped_body, -> { where(equipped: true, slot: 'body') }, class_name: 'ArenaPlayerBodyPart'
  has_many :equipped_limbs, -> { where(equipped: true, slot: 'limb') }, class_name: 'ArenaPlayerBodyPart'

  AFFINITIES = %w[SKY EARTH MOUNTAIN MARSH FIRE WATER WIND THUNDER].freeze

  after_create :assign_affinity_and_body_parts

  def to_gameplay_info
    body_parts_names = arena_player_body_parts.map { |part| part.body_part.name }
    
    {
      id: id,
      affinity: affinity,
      body_parts: body_parts_names
    }
  end

  def equip_body_part(body_part)
    # Find the existing relationship for the slot
    existing_equipped_part = send("equipped_#{body_part.slot}")

    # Unequip the existing part in the slot
    existing_equipped_part.update!(equipped: false) if existing_equipped_part

    # Equip the new part
    arena_player_body_part = ArenaPlayerBodyPart.find_by(arena_player: self, body_part: body_part, equipped: false)
    arena_player_body_part.update!(equipped: true)
  end

  private

  def assign_affinity_and_body_parts
    self.affinity = AFFINITIES.sample
    save!

    body_parts_for_affinity = {
      'SKY' => [['HeronHead', 'head'], ['AngelicRobes', 'body'], ['GlassWing', 'limb'], ['GlassWing', 'limb'], ['Tentacle', 'limb'], ['Tentacle', 'limb']],
      'EARTH' => [['HornedSkull', 'head'], ['StoneTrunk', 'body'], ['BeastClaw', 'limb'], ['BeastClaw', 'limb'], ['BeastClaw', 'limb'], ['BeastClaw', 'limb']],
      'MOUNTAIN' => [['IronVisage', 'head'], ['ArmorPlate', 'body'], ['SwordArm', 'limb'], ['ShieldArm', 'limb'], ['GoatLeg', 'limb'], ['GoatLeg', 'limb']],
      'MARSH' => [['MosquitoHead', 'head'], ['RottingRibcage', 'body'], ['MantisArm', 'limb'], ['MantisArm', 'limb'], ['Tentacle', 'limb'], ['Tentacle', 'limb']],
      'FIRE' => [['SalamanderHead', 'head'], ['ScalyTorso', 'body'], ['LeatheryWing', 'limb'], ['LeatheryWing', 'limb'], ['GoatLeg', 'limb'], ['GoatLeg', 'limb']],
      'WATER' => [['EnormousEye', 'head'], ['ScalyTorso', 'body'], ['Tentacle', 'limb'], ['Tentacle', 'limb'], ['Tentacle', 'limb'], ['Tentacle', 'limb']],
      'WIND' => [['HornedSkull', 'head'], ['RottingRibcage', 'body'], ['LeatheryWing', 'limb'], ['LeatheryWing', 'limb'], ['FierceTalon', 'limb'], ['FierceTalon', 'limb']],
      'THUNDER' => [['HeronHead', 'head'], ['SerpentCoils', 'body'], ['FeatheryWing', 'limb'], ['FeatheryWing', 'limb'], ['SparkClaw', 'limb'], ['SparkClaw', 'limb']]
    }
  
    body_parts_for_affinity[self.affinity].each do |part_name, slot|
      puts part_name
      body_part = BodyPart.find_or_create_by!(name: part_name, slot: slot)
      ArenaPlayerBodyPart.create!(arena_player: self, body_part_id: body_part.id, equipped: true)
    end
  end
end
