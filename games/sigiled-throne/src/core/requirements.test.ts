import { describe, expect, it } from 'vitest';
import { staffArtifact, tabletArtifact } from './artifacts';
import { applySigil, createBlankEtching } from './etching';
import {
  chargedStaffPredicate,
  describeArtifactPredicate,
  describeUnmetArtifactPredicate,
  evaluateArtifactPredicate,
  meetsChargedStaffRequirement,
  tabletTotalManaPredicate
} from './requirements';

describe('artifact requirements', () => {
  it('recognizes a charged Staff etch', () => {
    const blank = createBlankEtching(staffArtifact);

    expect(meetsChargedStaffRequirement(blank)).toBe(false);

    const result = applySigil(staffArtifact, blank, {
      nodeId: 'staff-2',
      sigil: 'life'
    });

    expect(result.ok).toBe(true);

    if (!result.ok) {
      return;
    }

    expect(meetsChargedStaffRequirement(result.state)).toBe(true);
  });

  it('evaluates total MP predicates', () => {
    const tablet = createBlankEtching(tabletArtifact);
    tablet.nodes['tablet-0'].mp = 1;
    tablet.nodes['tablet-4'].mp = 2;
    tablet.nodes['tablet-8'].mp = 1;

    expect(
      evaluateArtifactPredicate(tabletTotalManaPredicate, {
        tablet
      })
    ).toBe(true);
  });

  it('evaluates exact node MP predicates', () => {
    const tablet = createBlankEtching(tabletArtifact);
    tablet.nodes['tablet-4'].mp = 2;

    expect(
      evaluateArtifactPredicate(
        {
          type: 'node-mp-exactly',
          artifactId: 'tablet',
          nodeId: 'tablet-4',
          mp: 2
        },
        { tablet }
      )
    ).toBe(true);
  });

  it('evaluates charged node counts', () => {
    const tablet = createBlankEtching(tabletArtifact);
    tablet.nodes['tablet-0'].mp = 1;
    tablet.nodes['tablet-4'].mp = 2;
    tablet.nodes['tablet-8'].mp = 1;

    expect(
      evaluateArtifactPredicate(
        {
          type: 'charged-node-count',
          artifactId: 'tablet',
          comparison: 'exactly',
          count: 3
        },
        { tablet }
      )
    ).toBe(true);
  });

  it('uses Thread edges when evaluating charged paths', () => {
    const firstThread = applySigil(staffArtifact, createBlankEtching(staffArtifact), {
      nodeId: 'staff-0',
      sigil: 'thread'
    });

    expect(firstThread.ok).toBe(true);

    if (!firstThread.ok) {
      return;
    }

    const secondThread = applySigil(staffArtifact, firstThread.state, {
      nodeId: 'staff-4',
      sigil: 'thread'
    });

    expect(secondThread.ok).toBe(true);

    if (!secondThread.ok) {
      return;
    }

    expect(
      evaluateArtifactPredicate(
        {
          type: 'charged-path',
          artifactId: 'staff',
          fromNodeId: 'staff-0',
          toNodeId: 'staff-4'
        },
        { staff: secondThread.state }
      )
    ).toBe(true);
  });

  it('composes artifact predicates', () => {
    const staff = createBlankEtching(staffArtifact);
    staff.nodes['staff-1'].mp = 1;
    staff.nodes['staff-3'].mp = 0;

    expect(
      evaluateArtifactPredicate(
        {
          type: 'any',
          predicates: [
            {
              type: 'node-mp-at-least',
              artifactId: 'staff',
              nodeId: 'staff-3',
              mp: 1
            },
            {
              type: 'node-mp-at-least',
              artifactId: 'staff',
              nodeId: 'staff-1',
              mp: 1
            }
          ]
        },
        { staff }
      )
    ).toBe(true);
  });

  it('describes artifact predicates in player-facing terms', () => {
    expect(describeArtifactPredicate(chargedStaffPredicate)).toEqual([
      'Staff: Inner L has at least 1 MP.',
      'Staff: Inner R has at least 1 MP.'
    ]);

    expect(describeArtifactPredicate(tabletTotalManaPredicate)).toEqual([
      'Tablet: holds at least 4 total MP.'
    ]);

    expect(
      describeArtifactPredicate({
        type: 'node-mp-exactly',
        artifactId: 'tablet',
        nodeId: 'tablet-4',
        mp: 2
      })
    ).toEqual(['Tablet: Center has exactly 2 MP.']);

    expect(
      describeArtifactPredicate({
        type: 'charged-node-count',
        artifactId: 'tablet',
        comparison: 'exactly',
        count: 3
      })
    ).toEqual(['Tablet: exactly 3 nodes hold MP.']);
  });

  it('describes only unmet subconditions when possible', () => {
    const staff = createBlankEtching(staffArtifact);
    staff.nodes['staff-1'].mp = 1;

    expect(describeUnmetArtifactPredicate(chargedStaffPredicate, { staff })).toEqual([
      'Staff: Inner R has at least 1 MP.'
    ]);
  });
});
