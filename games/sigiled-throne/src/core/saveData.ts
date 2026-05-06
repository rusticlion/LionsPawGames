import {
  artifactIdValues,
  sigilIdValues,
  type ArtifactId,
  type SigilId
} from './etching';
import {
  directionValues,
  isStaticBlocked,
  isWithinBounds,
  roomIdValues,
  type Direction,
  type RoomId,
  type TileCoord
} from './gridNavigation';
import type { ArtifactEtchings } from './requirements';
import {
  blockerIdValues,
  createInitialWorldState,
  type BlockerId,
  type WorldState
} from './worldState';
import { getWorldRoom, startingLocation } from './worldRooms';

export const saveDataVersion = 2;
export const saveStorageKey = 'sigiled-throne-save-v1';

export interface SaveData {
  version: typeof saveDataVersion;
  worldState: WorldState;
  artifactEtchings: ArtifactEtchings;
}

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

const artifactIds: ArtifactId[] = [...artifactIdValues];
const blockerIds: BlockerId[] = [...blockerIdValues];
const sigilIds: SigilId[] = [...sigilIdValues];
const directions: Direction[] = [...directionValues];

export function createSaveData(
  worldState: WorldState,
  artifactEtchings: ArtifactEtchings
): SaveData {
  return {
    version: saveDataVersion,
    worldState: normalizeWorldState(worldState),
    artifactEtchings: normalizeArtifactEtchings(artifactEtchings)
  };
}

export function serializeSaveData(saveData: SaveData): string {
  return JSON.stringify(saveData);
}

export function parseSaveData(rawSaveData: string | null): SaveData | undefined {
  if (!rawSaveData) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(rawSaveData) as Partial<SaveData>;

    if (parsed.version !== saveDataVersion || !parsed.worldState) {
      return undefined;
    }

    return {
      version: saveDataVersion,
      worldState: normalizeWorldState(parsed.worldState),
      artifactEtchings: normalizeArtifactEtchings(
        isRecord(parsed.artifactEtchings) ? parsed.artifactEtchings : {}
      )
    };
  } catch {
    return undefined;
  }
}

export function loadSaveData(storage: StorageLike): SaveData | undefined {
  return parseSaveData(storage.getItem(saveStorageKey));
}

export function saveGameData(storage: StorageLike, saveData: SaveData): void {
  storage.setItem(saveStorageKey, serializeSaveData(saveData));
}

export function clearSaveData(storage: StorageLike): void {
  storage.removeItem(saveStorageKey);
}

function normalizeWorldState(worldState: Partial<WorldState>): WorldState {
  const initialState = createInitialWorldState();
  const obtainedArtifacts = uniqueValidEntries(
    toArray(worldState.obtainedArtifacts),
    artifactIds
  );
  const equippedArtifact = obtainedArtifacts.includes(
    worldState.equippedArtifact as ArtifactId
  )
    ? worldState.equippedArtifact
    : obtainedArtifacts[0];
  const currentRoomId = normalizeRoomId(worldState.currentRoomId);

  return {
    clearedBlockers: uniqueEntries(
      uniqueValidEntries(
        toArray(worldState.clearedBlockers ?? initialState.clearedBlockers),
        blockerIds
      )
    ),
    unlockedSigils: uniqueEntries(
      uniqueValidEntries(
        toArray(worldState.unlockedSigils ?? initialState.unlockedSigils),
        sigilIds
      )
    ),
    obtainedArtifacts,
    equippedArtifact,
    currentRoomId,
    playerTile: normalizeTile(worldState.playerTile, currentRoomId),
    facing: normalizeDirection(worldState.facing)
  };
}

function normalizeArtifactEtchings(
  artifactEtchings: ArtifactEtchings
): ArtifactEtchings {
  const normalized: ArtifactEtchings = {};

  for (const artifactId of artifactIds) {
    if (artifactEtchings[artifactId]) {
      normalized[artifactId] = artifactEtchings[artifactId];
    }
  }

  return normalized;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function toArray<T>(entries: T[] | undefined): T[] {
  return Array.isArray(entries) ? entries : [];
}

function uniqueEntries<T>(entries: T[]): T[] {
  return Array.from(new Set(entries));
}

function uniqueValidEntries<T>(entries: T[], validEntries: T[]): T[] {
  return uniqueEntries(entries).filter((entry) => validEntries.includes(entry));
}

function normalizeRoomId(roomId: unknown): RoomId {
  return roomIdValues.includes(roomId as RoomId)
    ? (roomId as RoomId)
    : startingLocation.roomId;
}

function normalizeDirection(facing: unknown): Direction {
  return directions.includes(facing as Direction)
    ? (facing as Direction)
    : startingLocation.facing;
}

function normalizeTile(tile: unknown, roomId: RoomId): TileCoord {
  if (!isRecord(tile)) {
    return { ...startingLocation.tile };
  }

  const candidate = {
    x: Number(tile.x),
    y: Number(tile.y)
  };
  const room = getWorldRoom(roomId);

  if (
    Number.isInteger(candidate.x) &&
    Number.isInteger(candidate.y) &&
    isWithinBounds(room, candidate) &&
    !isStaticBlocked(room, candidate)
  ) {
    return candidate;
  }

  return { ...startingLocation.tile };
}
