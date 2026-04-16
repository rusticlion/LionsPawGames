import { describe, expect, it } from 'vitest';
import { staffArtifact } from './artifacts';
import {
  applySigil,
  createBlankEtching,
  nodeHasAtLeastMp,
  resetEtching,
  totalMp
} from './etching';

describe('etching core', () => {
  it('creates a blank Staff state', () => {
    const state = createBlankEtching(staffArtifact);

    expect(Object.keys(state.nodes)).toEqual([
      'staff-0',
      'staff-1',
      'staff-2',
      'staff-3',
      'staff-4'
    ]);
    expect(totalMp(state)).toBe(0);
    expect(state.placements).toEqual([]);
  });

  it('adds Life MP to adjacent nodes only', () => {
    const result = applySigil(staffArtifact, createBlankEtching(staffArtifact), {
      nodeId: 'staff-2',
      sigil: 'life'
    });

    expect(result.ok).toBe(true);

    if (!result.ok) {
      return;
    }

    expect(result.state.nodes['staff-1'].mp).toBe(1);
    expect(result.state.nodes['staff-2'].mp).toBe(0);
    expect(result.state.nodes['staff-3'].mp).toBe(1);
    expect(totalMp(result.state)).toBe(2);
  });

  it('makes Flame sequencing matter', () => {
    const first = applySigil(staffArtifact, createBlankEtching(staffArtifact), {
      nodeId: 'staff-2',
      sigil: 'life'
    });

    expect(first.ok).toBe(true);

    if (!first.ok) {
      return;
    }

    const second = applySigil(staffArtifact, first.state, {
      nodeId: 'staff-1',
      sigil: 'flame'
    });

    expect(second.ok).toBe(true);

    if (!second.ok) {
      return;
    }

    expect(second.state.nodes['staff-0'].mp).toBe(0);
    expect(second.state.nodes['staff-1'].mp).toBe(2);
    expect(second.state.nodes['staff-2'].mp).toBe(0);
    expect(second.state.placements).toEqual([
      { nodeId: 'staff-2', sigil: 'life' },
      { nodeId: 'staff-1', sigil: 'flame' }
    ]);
  });

  it('floors MP at 0', () => {
    const result = applySigil(staffArtifact, createBlankEtching(staffArtifact), {
      nodeId: 'staff-1',
      sigil: 'flame'
    });

    expect(result.ok).toBe(true);

    if (!result.ok) {
      return;
    }

    expect(result.state.nodes['staff-0'].mp).toBe(0);
    expect(result.state.nodes['staff-1'].mp).toBe(0);
    expect(result.state.nodes['staff-2'].mp).toBe(0);
  });

  it('locks MP on Stone nodes against later changes', () => {
    const withLife = applySigil(staffArtifact, createBlankEtching(staffArtifact), {
      nodeId: 'staff-2',
      sigil: 'life'
    });

    expect(withLife.ok).toBe(true);

    if (!withLife.ok) {
      return;
    }

    const withStone = applySigil(staffArtifact, withLife.state, {
      nodeId: 'staff-1',
      sigil: 'stone'
    });

    expect(withStone.ok).toBe(true);

    if (!withStone.ok) {
      return;
    }

    const withFlame = applySigil(staffArtifact, withStone.state, {
      nodeId: 'staff-0',
      sigil: 'flame'
    });

    expect(withFlame.ok).toBe(true);

    if (!withFlame.ok) {
      return;
    }

    expect(withFlame.state.nodes['staff-1'].mp).toBe(1);
    expect(withFlame.state.nodes['staff-1'].locked).toBe(true);
  });

  it('equalizes Flow MP with remainder favoring the Flow node', () => {
    const blank = createBlankEtching(staffArtifact);
    blank.nodes['staff-1'].mp = 0;
    blank.nodes['staff-2'].mp = 1;
    blank.nodes['staff-3'].mp = 3;

    const result = applySigil(staffArtifact, blank, {
      nodeId: 'staff-2',
      sigil: 'flow'
    });

    expect(result.ok).toBe(true);

    if (!result.ok) {
      return;
    }

    expect(result.state.nodes['staff-1'].mp).toBe(1);
    expect(result.state.nodes['staff-2'].mp).toBe(2);
    expect(result.state.nodes['staff-3'].mp).toBe(1);
  });

  it('excludes locked adjacent nodes from Flow equalization', () => {
    const blank = createBlankEtching(staffArtifact);
    blank.nodes['staff-1'].mp = 4;
    blank.nodes['staff-1'].locked = true;
    blank.nodes['staff-2'].mp = 1;
    blank.nodes['staff-3'].mp = 3;

    const result = applySigil(staffArtifact, blank, {
      nodeId: 'staff-2',
      sigil: 'flow'
    });

    expect(result.ok).toBe(true);

    if (!result.ok) {
      return;
    }

    expect(result.state.nodes['staff-1'].mp).toBe(4);
    expect(result.state.nodes['staff-2'].mp).toBe(2);
    expect(result.state.nodes['staff-3'].mp).toBe(2);
  });

  it('re-equalizes existing Flow sigils after later placements', () => {
    const withFlow = applySigil(staffArtifact, createBlankEtching(staffArtifact), {
      nodeId: 'staff-2',
      sigil: 'flow'
    });

    expect(withFlow.ok).toBe(true);

    if (!withFlow.ok) {
      return;
    }

    const charged = { ...withFlow.state };
    charged.nodes = {
      ...charged.nodes,
      'staff-1': { ...charged.nodes['staff-1'], mp: 0 },
      'staff-2': { ...charged.nodes['staff-2'], mp: 3 },
      'staff-3': { ...charged.nodes['staff-3'], mp: 0 }
    };

    const result = applySigil(staffArtifact, charged, {
      nodeId: 'staff-4',
      sigil: 'life'
    });

    expect(result.ok).toBe(true);

    if (!result.ok) {
      return;
    }

    expect(result.state.nodes['staff-1'].mp).toBe(1);
    expect(result.state.nodes['staff-2'].mp).toBe(2);
    expect(result.state.nodes['staff-3'].mp).toBe(1);
  });

  it('rejects occupied nodes without changing state', () => {
    const first = applySigil(staffArtifact, createBlankEtching(staffArtifact), {
      nodeId: 'staff-2',
      sigil: 'life'
    });

    expect(first.ok).toBe(true);

    if (!first.ok) {
      return;
    }

    const second = applySigil(staffArtifact, first.state, {
      nodeId: 'staff-2',
      sigil: 'flame'
    });

    expect(second.ok).toBe(false);
    expect(second.state).toBe(first.state);
    expect(second.state.placements).toHaveLength(1);
  });

  it('resets the artifact to a blank slate', () => {
    const etched = applySigil(staffArtifact, createBlankEtching(staffArtifact), {
      nodeId: 'staff-2',
      sigil: 'life'
    });

    expect(etched.ok).toBe(true);

    const reset = resetEtching(staffArtifact);

    expect(totalMp(reset)).toBe(0);
    expect(nodeHasAtLeastMp(reset, 'staff-1', 1)).toBe(false);
    expect(reset.placements).toEqual([]);
  });
});
