export type Direction = 'up' | 'down' | 'left' | 'right';

export type InteractableId =
  | 'staff-plinth'
  | 'sealed-way'
  | 'flow-shrine'
  | 'tablet-plinth';

export interface TileCoord {
  x: number;
  y: number;
}

export interface GridInteractable {
  id: InteractableId;
  label: string;
  tile: TileCoord;
  blocksMovement: boolean;
}

export interface GridMap {
  width: number;
  height: number;
  blockedTiles: TileCoord[];
  interactables: GridInteractable[];
}

export const tileSize = 48;

export const placeholderOverworldMap: GridMap = {
  width: 24,
  height: 14,
  blockedTiles: [
    ...range(0, 24).flatMap((x) => [
      { x, y: 0 },
      { x, y: 13 }
    ]),
    ...range(1, 13).flatMap((y) => [
      { x: 0, y },
      { x: 23, y }
    ]),
    ...range(1, 13)
      .filter((y) => y !== 6)
      .map((y) => ({ x: 15, y })),
    { x: 11, y: 4 },
    { x: 12, y: 4 },
    { x: 11, y: 9 },
    { x: 12, y: 9 }
  ],
  interactables: [
    {
      id: 'staff-plinth',
      label: 'Staff Plinth',
      tile: { x: 8, y: 6 },
      blocksMovement: true
    },
    {
      id: 'sealed-way',
      label: 'Sealed Way',
      tile: { x: 15, y: 6 },
      blocksMovement: true
    },
    {
      id: 'flow-shrine',
      label: 'Flow Shrine',
      tile: { x: 19, y: 6 },
      blocksMovement: true
    },
    {
      id: 'tablet-plinth',
      label: 'Tablet Plinth',
      tile: { x: 18, y: 8 },
      blocksMovement: true
    }
  ]
};

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

function range(start: number, end: number): number[] {
  return Array.from({ length: end - start }, (_, index) => start + index);
}
