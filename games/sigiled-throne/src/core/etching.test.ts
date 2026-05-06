import { describe, expect, it } from 'vitest';
import { staffArtifact, tabletArtifact } from './artifacts';
import {
  applySigil,
  createBlankEtching,
  getAdjacentNodeIds,
  getThreadEdges,
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

  it('sparks and connects Thread sigils in placement order', () => {
    const first = applySigil(staffArtifact, createBlankEtching(staffArtifact), {
      nodeId: 'staff-0',
      sigil: 'thread'
    });

    expect(first.ok).toBe(true);

    if (!first.ok) {
      return;
    }

    const second = applySigil(staffArtifact, first.state, {
      nodeId: 'staff-4',
      sigil: 'thread'
    });

    expect(second.ok).toBe(true);

    if (!second.ok) {
      return;
    }

    expect(second.state.nodes['staff-0'].mp).toBe(2);
    expect(second.state.nodes['staff-4'].mp).toBe(1);
    expect(getThreadEdges(second.state)).toEqual([['staff-0', 'staff-4']]);
    expect(getAdjacentNodeIds(staffArtifact, 'staff-0', second.state)).toEqual([
      'staff-1',
      'staff-4'
    ]);
  });

  it('diffuses MP into lower-value neighbors and leaves indivisible surplus', () => {
    const blank = createBlankEtching(tabletArtifact);
    blank.nodes['tablet-1'].mp = 7;
    blank.nodes['tablet-0'].mp = 0;
    blank.nodes['tablet-2'].mp = 1;
    blank.nodes['tablet-4'].mp = 3;

    const result = applySigil(tabletArtifact, blank, {
      nodeId: 'tablet-1',
      sigil: 'diffuse'
    });

    expect(result.ok).toBe(true);

    if (!result.ok) {
      return;
    }

    expect(result.state.nodes['tablet-0'].mp).toBe(3);
    expect(result.state.nodes['tablet-2'].mp).toBe(3);
    expect(result.state.nodes['tablet-4'].mp).toBe(3);
    expect(result.state.nodes['tablet-1'].mp).toBe(2);
  });

  it('keeps sealed neighbors out of Diffuse redistribution', () => {
    const blank = createBlankEtching(tabletArtifact);
    blank.nodes['tablet-1'].mp = 5;
    blank.nodes['tablet-0'].mp = 0;
    blank.nodes['tablet-2'].mp = 0;
    blank.nodes['tablet-2'].locked = true;
    blank.nodes['tablet-4'].mp = 2;

    const result = applySigil(tabletArtifact, blank, {
      nodeId: 'tablet-1',
      sigil: 'diffuse'
    });

    expect(result.ok).toBe(true);

    if (!result.ok) {
      return;
    }

    expect(result.state.nodes['tablet-0'].mp).toBe(3);
    expect(result.state.nodes['tablet-2'].mp).toBe(0);
    expect(result.state.nodes['tablet-4'].mp).toBe(3);
    expect(result.state.nodes['tablet-1'].mp).toBe(1);
  });

  it('pulls MP inward with Well', () => {
    const blank = createBlankEtching(staffArtifact);
    blank.nodes['staff-1'].mp = 2;
    blank.nodes['staff-3'].mp = 1;

    const result = applySigil(staffArtifact, blank, {
      nodeId: 'staff-2',
      sigil: 'well'
    });

    expect(result.ok).toBe(true);

    if (!result.ok) {
      return;
    }

    expect(result.state.nodes['staff-1'].mp).toBe(1);
    expect(result.state.nodes['staff-2'].mp).toBe(2);
    expect(result.state.nodes['staff-3'].mp).toBe(0);
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
