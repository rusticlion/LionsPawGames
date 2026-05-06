import { describe, expect, it } from 'vitest';
import { tabletArtifact } from './artifacts';
import { createBlankEtching } from './etching';
import {
  describeUnmetWorldRequirements,
  evaluateWorldRequirement,
  resolveWorldInteraction,
  worldInteractions
} from './worldInteractions';
import {
  createInitialWorldState,
  isBlockerCleared,
  isSigilUnlocked,
  obtainArtifact
} from './worldState';

describe('world interactions', () => {
  it('blocks a gate when its artifact predicate is unmet', () => {
    const result = resolveWorldInteraction(worldInteractions['tablet-gate'], {
      worldState: obtainArtifact(createInitialWorldState(), 'tablet'),
      artifactEtchings: {
        tablet: createBlankEtching(tabletArtifact)
      }
    });

    expect(result.ok).toBe(false);
    expect(result.message).toContain('at least 4 total MP');
  });

  it('describes unmet requirements for interaction prompts', () => {
    const missingStaff = describeUnmetWorldRequirements(
      worldInteractions['sealed-way'],
      {
        worldState: createInitialWorldState(),
        artifactEtchings: {}
      }
    );

    expect(missingStaff).toEqual([
      'Staff is obtained.',
      'Staff: Inner L has at least 1 MP.',
      'Staff: Inner R has at least 1 MP.'
    ]);

    const tablet = createBlankEtching(tabletArtifact);

    expect(
      describeUnmetWorldRequirements(worldInteractions['tablet-gate'], {
        worldState: obtainArtifact(createInitialWorldState(), 'tablet'),
        artifactEtchings: {
          tablet
        }
      })
    ).toEqual(['Tablet: holds at least 4 total MP.']);
  });

  it('clears a gate when its artifact predicate is met', () => {
    const tablet = createBlankEtching(tabletArtifact);
    tablet.nodes['tablet-0'].mp = 2;
    tablet.nodes['tablet-8'].mp = 2;

    const result = resolveWorldInteraction(worldInteractions['tablet-gate'], {
      worldState: obtainArtifact(createInitialWorldState(), 'tablet'),
      artifactEtchings: {
        tablet
      }
    });

    expect(result.ok).toBe(true);
    expect(isBlockerCleared(result.worldState, 'tablet-gate')).toBe(true);
  });

  it('awakens the advanced demo sigils at the shrine', () => {
    const result = resolveWorldInteraction(worldInteractions['weave-shrine'], {
      worldState: createInitialWorldState(),
      artifactEtchings: {}
    });

    expect(result.ok).toBe(true);
    expect(isSigilUnlocked(result.worldState, 'thread')).toBe(true);
    expect(isSigilUnlocked(result.worldState, 'diffuse')).toBe(true);
    expect(isSigilUnlocked(result.worldState, 'well')).toBe(true);
  });

  it('evaluates simple world-state requirements', () => {
    const worldState = createInitialWorldState();

    expect(
      evaluateWorldRequirement(
        {
          type: 'blocker-cleared',
          blockerId: 'sealed-way',
          failureText: 'closed'
        },
        {
          worldState,
          artifactEtchings: {}
        }
      )
    ).toBe(false);
  });
});
