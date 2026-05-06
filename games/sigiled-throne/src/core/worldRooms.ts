import { roomTileHeight, roomTileWidth } from './gridNavigation';
import type {
  Direction,
  GridSpawn,
  GridMap,
  RoomId,
  TileCoord
} from './gridNavigation';

export type RoomTheme = 'island' | 'interior';

export const roomThemeValues = ['island', 'interior'] as const;

export interface RoomDefinition extends GridMap {
  id: RoomId;
  label: string;
  theme: RoomTheme;
  defaultSpawnId: string;
  musicCue?: string;
  ambientCue?: string;
}

export interface WorldLocation {
  roomId: RoomId;
  tile: TileCoord;
  facing: Direction;
}

export const startingLocation: WorldLocation = {
  roomId: 'island',
  tile: { x: 3, y: 7 },
  facing: 'down'
};

export const worldRooms: Record<RoomId, RoomDefinition> = {
  island: {
    id: 'island',
    label: 'Ruined Island',
    theme: 'island',
    defaultSpawnId: 'start',
    width: roomTileWidth,
    height: roomTileHeight,
    blockedTiles: [
      ...range(0, roomTileWidth).flatMap((x) => [
        { x, y: 0 },
        { x, y: roomTileHeight - 1 }
      ]),
      ...range(1, roomTileHeight - 1).flatMap((y) => [
        { x: 0, y },
        { x: roomTileWidth - 1, y }
      ]),
      ...range(1, roomTileHeight - 1)
        .filter((y) => y !== 6)
        .map((y) => ({ x: 9, y })),
      ...range(1, roomTileHeight - 1)
        .filter((y) => y !== 7)
        .map((y) => ({ x: 13, y })),
      { x: 6, y: 3 },
      { x: 6, y: 9 },
      { x: 11, y: 3 },
      { x: 11, y: 9 }
    ],
    spawns: [
      {
        id: 'start',
        tile: { x: 3, y: 7 },
        facing: 'down'
      },
      {
        id: 'entry-from-throne-antechamber',
        tile: { x: 14, y: 7 },
        facing: 'left'
      }
    ],
    interactables: [
      {
        id: 'staff-plinth',
        type: 'world-interaction',
        label: 'Staff Plinth',
        tile: { x: 5, y: 5 },
        blocksMovement: true
      },
      {
        id: 'salt-worn-marker',
        type: 'inspectable',
        label: 'Salt-Worn Marker',
        tile: { x: 3, y: 8 },
        blocksMovement: true,
        text: [
          'The marker is cut with three shallow lines.',
          'Something about the groove pattern suggests a tool that must hold charge at both sides.'
        ]
      },
      {
        id: 'sealed-way',
        type: 'world-interaction',
        label: 'Sealed Way',
        tile: { x: 9, y: 6 },
        blocksMovement: true
      },
      {
        id: 'weave-shrine',
        type: 'world-interaction',
        label: 'Weave Shrine',
        tile: { x: 11, y: 5 },
        blocksMovement: true
      },
      {
        id: 'tablet-plinth',
        type: 'world-interaction',
        label: 'Tablet Plinth',
        tile: { x: 11, y: 8 },
        blocksMovement: true
      },
      {
        id: 'tablet-gate',
        type: 'world-interaction',
        label: 'Tablet Gate',
        tile: { x: 13, y: 7 },
        blocksMovement: true
      }
    ],
    exits: [
      {
        id: 'island-to-throne-antechamber',
        label: 'Throne Door',
        tile: { x: 14, y: 7 },
        toRoomId: 'throne-antechamber',
        spawnId: 'entry-from-island',
        facing: 'right'
      }
    ]
  },
  'throne-antechamber': {
    id: 'throne-antechamber',
    label: 'Throne Antechamber',
    theme: 'interior',
    defaultSpawnId: 'entry-from-island',
    width: roomTileWidth,
    height: roomTileHeight,
    blockedTiles: [
      ...range(0, roomTileWidth).flatMap((x) => [
        { x, y: 0 },
        { x, y: roomTileHeight - 1 }
      ]),
      ...range(1, roomTileHeight - 1).flatMap((y) => [
        { x: 0, y },
        { x: roomTileWidth - 1, y }
      ]),
      { x: 5, y: 4 },
      { x: 10, y: 4 },
      { x: 5, y: 8 },
      { x: 10, y: 8 },
      { x: 7, y: 2 },
      { x: 8, y: 2 },
      { x: 7, y: 3 },
      { x: 8, y: 3 }
    ],
    spawns: [
      {
        id: 'entry-from-island',
        tile: { x: 2, y: 6 },
        facing: 'right'
      }
    ],
    interactables: [
      {
        id: 'throne-inscription',
        type: 'inspectable',
        label: 'Throne Inscription',
        tile: { x: 8, y: 8 },
        blocksMovement: true,
        text: [
          'The inscription names the Throne as an artifact, not a seat.',
          'Its graph is wider than any tool you can carry.'
        ]
      }
    ],
    exits: [
      {
        id: 'throne-antechamber-to-island',
        label: 'Island Door',
        tile: { x: 1, y: 6 },
        toRoomId: 'island',
        spawnId: 'entry-from-throne-antechamber',
        facing: 'left'
      }
    ]
  }
};

export function getWorldRoom(roomId: RoomId): RoomDefinition {
  return worldRooms[roomId];
}

export function getRoomSpawn(
  room: RoomDefinition,
  spawnId = room.defaultSpawnId
): GridSpawn | undefined {
  return room.spawns.find((spawn) => spawn.id === spawnId);
}

function range(start: number, end: number): number[] {
  return Array.from({ length: end - start }, (_, index) => start + index);
}
