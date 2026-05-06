import type { ArtifactId, SigilId } from './etching';
import type { WorldInteractionId } from './gridNavigation';
import {
  chargedStaffPredicate,
  describeArtifactPredicate,
  describeUnmetArtifactPredicate,
  evaluateArtifactPredicate,
  tabletTotalManaPredicate,
  type ArtifactEtchings,
  type ArtifactPredicate
} from './requirements';
import {
  clearBlocker,
  isArtifactObtained,
  isBlockerCleared,
  isSigilUnlocked,
  obtainArtifact,
  unlockSigil,
  type BlockerId,
  type WorldState
} from './worldState';

export type WorldRequirement =
  | {
      type: 'artifact-predicate';
      predicate: ArtifactPredicate;
      failureText: string;
    }
  | {
      type: 'blocker-cleared';
      blockerId: BlockerId;
      failureText: string;
    }
  | {
      type: 'sigil-unlocked';
      sigilId: SigilId;
      failureText: string;
    }
  | {
      type: 'artifact-obtained';
      artifactId: ArtifactId;
      failureText: string;
    };

export type WorldReward =
  | {
      type: 'clear-blocker';
      blockerId: BlockerId;
    }
  | {
      type: 'unlock-sigil';
      sigilId: SigilId;
    }
  | {
      type: 'obtain-artifact';
      artifactId: ArtifactId;
    };

export interface WorldInteractionDefinition {
  id: WorldInteractionId;
  requirements: WorldRequirement[];
  rewards: WorldReward[];
  successText: string;
}

export interface WorldInteractionContext {
  worldState: WorldState;
  artifactEtchings: ArtifactEtchings;
}

export type WorldInteractionResult =
  | {
      ok: true;
      worldState: WorldState;
      message: string;
    }
  | {
      ok: false;
      worldState: WorldState;
      message: string;
    };

export const worldInteractions: Record<
  WorldInteractionId,
  WorldInteractionDefinition
> = {
  'staff-plinth': {
    id: 'staff-plinth',
    requirements: [],
    rewards: [{ type: 'obtain-artifact', artifactId: 'staff' }],
    successText: 'Staff obtained. Press X to etch anywhere.'
  },
  'sealed-way': {
    id: 'sealed-way',
    requirements: [
      {
        type: 'artifact-obtained',
        artifactId: 'staff',
        failureText: 'The Sealed Way needs the Staff.'
      },
      {
        type: 'artifact-predicate',
        predicate: chargedStaffPredicate,
        failureText: 'The Staff has not found the right charge yet.'
      }
    ],
    rewards: [{ type: 'clear-blocker', blockerId: 'sealed-way' }],
    successText: 'The charged Staff opens the Sealed Way.'
  },
  'weave-shrine': {
    id: 'weave-shrine',
    requirements: [],
    rewards: [
      { type: 'unlock-sigil', sigilId: 'thread' },
      { type: 'unlock-sigil', sigilId: 'diffuse' },
      { type: 'unlock-sigil', sigilId: 'well' }
    ],
    successText: 'Thread, Diffuse, and Well awakened. The sigils join your palette.'
  },
  'tablet-plinth': {
    id: 'tablet-plinth',
    requirements: [],
    rewards: [{ type: 'obtain-artifact', artifactId: 'tablet' }],
    successText: 'Tablet obtained. Press Tab to switch artifacts.'
  },
  'tablet-gate': {
    id: 'tablet-gate',
    requirements: [
      {
        type: 'artifact-obtained',
        artifactId: 'tablet',
        failureText: 'Tablet Gate: the Tablet is still missing.'
      },
      {
        type: 'artifact-predicate',
        predicate: tabletTotalManaPredicate,
        failureText: 'Tablet Gate: the Tablet needs at least 4 total MP.'
      }
    ],
    rewards: [{ type: 'clear-blocker', blockerId: 'tablet-gate' }],
    successText: 'The Tablet answers. The second gate opens.'
  }
};

export function evaluateWorldRequirement(
  requirement: WorldRequirement,
  context: WorldInteractionContext
): boolean {
  switch (requirement.type) {
    case 'artifact-predicate':
      return evaluateArtifactPredicate(
        requirement.predicate,
        context.artifactEtchings
      );
    case 'blocker-cleared':
      return isBlockerCleared(context.worldState, requirement.blockerId);
    case 'sigil-unlocked':
      return isSigilUnlocked(context.worldState, requirement.sigilId);
    case 'artifact-obtained':
      return isArtifactObtained(context.worldState, requirement.artifactId);
  }
}

export function getUnmetWorldRequirements(
  interaction: WorldInteractionDefinition,
  context: WorldInteractionContext
): WorldRequirement[] {
  return interaction.requirements.filter(
    (requirement) => !evaluateWorldRequirement(requirement, context)
  );
}

export function describeWorldRequirement(
  requirement: WorldRequirement
): string[] {
  switch (requirement.type) {
    case 'artifact-predicate':
      return describeArtifactPredicate(requirement.predicate);
    case 'blocker-cleared':
      return [`${blockerName(requirement.blockerId)} is open.`];
    case 'sigil-unlocked':
      return [`${sigilName(requirement.sigilId)} sigil is unlocked.`];
    case 'artifact-obtained':
      return [`${artifactName(requirement.artifactId)} is obtained.`];
  }
}

export function describeUnmetWorldRequirements(
  interaction: WorldInteractionDefinition,
  context: WorldInteractionContext
): string[] {
  return getUnmetWorldRequirements(interaction, context).flatMap((requirement) =>
    describeUnmetWorldRequirement(requirement, context)
  );
}

function describeUnmetWorldRequirement(
  requirement: WorldRequirement,
  context: WorldInteractionContext
): string[] {
  if (requirement.type === 'artifact-predicate') {
    return describeUnmetArtifactPredicate(
      requirement.predicate,
      context.artifactEtchings
    );
  }

  return describeWorldRequirement(requirement);
}

export function resolveWorldInteraction(
  interaction: WorldInteractionDefinition,
  context: WorldInteractionContext
): WorldInteractionResult {
  const unmetRequirement = getUnmetWorldRequirements(interaction, context)[0];

  if (unmetRequirement) {
    return {
      ok: false,
      worldState: context.worldState,
      message: unmetRequirement.failureText
    };
  }

  return {
    ok: true,
    worldState: interaction.rewards.reduce(
      (state, reward) => applyWorldReward(state, reward),
      context.worldState
    ),
    message: interaction.successText
  };
}

export function applyWorldReward(
  worldState: WorldState,
  reward: WorldReward
): WorldState {
  switch (reward.type) {
    case 'clear-blocker':
      return clearBlocker(worldState, reward.blockerId);
    case 'unlock-sigil':
      return unlockSigil(worldState, reward.sigilId);
    case 'obtain-artifact':
      return obtainArtifact(worldState, reward.artifactId);
  }
}

function artifactName(artifactId: ArtifactId): string {
  const names: Record<ArtifactId, string> = {
    staff: 'Staff',
    tablet: 'Tablet'
  };

  return names[artifactId];
}

function blockerName(blockerId: BlockerId): string {
  const names: Record<BlockerId, string> = {
    'sealed-way': 'Sealed Way',
    'tablet-gate': 'Tablet Gate'
  };

  return names[blockerId];
}

function sigilName(sigilId: SigilId): string {
  const names: Record<SigilId, string> = {
    life: 'Life',
    flame: 'Flame',
    stone: 'Stone',
    thread: 'Thread',
    diffuse: 'Diffuse',
    well: 'Well'
  };

  return names[sigilId];
}
