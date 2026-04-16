import type { ArtifactDefinition, ArtifactId } from './etching';

export const staffArtifact: ArtifactDefinition = {
  id: 'staff',
  name: 'Staff',
  nodes: [
    { id: 'staff-0', x: 0, y: 0 },
    { id: 'staff-1', x: 1, y: 0 },
    { id: 'staff-2', x: 2, y: 0 },
    { id: 'staff-3', x: 3, y: 0 },
    { id: 'staff-4', x: 4, y: 0 }
  ],
  edges: [
    ['staff-0', 'staff-1'],
    ['staff-1', 'staff-2'],
    ['staff-2', 'staff-3'],
    ['staff-3', 'staff-4']
  ]
};

export const tabletArtifact: ArtifactDefinition = {
  id: 'tablet',
  name: 'Tablet',
  nodes: [
    { id: 'tablet-0', x: 0, y: 0 },
    { id: 'tablet-1', x: 1, y: 0 },
    { id: 'tablet-2', x: 2, y: 0 },
    { id: 'tablet-3', x: 0, y: 1 },
    { id: 'tablet-4', x: 1, y: 1 },
    { id: 'tablet-5', x: 2, y: 1 },
    { id: 'tablet-6', x: 0, y: 2 },
    { id: 'tablet-7', x: 1, y: 2 },
    { id: 'tablet-8', x: 2, y: 2 }
  ],
  edges: [
    ['tablet-0', 'tablet-1'],
    ['tablet-1', 'tablet-2'],
    ['tablet-3', 'tablet-4'],
    ['tablet-4', 'tablet-5'],
    ['tablet-6', 'tablet-7'],
    ['tablet-7', 'tablet-8'],
    ['tablet-0', 'tablet-3'],
    ['tablet-3', 'tablet-6'],
    ['tablet-1', 'tablet-4'],
    ['tablet-4', 'tablet-7'],
    ['tablet-2', 'tablet-5'],
    ['tablet-5', 'tablet-8']
  ]
};

export const artifactsById: Record<ArtifactId, ArtifactDefinition> = {
  staff: staffArtifact,
  tablet: tabletArtifact
};

export function getArtifactDefinition(artifactId: ArtifactId): ArtifactDefinition {
  return artifactsById[artifactId];
}
