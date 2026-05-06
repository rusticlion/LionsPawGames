export type Direction = 'up' | 'down' | 'left' | 'right';
export type RoomId = 'island' | 'throne-antechamber';
export type ExitId = 'island-to-throne-antechamber' | 'throne-antechamber-to-island';

export type WorldInteractionId =
  | 'staff-plinth'
  | 'sealed-way'
  | 'weave-shrine'
  | 'tablet-plinth'
  | 'tablet-gate';

export type InspectableId = string;
export type InteractableId = string;

export const directionValues = ['up', 'down', 'left', 'right'] as const;
export const roomIdValues = ['island', 'throne-antechamber'] as const;
export const exitIdValues = [
  'island-to-throne-antechamber',
  'throne-antechamber-to-island'
] as const;
export const worldInteractionIdValues = [
  'staff-plinth',
  'sealed-way',
  'weave-shrine',
  'tablet-plinth',
  'tablet-gate'
] as const;
export const builtInInspectableIdValues = [
  'salt-worn-marker',
  'throne-inscription'
] as const;

export interface TileCoord {
  x: number;
  y: number;
}

interface BaseGridInteractable {
  id: InteractableId;
  label: string;
  tile: TileCoord;
  blocksMovement: boolean;
}

export interface WorldInteractionInteractable extends BaseGridInteractable {
  id: WorldInteractionId;
  type: 'world-interaction';
}

export interface InspectableInteractable extends BaseGridInteractable {
  id: InspectableId;
  type: 'inspectable';
  text: string[];
}

export type GridInteractable =
  | WorldInteractionInteractable
  | InspectableInteractable;

export interface GridSpawn {
  id: string;
  tile: TileCoord;
  facing: Direction;
}

export interface GridExit {
  id: ExitId | string;
  label: string;
  tile: TileCoord;
  toRoomId: RoomId;
  spawnId: string;
  facing: Direction;
}

export interface GridMap {
  width: number;
  height: number;
  blockedTiles: TileCoord[];
  spawns: GridSpawn[];
  interactables: GridInteractable[];
  exits: GridExit[];
}

export const sourceTileSize = 16;
export const tileRenderScale = 3;
export const tileSize = sourceTileSize * tileRenderScale;
export const roomTileWidth = 16;
export const roomTileHeight = 12;
export const gameViewportWidth = roomTileWidth * tileSize;
export const gameViewportHeight = roomTileHeight * tileSize;

export function tileInDirection(tile: TileCoord, direction: Direction): TileCoord {
  switch (direction) {
    case 'up':
      return { x: tile.x, y: tile.y - 1 };
    case 'down':
      return { x: tile.x, y: tile.y + 1 };
    case 'left':
      return { x: tile.x - 1, y: tile.y };
    case 'right':
      return { x: tile.x + 1, y: tile.y };
  }
}

export function tileEquals(a: TileCoord, b: TileCoord): boolean {
  return a.x === b.x && a.y === b.y;
}

export function tileToPixel(tile: TileCoord): { x: number; y: number } {
  return {
    x: tile.x * tileSize + tileSize / 2,
    y: tile.y * tileSize + tileSize / 2
  };
}

export function isWithinBounds(map: GridMap, tile: TileCoord): boolean {
  return tile.x >= 0 && tile.y >= 0 && tile.x < map.width && tile.y < map.height;
}

export function isStaticBlocked(map: GridMap, tile: TileCoord): boolean {
  return map.blockedTiles.some((blockedTile) => tileEquals(blockedTile, tile));
}

export function getInteractableAt(
  interactables: GridInteractable[],
  tile: TileCoord
): GridInteractable | undefined {
  return interactables.find((interactable) => tileEquals(interactable.tile, tile));
}

export function getExitAt(
  exits: GridExit[],
  tile: TileCoord
): GridExit | undefined {
  return exits.find((exit) => tileEquals(exit.tile, tile));
}

export function getSpawnById(
  spawns: GridSpawn[],
  spawnId: string
): GridSpawn | undefined {
  return spawns.find((spawn) => spawn.id === spawnId);
}

export function canEnterTile(
  map: GridMap,
  tile: TileCoord,
  activeInteractables: GridInteractable[]
): boolean {
  if (!isWithinBounds(map, tile) || isStaticBlocked(map, tile)) {
    return false;
  }

  const interactable = getInteractableAt(activeInteractables, tile);

  return !interactable?.blocksMovement;
}
