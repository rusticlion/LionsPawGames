import { describe, expect, it } from 'vitest';
import {
  canEnterTile,
  getExitAt,
  getInteractableAt,
  getSpawnById,
  tileInDirection,
  tileToPixel
} from './gridNavigation';
import { worldRooms } from './worldRooms';

const island = worldRooms.island;

describe('grid navigation', () => {
  it('moves one tile in cardinal directions', () => {
    const tile = { x: 4, y: 7 };

    expect(tileInDirection(tile, 'up')).toEqual({ x: 4, y: 6 });
    expect(tileInDirection(tile, 'down')).toEqual({ x: 4, y: 8 });
    expect(tileInDirection(tile, 'left')).toEqual({ x: 3, y: 7 });
    expect(tileInDirection(tile, 'right')).toEqual({ x: 5, y: 7 });
  });

  it('converts tile coordinates to tile center pixels', () => {
    expect(tileToPixel({ x: 2, y: 3 })).toEqual({ x: 120, y: 168 });
  });

  it('blocks static collision tiles', () => {
    expect(
      canEnterTile(island, { x: 0, y: 6 }, [])
    ).toBe(false);
  });

  it('makes the sealed way the only passage through the placeholder wall', () => {
    expect(
      canEnterTile(island, { x: 9, y: 5 }, [])
    ).toBe(false);
    expect(
      canEnterTile(island, { x: 9, y: 6 }, [])
    ).toBe(true);
  });

  it('makes the tablet gate the only passage through the second wall', () => {
    expect(
      canEnterTile(island, { x: 13, y: 6 }, [])
    ).toBe(false);
    expect(
      canEnterTile(island, { x: 13, y: 7 }, [])
    ).toBe(true);
  });

  it('finds room exits on their trigger tiles', () => {
    expect(getExitAt(island.exits, { x: 14, y: 7 })).toMatchObject({
      toRoomId: 'throne-antechamber',
      spawnId: 'entry-from-island'
    });
  });

  it('finds room spawns by id', () => {
    expect(getSpawnById(island.spawns, 'start')).toEqual({
      id: 'start',
      tile: { x: 3, y: 7 },
      facing: 'down'
    });
  });

  it('blocks active interactable tiles', () => {
    const sealedWay = getInteractableAt(
      island.interactables,
      { x: 9, y: 6 }
    );

    expect(sealedWay?.id).toBe('sealed-way');
    expect(
      canEnterTile(
        island,
        { x: 9, y: 6 },
        sealedWay ? [sealedWay] : []
      )
    ).toBe(false);
  });

  it('allows movement through inactive interactable tiles', () => {
    expect(
      canEnterTile(island, { x: 9, y: 6 }, [])
    ).toBe(true);
  });

  it('supports inspectable objects with authored text', () => {
    const marker = getInteractableAt(
      island.interactables,
      { x: 3, y: 8 }
    );

    expect(marker?.type).toBe('inspectable');

    if (marker?.type !== 'inspectable') {
      throw new Error('Expected inspectable marker');
    }

    expect(marker.text).toContain('The marker is cut with three shallow lines.');
    expect(canEnterTile(island, marker.tile, [marker])).toBe(false);
  });
});
