import { describe, expect, it } from 'vitest';
import { staffArtifact } from './artifacts';
import { applySigil, createBlankEtching } from './etching';
import { meetsChargedStaffRequirement } from './requirements';

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
});
