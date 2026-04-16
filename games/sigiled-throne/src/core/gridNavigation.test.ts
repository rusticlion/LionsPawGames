import { describe, expect, it } from 'vitest';
import {
  canEnterTile,
  getInteractableAt,
  placeholderOverworldMap,
  tileInDirection,
  tileToPixel
} from './gridNavigation';

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
      canEnterTile(placeholderOverworldMap, { x: 0, y: 6 }, [])
    ).toBe(false);
  });

  it('makes the sealed way the only passage through the placeholder wall', () => {
    expect(
      canEnterTile(placeholderOverworldMap, { x: 15, y: 5 }, [])
    ).toBe(false);
    expect(
      canEnterTile(placeholderOverworldMap, { x: 15, y: 6 }, [])
    ).toBe(true);
  });

  it('blocks active interactable tiles', () => {
    const sealedWay = getInteractableAt(
      placeholderOverworldMap.interactables,
      { x: 15, y: 6 }
    );

    expect(sealedWay?.id).toBe('sealed-way');
    expect(
      canEnterTile(
        placeholderOverworldMap,
        { x: 15, y: 6 },
        sealedWay ? [sealedWay] : []
      )
    ).toBe(false);
  });

  it('allows movement through inactive interactable tiles', () => {
    expect(
      canEnterTile(placeholderOverworldMap, { x: 15, y: 6 }, [])
    ).toBe(true);
  });
});
