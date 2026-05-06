import { describe, expect, it } from 'vitest';
import { staffArtifact } from './artifacts';
import { createBlankEtching } from './etching';
import {
  createSaveData,
  loadSaveData,
  parseSaveData,
  saveGameData,
  serializeSaveData,
  type StorageLike
} from './saveData';
import {
  createInitialWorldState,
  obtainArtifact,
  setPlayerLocation
} from './worldState';

class MemoryStorage implements StorageLike {
  private entries = new Map<string, string>();

  getItem(key: string): string | null {
    return this.entries.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.entries.set(key, value);
  }

  removeItem(key: string): void {
    this.entries.delete(key);
  }
}

describe('save data', () => {
  it('round-trips world state and artifact etchings', () => {
    const worldState = setPlayerLocation(
      obtainArtifact(createInitialWorldState(), 'staff'),
      'throne-antechamber',
      { x: 2, y: 6 },
      'right'
    );
    const staff = createBlankEtching(staffArtifact);
    staff.nodes['staff-1'].mp = 2;
    const saveData = createSaveData(worldState, { staff });
    const parsed = parseSaveData(serializeSaveData(saveData));

    expect(parsed?.worldState.equippedArtifact).toBe('staff');
    expect(parsed?.worldState.currentRoomId).toBe('throne-antechamber');
    expect(parsed?.worldState.playerTile).toEqual({ x: 2, y: 6 });
    expect(parsed?.worldState.facing).toBe('right');
    expect(parsed?.artifactEtchings.staff?.nodes['staff-1'].mp).toBe(2);
  });

  it('loads and saves through a storage adapter', () => {
    const storage = new MemoryStorage();
    const saveData = createSaveData(createInitialWorldState(), {});

    saveGameData(storage, saveData);

    expect(loadSaveData(storage)?.version).toBe(2);
  });

  it('rejects malformed save data', () => {
    expect(parseSaveData('{nope')).toBeUndefined();
    expect(parseSaveData(JSON.stringify({ version: 999 }))).toBeUndefined();
  });

  it('drops unknown artifact ids when normalizing', () => {
    const parsed = parseSaveData(
      JSON.stringify({
        version: 2,
        worldState: {
          clearedBlockers: [],
          unlockedSigils: ['life'],
          obtainedArtifacts: ['staff', 'not-real'],
          equippedArtifact: 'not-real'
        },
        artifactEtchings: {}
      })
    );

    expect(parsed?.worldState.obtainedArtifacts).toEqual(['staff']);
    expect(parsed?.worldState.equippedArtifact).toBe('staff');
  });

  it('falls back to the starting location for missing or invalid saved location', () => {
    const parsed = parseSaveData(
      JSON.stringify({
        version: 2,
        worldState: {
          clearedBlockers: [],
          unlockedSigils: ['life'],
          obtainedArtifacts: [],
          currentRoomId: 'not-real',
          playerTile: { x: 999, y: 999 },
          facing: 'sideways'
        },
        artifactEtchings: {}
      })
    );

    expect(parsed?.worldState.currentRoomId).toBe('island');
    expect(parsed?.worldState.playerTile).toEqual({ x: 3, y: 7 });
    expect(parsed?.worldState.facing).toBe('down');
  });
});
