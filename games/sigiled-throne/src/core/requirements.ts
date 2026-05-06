import { getArtifactDefinition } from './artifacts';
import type { ArtifactId, EtchingState, NodeId, SigilId } from './etching';
import { getAdjacentNodeIds, nodeHasAtLeastMp, totalMp } from './etching';

export type ArtifactEtchings = Partial<Record<ArtifactId, EtchingState>>;
export type CountComparison = 'exactly' | 'at-least' | 'at-most';

export type ArtifactPredicate =
  | {
      type: 'node-mp-at-least';
      artifactId: ArtifactId;
      nodeId: NodeId;
      mp: number;
    }
  | {
      type: 'total-mp-at-least';
      artifactId: ArtifactId;
      mp: number;
    }
  | {
      type: 'node-mp-exactly';
      artifactId: ArtifactId;
      nodeId: NodeId;
      mp: number;
    }
  | {
      type: 'charged-node-count';
      artifactId: ArtifactId;
      comparison: CountComparison;
      count: number;
    }
  | {
      type: 'charged-path';
      artifactId: ArtifactId;
      fromNodeId: NodeId;
      toNodeId: NodeId;
    }
  | {
      type: 'node-has-sigil';
      artifactId: ArtifactId;
      nodeId: NodeId;
      sigilId: SigilId;
    }
  | {
      type: 'all';
      predicates: ArtifactPredicate[];
    }
  | {
      type: 'any';
      predicates: ArtifactPredicate[];
    }
  | {
      type: 'not';
      predicate: ArtifactPredicate;
    };

export const chargedStaffPredicate: ArtifactPredicate = {
  type: 'all',
  predicates: [
    {
      type: 'node-mp-at-least',
      artifactId: 'staff',
      nodeId: 'staff-1',
      mp: 1
    },
    {
      type: 'node-mp-at-least',
      artifactId: 'staff',
      nodeId: 'staff-3',
      mp: 1
    }
  ]
};

export const tabletTotalManaPredicate: ArtifactPredicate = {
  type: 'total-mp-at-least',
  artifactId: 'tablet',
  mp: 4
};

export function evaluateArtifactPredicate(
  predicate: ArtifactPredicate,
  etchings: ArtifactEtchings
): boolean {
  switch (predicate.type) {
    case 'node-mp-at-least': {
      const state = etchings[predicate.artifactId];

      return Boolean(state && nodeHasAtLeastMp(state, predicate.nodeId, predicate.mp));
    }
    case 'total-mp-at-least': {
      const state = etchings[predicate.artifactId];

      return Boolean(state && totalMp(state) >= predicate.mp);
    }
    case 'node-mp-exactly': {
      const state = etchings[predicate.artifactId];

      return Boolean(state && (state.nodes[predicate.nodeId]?.mp ?? 0) === predicate.mp);
    }
    case 'charged-node-count': {
      const state = etchings[predicate.artifactId];

      if (!state) {
        return false;
      }

      return compareCount(
        Object.values(state.nodes).filter((node) => node.mp > 0).length,
        predicate.comparison,
        predicate.count
      );
    }
    case 'charged-path': {
      const state = etchings[predicate.artifactId];

      return Boolean(state && hasChargedPath(state, predicate));
    }
    case 'node-has-sigil': {
      const state = etchings[predicate.artifactId];

      return state?.nodes[predicate.nodeId]?.sigil === predicate.sigilId;
    }
    case 'all':
      return predicate.predicates.every((entry) =>
        evaluateArtifactPredicate(entry, etchings)
      );
    case 'any':
      return predicate.predicates.some((entry) =>
        evaluateArtifactPredicate(entry, etchings)
      );
    case 'not':
      return !evaluateArtifactPredicate(predicate.predicate, etchings);
  }
}

export function describeArtifactPredicate(
  predicate: ArtifactPredicate
): string[] {
  switch (predicate.type) {
    case 'node-mp-at-least':
      return [
        `${artifactName(predicate.artifactId)}: ${nodeName(
          predicate.artifactId,
          predicate.nodeId
        )} has at least ${predicate.mp} MP.`
      ];
    case 'total-mp-at-least':
      return [
        `${artifactName(predicate.artifactId)}: holds at least ${predicate.mp} total MP.`
      ];
    case 'node-mp-exactly':
      return [
        `${artifactName(predicate.artifactId)}: ${nodeName(
          predicate.artifactId,
          predicate.nodeId
        )} has exactly ${predicate.mp} MP.`
      ];
    case 'charged-node-count':
      return [
        `${artifactName(predicate.artifactId)}: ${comparisonText(
          predicate.comparison
        )} ${predicate.count} ${pluralize(
          'node',
          predicate.count
        )} ${holdVerb(predicate.count)} MP.`
      ];
    case 'charged-path':
      return [
        `${artifactName(predicate.artifactId)}: charged path connects ${nodeName(
          predicate.artifactId,
          predicate.fromNodeId
        )} to ${nodeName(predicate.artifactId, predicate.toNodeId)}.`
      ];
    case 'node-has-sigil':
      return [
        `${artifactName(predicate.artifactId)}: ${nodeName(
          predicate.artifactId,
          predicate.nodeId
        )} holds ${sigilName(predicate.sigilId)}.`
      ];
    case 'all':
      return predicate.predicates.flatMap((entry) =>
        describeArtifactPredicate(entry)
      );
    case 'any':
      return [
        `One of: ${predicate.predicates
          .flatMap((entry) => describeArtifactPredicate(entry))
          .map((entry) => entry.replace(/\.$/, ''))
          .join(' or ')}.`
      ];
    case 'not':
      return describeArtifactPredicate(predicate.predicate).map(
        (entry) => `Not: ${entry}`
      );
  }
}

