import { describe, expect, it } from 'vitest';
import {
  clearBlocker,
  createInitialWorldState,
  cycleEquippedArtifact,
  isBlockerCleared,
  isArtifactObtained,
  isSigilUnlocked,
  obtainArtifact,
  unlockSigil
} from './worldState';

describe('world state', () => {
  it('tracks cleared blockers without mutating the previous state', () => {
    const initial = createInitialWorldState();

    expect(isBlockerCleared(initial, 'sealed-way')).toBe(false);
    expect(initial.unlockedSigils).toEqual(['life', 'flame', 'stone']);
    expect(initial.obtainedArtifacts).toEqual([]);
    expect(initial.equippedArtifact).toBeUndefined();

    const cleared = clearBlocker(initial, 'sealed-way');

    expect(isBlockerCleared(cleared, 'sealed-way')).toBe(true);
    expect(isBlockerCleared(initial, 'sealed-way')).toBe(false);
  });

  it('does not duplicate blocker ids', () => {
    const initial = createInitialWorldState();
    const cleared = clearBlocker(initial, 'sealed-way');
    const clearedAgain = clearBlocker(cleared, 'sealed-way');

    expect(clearedAgain.clearedBlockers).toEqual(['sealed-way']);
  });

  it('unlocks new sigils without mutating the previous state', () => {
    const initial = createInitialWorldState();

    expect(isSigilUnlocked(initial, 'flow')).toBe(false);

    const withFlow = unlockSigil(initial, 'flow');

    expect(isSigilUnlocked(withFlow, 'flow')).toBe(true);
    expect(isSigilUnlocked(initial, 'flow')).toBe(false);
  });

  it('does not duplicate unlocked sigils', () => {
    const initial = createInitialWorldState();
    const withFlow = unlockSigil(initial, 'flow');
    const withFlowAgain = unlockSigil(withFlow, 'flow');

    expect(withFlowAgain.unlockedSigils).toEqual([
      'life',
      'flame',
      'stone',
      'flow'
    ]);
  });

  it('obtains and equips artifacts without mutating the previous state', () => {
    const initial = createInitialWorldState();
    const withStaff = obtainArtifact(initial, 'staff');

    expect(isArtifactObtained(withStaff, 'staff')).toBe(true);
    expect(withStaff.equippedArtifact).toBe('staff');
    expect(isArtifactObtained(initial, 'staff')).toBe(false);
  });

  it('does not duplicate obtained artifacts', () => {
    const withStaff = obtainArtifact(createInitialWorldState(), 'staff');
    const withStaffAgain = obtainArtifact(withStaff, 'staff');

    expect(withStaffAgain.obtainedArtifacts).toEqual(['staff']);
    expect(withStaffAgain.equippedArtifact).toBe('staff');
  });

  it('cycles equipped artifacts in obtained order', () => {
    const withStaff = obtainArtifact(createInitialWorldState(), 'staff');
    const withTablet = obtainArtifact(withStaff, 'tablet');

    expect(withTablet.equippedArtifact).toBe('tablet');

    const cycled = cycleEquippedArtifact(withTablet);

    expect(cycled.equippedArtifact).toBe('staff');
    expect(cycleEquippedArtifact(cycled).equippedArtifact).toBe('tablet');
  });
});
