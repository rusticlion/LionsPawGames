export type ArtifactId = 'staff' | 'tablet';
export type NodeId = string;
export type SigilId =
  | 'life'
  | 'flame'
  | 'stone'
  | 'thread'
  | 'diffuse'
  | 'well';

export const artifactIdValues = ['staff', 'tablet'] as const;
export const sigilIdValues = [
  'life',
  'flame',
  'stone',
  'thread',
  'diffuse',
  'well'
] as const;

export type PlacementFailureReason =
  | 'node-not-found'
  | 'node-occupied'
  | 'unsupported-sigil';

export interface ArtifactNode {
  id: NodeId;
  x: number;
  y: number;
}

export interface ArtifactDefinition {
  id: ArtifactId;
  name: string;
  nodes: ArtifactNode[];
  edges: Array<readonly [NodeId, NodeId]>;
  startingMp?: Partial<Record<NodeId, number>>;
}

export interface EtchingNodeState {
  mp: number;
  sigil?: SigilId;
  locked: boolean;
}

export interface EtchPlacement {
  nodeId: NodeId;
  sigil: SigilId;
}

export interface EtchingState {
  artifactId: ArtifactId;
  nodes: Record<NodeId, EtchingNodeState>;
  placements: EtchPlacement[];
}

export type PlacementResult =
  | { ok: true; state: EtchingState }
  | {
      ok: false;
      reason: PlacementFailureReason;
      state: EtchingState;
    };

export function createBlankEtching(artifact: ArtifactDefinition): EtchingState {
  const nodes: Record<NodeId, EtchingNodeState> = {};

  for (const node of artifact.nodes) {
    nodes[node.id] = {
      mp: clampMp(artifact.startingMp?.[node.id] ?? 0),
      locked: false
    };
  }

  return {
    artifactId: artifact.id,
    nodes,
    placements: []
  };
}

export function resetEtching(artifact: ArtifactDefinition): EtchingState {
  return createBlankEtching(artifact);
}

export function applySigil(
  artifact: ArtifactDefinition,
  state: EtchingState,
  placement: EtchPlacement
): PlacementResult {
  const target = state.nodes[placement.nodeId];

  if (!target) {
    return { ok: false, reason: 'node-not-found', state };
  }

  if (target.sigil) {
    return { ok: false, reason: 'node-occupied', state };
  }

  if (!isSupportedSigil(placement.sigil)) {
    return { ok: false, reason: 'unsupported-sigil', state };
  }

  const nextState = cloneState(state);
  nextState.nodes[placement.nodeId].sigil = placement.sigil;

  switch (placement.sigil) {
    case 'life':
      applyLife(artifact, nextState, placement.nodeId);
      break;
    case 'flame':
      applyFlame(artifact, nextState, placement.nodeId);
      break;
    case 'stone':
      nextState.nodes[placement.nodeId].locked = true;
      break;
    case 'thread':
      applyThread(nextState, placement.nodeId);
      break;
    case 'diffuse':
      applyDiffuse(artifact, nextState, placement.nodeId);
      break;
    case 'well':
      applyWell(artifact, nextState, placement.nodeId);
      break;
  }

  nextState.placements.push(placement);

  return { ok: true, state: nextState };
}

export function getAdjacentNodeIds(
  artifact: ArtifactDefinition,
  nodeId: NodeId,
  state?: EtchingState
): NodeId[] {
  const adjacent = new Set<NodeId>();

  for (const [a, b] of getEffectiveEdges(artifact, state)) {
    if (a === nodeId) {
      adjacent.add(b);
    }

    if (b === nodeId) {
      adjacent.add(a);
    }
  }

  return artifact.nodes
    .map((node) => node.id)
    .filter((id) => adjacent.has(id));
}

export function getEffectiveEdges(
  artifact: ArtifactDefinition,
  state?: EtchingState
): Array<readonly [NodeId, NodeId]> {
  if (!state) {
    return [...artifact.edges];
  }

  const nodeIds = new Set(artifact.nodes.map((node) => node.id));

  return [
    ...artifact.edges,
    ...getThreadEdges(state).filter(
      ([a, b]) => nodeIds.has(a) && nodeIds.has(b)
    )
  ];
}

export function getThreadEdges(
  state: EtchingState
): Array<readonly [NodeId, NodeId]> {
  const edges: Array<readonly [NodeId, NodeId]> = [];
  let previousThreadNodeId: NodeId | undefined;

  for (const placement of state.placements) {
    if (placement.sigil !== 'thread') {
      continue;
    }

    if (previousThreadNodeId) {
      edges.push([previousThreadNodeId, placement.nodeId]);
    }

    previousThreadNodeId = placement.nodeId;
  }

  return edges;
}

export function nodeHasAtLeastMp(
  state: EtchingState,
  nodeId: NodeId,
  mp: number
): boolean {
  return (state.nodes[nodeId]?.mp ?? 0) >= mp;
}

