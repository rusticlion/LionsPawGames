import type { EtchingState } from './etching';
import { nodeHasAtLeastMp } from './etching';

export function meetsChargedStaffRequirement(state: EtchingState): boolean {
  return (
    nodeHasAtLeastMp(state, 'staff-1', 1) &&
    nodeHasAtLeastMp(state, 'staff-3', 1)
  );
}
