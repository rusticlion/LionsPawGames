import { describe, expect, it } from 'vitest';
import {
  loadTiledRoom,
  TiledRoomValidationError,
  type TiledMapExport
} from './tiledRoomLoader';

const baseMap = (): TiledMapExport => ({
  width: 16,
  height: 12,
  tilewidth: 16,
  tileheight: 16,
  orientation: 'orthogonal',
  infinite: false,
  properties: [
    { name: 'roomId', value: 'island' },
    { name: 'label', value: 'Ruined Island' },
    { name: 'theme', value: 'island' },
    { name: 'defaultSpawnId', value: 'start' }
  ],
  layers: [
    {
      id: 1,
      name: 'Ground',
      type: 'tilelayer',
      width: 16,
      height: 12,
      data: Array.from({ length: 16 * 12 }, () => 1)
    },
    {
      id: 2,
      name: 'Collision',
      type: 'tilelayer',
      width: 16,
      height: 12,
      data: Array.from({ length: 16 * 12 }, (_, index) =>
        index === 6 * 16 + 9 ? 0x80000001 : 0
      )
    },
    {
      id: 3,
      name: 'Spawns',
      type: 'objectgroup',
      objects: [
        {
          id: 1,
          name: 'start',
          x: 48,
          y: 112,
          width: 16,
          height: 16,
          properties: [{ name: 'facing', value: 'down' }]
        },
        {
          id: 2,
          name: 'entry-from-throne-antechamber',
          x: 224,
          y: 112,
          width: 16,
          height: 16,
          properties: [{ name: 'facing', value: 'left' }]
        }
      ]
    },
    {
      id: 4,
      name: 'Exits',
      type: 'objectgroup',
      objects: [
        {
          id: 3,
          name: 'Throne Door',
          x: 224,
          y: 112,
          width: 16,
          height: 16,
          properties: [
            { name: 'id', value: 'island-to-throne-antechamber' },
            { name: 'toRoomId', value: 'throne-antechamber' },
            { name: 'spawnId', value: 'entry-from-island' },
            { name: 'facing', value: 'right' }
          ]
        }
      ]
    },
    {
      id: 5,
      name: 'WorldInteractions',
      type: 'objectgroup',
      objects: [
        {
          id: 4,
          name: 'Staff Plinth',
          x: 80,
          y: 80,
          width: 16,
          height: 16,
          properties: [{ name: 'id', value: 'staff-plinth' }]
        },
        {
          id: 5,
          name: 'Weave Shrine',
          x: 176,
          y: 80,
          width: 16,
          height: 16,
          properties: [
            { name: 'id', value: 'weave-shrine' },
            { name: 'showIfBlockerCleared', value: 'sealed-way' }
          ]
        }
      ]
    },
    {
      id: 6,
      name: 'Inspectables',
      type: 'objectgroup',
      objects: [
        {
          id: 6,
          name: 'Salt-Worn Marker',
          x: 48,
          y: 128,
          width: 16,
          height: 16,
          properties: [
            { name: 'id', value: 'salt-worn-marker' },
            {
              name: 'text',
              value:
                'The marker is cut with three shallow lines.\n\nSomething about the groove pattern suggests a tool that must hold charge at both sides.'
            }
          ]
        }
      ]
    }
  ],
  tilesets: [
    {
      firstgid: 1,
      source: 'tilesets/island.tsx'
    }
  ]
});

describe('tiled room loader', () => {
  it('parses a valid Tiled room export into runtime room data', () => {
    const room = loadTiledRoom(baseMap());

    expect(room.id).toBe('island');
    expect(room.label).toBe('Ruined Island');
    expect(room.theme).toBe('island');
    expect(room.defaultSpawnId).toBe('start');
    expect(room.source).toBe('tiled');
    expect(room.tileLayers.ground.data).toHaveLength(16 * 12);
    expect(room.blockedTiles).toContainEqual({ x: 9, y: 6 });
    expect(room.spawns).toEqual([
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
    ]);
    expect(room.exits[0]).toMatchObject({
      id: 'island-to-throne-antechamber',
      tile: { x: 14, y: 7 },
      toRoomId: 'throne-antechamber',
      spawnId: 'entry-from-island',
      facing: 'right'
    });
    expect(room.interactables[0]).toMatchObject({
      id: 'staff-plinth',
      type: 'world-interaction',
      tile: { x: 5, y: 5 },
      blocksMovement: true
    });
    expect(room.interactables[1]).toMatchObject({
      id: 'weave-shrine',
      type: 'world-interaction',
      visibility: {
        showIfBlockerCleared: 'sealed-way'
      }
    });
    expect(room.interactables[2]).toMatchObject({
      id: 'salt-worn-marker',
      type: 'inspectable',
      text: [
        'The marker is cut with three shallow lines.',
        'Something about the groove pattern suggests a tool that must hold charge at both sides.'
      ]
    });
  });

  it('rejects maps with missing required layers', () => {
    const invalidMap = baseMap();
    invalidMap.layers = invalidMap.layers.filter(
      (layer) => layer.name !== 'WorldInteractions'
    );

    expect(() => loadTiledRoom(invalidMap)).toThrow(TiledRoomValidationError);
    expect(() => loadTiledRoom(invalidMap)).toThrow(
      'Missing required Tiled layer "WorldInteractions".'
    );
  });

  it('rejects maps whose default spawn is missing', () => {
    const invalidMap = baseMap();
    invalidMap.properties = [
      ...(invalidMap.properties ?? []).filter(
        (property) => property.name !== 'defaultSpawnId'
      ),
      { name: 'defaultSpawnId', value: 'not-real' }
    ];

    expect(() => loadTiledRoom(invalidMap)).toThrow(TiledRoomValidationError);
    expect(() => loadTiledRoom(invalidMap)).toThrow(
      'Map default spawn "not-real" does not exist in Spawns.'
    );
  });
});