export function totalMp(state: EtchingState): number {
  return Object.values(state.nodes).reduce((sum, node) => sum + node.mp, 0);
}

function applyLife(
  artifact: ArtifactDefinition,
  state: EtchingState,
  nodeId: NodeId
): void {
  for (const adjacentId of getAdjacentNodeIds(artifact, nodeId, state)) {
    addMp(state, adjacentId, 1);
  }
}

function applyFlame(
  artifact: ArtifactDefinition,
  state: EtchingState,
  nodeId: NodeId
): void {
  const currentMp = state.nodes[nodeId].mp;
  addMp(state, nodeId, currentMp);

  for (const adjacentId of getAdjacentNodeIds(artifact, nodeId, state)) {
    addMp(state, adjacentId, -1);
  }
}

function applyThread(state: EtchingState, nodeId: NodeId): void {
  addMp(state, nodeId, 1);

  const previousThreadNodeId = findPreviousThreadNodeId(state);

  if (previousThreadNodeId) {
    addMp(state, previousThreadNodeId, 1);
  }
}

function applyDiffuse(
  artifact: ArtifactDefinition,
  state: EtchingState,
  nodeId: NodeId
): void {
  const source = state.nodes[nodeId];

  if (!source || source.locked || source.mp <= 0) {
    return;
  }

  const artifactOrder = artifactNodeOrder(artifact);
  const recipients = getAdjacentNodeIds(artifact, nodeId, state)
    .filter((id) => !state.nodes[id].locked)
    .map((id) => ({
      id,
      mp: state.nodes[id].mp
    }))
    .sort(
      (a, b) =>
        a.mp - b.mp || (artifactOrder.get(a.id) ?? 0) - (artifactOrder.get(b.id) ?? 0)
    );

  if (recipients.length === 0) {
    return;
  }

  let remainingMp = source.mp;
  let currentLevel = recipients[0].mp;
  let recipientCount = recipients.filter(
    (recipient) => recipient.mp === currentLevel
  ).length;

  while (remainingMp > 0) {
    const nextLevel =
      recipientCount < recipients.length ? recipients[recipientCount].mp : undefined;

    if (nextLevel !== undefined) {
      const costToNextLevel = (nextLevel - currentLevel) * recipientCount;

      if (costToNextLevel <= remainingMp) {
        for (let index = 0; index < recipientCount; index += 1) {
          recipients[index].mp = nextLevel;
        }

        remainingMp -= costToNextLevel;
        currentLevel = nextLevel;

        while (
          recipientCount < recipients.length &&
          recipients[recipientCount].mp === currentLevel
        ) {
          recipientCount += 1;
        }

        continue;
      }
    }

    const evenIncrement = Math.floor(remainingMp / recipientCount);

    if (evenIncrement <= 0) {
      break;
    }

    for (let index = 0; index < recipientCount; index += 1) {
      recipients[index].mp += evenIncrement;
    }

    remainingMp -= evenIncrement * recipientCount;
    break;
  }

  source.mp = remainingMp;

  for (const recipient of recipients) {
    state.nodes[recipient.id].mp = recipient.mp;
  }
}

function applyWell(
  artifact: ArtifactDefinition,
  state: EtchingState,
  nodeId: NodeId
): void {
  const target = state.nodes[nodeId];

  if (!target || target.locked) {
    return;
  }

  for (const adjacentId of getAdjacentNodeIds(artifact, nodeId, state)) {
    const adjacent = state.nodes[adjacentId];

    if (!adjacent || adjacent.locked || adjacent.mp <= 0) {
      continue;
    }

    adjacent.mp -= 1;
    addMp(state, nodeId, 1);
  }
}

function findPreviousThreadNodeId(state: EtchingState): NodeId | undefined {
  for (let index = state.placements.length - 1; index >= 0; index -= 1) {
    const placement = state.placements[index];

    if (placement.sigil === 'thread') {
      return placement.nodeId;
    }
  }

  return undefined;
}

function artifactNodeOrder(artifact: ArtifactDefinition): Map<NodeId, number> {
  return new Map(artifact.nodes.map((node, index) => [node.id, index]));
}

function addMp(state: EtchingState, nodeId: NodeId, delta: number): void {
  const node = state.nodes[nodeId];

  if (!node || node.locked) {
    return;
  }

  node.mp = clampMp(node.mp + delta);
}

function clampMp(mp: number): number {
  return Math.max(0, Math.floor(mp));
}

function cloneState(state: EtchingState): EtchingState {
  return {
    artifactId: state.artifactId,
    nodes: Object.fromEntries(
      Object.entries(state.nodes).map(([id, node]) => [id, { ...node }])
    ),
    placements: state.placements.map((placement) => ({ ...placement }))
  };
}

function isSupportedSigil(sigil: string): sigil is SigilId {
  return (
    sigil === 'life' ||
    sigil === 'flame' ||
    sigil === 'stone' ||
    sigil === 'thread' ||
    sigil === 'diffuse' ||
    sigil === 'well'
  );
}
