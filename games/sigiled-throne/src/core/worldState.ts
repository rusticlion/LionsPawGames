import type { ArtifactId, SigilId } from './etching';

export type BlockerId = 'sealed-way';

export interface WorldState {
  clearedBlockers: BlockerId[];
  unlockedSigils: SigilId[];
  obtainedArtifacts: ArtifactId[];
  equippedArtifact?: ArtifactId;
}

export function createInitialWorldState(): WorldState {
  return {
    clearedBlockers: [],
    unlockedSigils: ['life', 'flame', 'stone'],
    obtainedArtifacts: []
  };
}

export function isBlockerCleared(state: WorldState, blockerId: BlockerId): boolean {
  return state.clearedBlockers.includes(blockerId);
}

export function clearBlocker(state: WorldState, blockerId: BlockerId): WorldState {
  if (isBlockerCleared(state, blockerId)) {
    return state;
  }

  return {
    ...state,
    clearedBlockers: [...state.clearedBlockers, blockerId]
  };
}

export function isSigilUnlocked(state: WorldState, sigilId: SigilId): boolean {
  return state.unlockedSigils.includes(sigilId);
}

export function unlockSigil(state: WorldState, sigilId: SigilId): WorldState {
  if (isSigilUnlocked(state, sigilId)) {
    return state;
  }

  return {
    ...state,
    unlockedSigils: [...state.unlockedSigils, sigilId]
  };
}

export function isArtifactObtained(
  state: WorldState,
  artifactId: ArtifactId
): boolean {
  return state.obtainedArtifacts.includes(artifactId);
}

export function obtainArtifact(
  state: WorldState,
  artifactId: ArtifactId
): WorldState {
  if (isArtifactObtained(state, artifactId)) {
    return {
      ...state,
      equippedArtifact: artifactId
    };
  }

  return {
    ...state,
    obtainedArtifacts: [...state.obtainedArtifacts, artifactId],
    equippedArtifact: artifactId
  };
}

export function cycleEquippedArtifact(state: WorldState): WorldState {
  if (state.obtainedArtifacts.length === 0) {
    return state;
  }

  const currentIndex = state.equippedArtifact
    ? state.obtainedArtifacts.indexOf(state.equippedArtifact)
    : -1;
  const nextIndex = (currentIndex + 1) % state.obtainedArtifacts.length;

  return {
    ...state,
    equippedArtifact: state.obtainedArtifacts[nextIndex]
  };
}
