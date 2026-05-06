import type { ArtifactId, SigilId } from './etching';
import {
  roomTileHeight,
  roomTileWidth,
  sourceTileSize
} from './gridNavigation';
import type { Direction, ExitId, RoomId, WorldInteractionId } from './gridNavigation';
import type { RoomTheme } from './worldRooms';
import type { BlockerId } from './worldState';

export const tiledMapContract = {
  width: roomTileWidth,
  height: roomTileHeight,
  tileWidth: sourceTileSize,
  tileHeight: sourceTileSize
} as const;

export const tiledLayerNames = {
  ground: 'Ground',
  detail: 'Detail',
  front: 'Front',
  collision: 'Collision',
  spawns: 'Spawns',
  exits: 'Exits',
  worldInteractions: 'WorldInteractions',
  inspectables: 'Inspectables'
} as const;

export const requiredTiledTileLayers = [
  tiledLayerNames.ground,
  tiledLayerNames.collision
] as const;

export const optionalTiledTileLayers = [
  tiledLayerNames.detail,
  tiledLayerNames.front
] as const;

export const requiredTiledObjectLayers = [
  tiledLayerNames.spawns,
  tiledLayerNames.exits,
  tiledLayerNames.worldInteractions,
  tiledLayerNames.inspectables
] as const;

export interface TiledRoomMapProperties {
  roomId: RoomId;
  label: string;
  theme: RoomTheme;
  defaultSpawnId: string;
  musicCue?: string;
  ambientCue?: string;
  notes?: string;
}

export interface TiledVisibilityProperties {
  showIfBlockerCleared?: BlockerId;
  hideIfBlockerCleared?: BlockerId;
  showIfArtifactObtained?: ArtifactId;
  hideIfArtifactObtained?: ArtifactId;
  showIfSigilUnlocked?: SigilId;
  hideIfSigilUnlocked?: SigilId;
}

export interface TiledSpawnProperties {
  id: string;
  facing?: Direction;
}

export interface TiledExitProperties extends TiledVisibilityProperties {
  id: ExitId | string;
  label?: string;
  toRoomId: RoomId;
  spawnId: string;
  facing: Direction;
}

export interface TiledWorldInteractionProperties
  extends TiledVisibilityProperties {
  id: WorldInteractionId;
  label?: string;
  blocksMovement?: boolean;
}

export interface TiledInspectableProperties extends TiledVisibilityProperties {
  id: string;
  label?: string;
  text: string;
  blocksMovement?: boolean;
}

export type TiledAuthoringObjectProperties =
  | TiledSpawnProperties
  | TiledExitProperties
  | TiledWorldInteractionProperties
  | TiledInspectableProperties;