export function describeUnmetArtifactPredicate(
  predicate: ArtifactPredicate,
  etchings: ArtifactEtchings
): string[] {
  if (evaluateArtifactPredicate(predicate, etchings)) {
    return [];
  }

  switch (predicate.type) {
    case 'node-mp-at-least':
    case 'total-mp-at-least':
    case 'node-mp-exactly':
    case 'charged-node-count':
    case 'charged-path':
    case 'node-has-sigil':
      return describeArtifactPredicate(predicate);
    case 'all':
      return predicate.predicates.flatMap((entry) =>
        describeUnmetArtifactPredicate(entry, etchings)
      );
    case 'any':
    case 'not':
      return describeArtifactPredicate(predicate);
  }
}

export function getArtifactPredicateNodeIds(
  predicate: ArtifactPredicate,
  artifactId: ArtifactId
): NodeId[] {
  switch (predicate.type) {
    case 'node-mp-at-least':
    case 'node-mp-exactly':
    case 'node-has-sigil':
      return predicate.artifactId === artifactId ? [predicate.nodeId] : [];
    case 'charged-path':
      return predicate.artifactId === artifactId
        ? [predicate.fromNodeId, predicate.toNodeId]
        : [];
    case 'charged-node-count':
      return predicate.artifactId === artifactId
        ? getArtifactDefinition(artifactId).nodes.map((node) => node.id)
        : [];
    case 'total-mp-at-least':
      return [];
    case 'all':
    case 'any':
      return uniqueEntries(
        predicate.predicates.flatMap((entry) =>
          getArtifactPredicateNodeIds(entry, artifactId)
        )
      );
    case 'not':
      return getArtifactPredicateNodeIds(predicate.predicate, artifactId);
  }
}

export function meetsChargedStaffRequirement(state: EtchingState): boolean {
  return evaluateArtifactPredicate(chargedStaffPredicate, {
    staff: state
  });
}

export function artifactName(artifactId: ArtifactId): string {
  return getArtifactDefinition(artifactId).name;
}

export function nodeName(artifactId: ArtifactId, nodeId: NodeId): string {
  const nodeIndex = getArtifactDefinition(artifactId).nodes.findIndex(
    (node) => node.id === nodeId
  );

  if (artifactId === 'staff') {
    const names = ['Outer L', 'Inner L', 'Center', 'Inner R', 'Outer R'];

    return names[nodeIndex] ?? nodeId;
  }

  if (artifactId === 'tablet') {
    const names = [
      'Top L',
      'Top',
      'Top R',
      'Left',
      'Center',
      'Right',
      'Bot L',
      'Bot',
      'Bot R'
    ];

    return names[nodeIndex] ?? nodeId;
  }

  return nodeId;
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

function compareCount(
  actual: number,
  comparison: CountComparison,
  expected: number
): boolean {
  switch (comparison) {
    case 'exactly':
      return actual === expected;
    case 'at-least':
      return actual >= expected;
    case 'at-most':
      return actual <= expected;
  }
}

function comparisonText(comparison: CountComparison): string {
  switch (comparison) {
    case 'exactly':
      return 'exactly';
    case 'at-least':
      return 'at least';
    case 'at-most':
      return 'at most';
  }
}

function pluralize(word: string, count: number): string {
  return count === 1 ? word : `${word}s`;
}

function uniqueEntries<T>(entries: T[]): T[] {
  return Array.from(new Set(entries));
}

function holdVerb(count: number): string {
  return count === 1 ? 'holds' : 'hold';
}

function hasChargedPath(
  state: EtchingState,
  predicate: Extract<ArtifactPredicate, { type: 'charged-path' }>
): boolean {
  if (
    (state.nodes[predicate.fromNodeId]?.mp ?? 0) <= 0 ||
    (state.nodes[predicate.toNodeId]?.mp ?? 0) <= 0
  ) {
    return false;
  }

  const artifact = getArtifactDefinition(predicate.artifactId);
  const visited = new Set<NodeId>();
  const frontier: NodeId[] = [predicate.fromNodeId];

  while (frontier.length > 0) {
    const nodeId = frontier.shift();

    if (!nodeId || visited.has(nodeId)) {
      continue;
    }

    if (nodeId === predicate.toNodeId) {
      return true;
    }

    visited.add(nodeId);

    for (const adjacentId of getAdjacentNodeIds(artifact, nodeId, state)) {
      if (!visited.has(adjacentId) && (state.nodes[adjacentId]?.mp ?? 0) > 0) {
        frontier.push(adjacentId);
      }
    }
  }

  return false;
}
