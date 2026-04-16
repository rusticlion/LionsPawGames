export type ArtifactId = 'staff' | 'tablet';
export type NodeId = string;
export type SigilId = 'life' | 'flame' | 'stone' | 'flow';

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
    case 'flow':
      break;
  }

  applyFlowSigils(artifact, nextState);
  nextState.placements.push(placement);

  return { ok: true, state: nextState };
}

export function getAdjacentNodeIds(
  artifact: ArtifactDefinition,
  nodeId: NodeId
): NodeId[] {
  const adjacent = new Set<NodeId>();

  for (const [a, b] of artifact.edges) {
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
  for (const adjacentId of getAdjacentNodeIds(artifact, nodeId)) {
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

  for (const adjacentId of getAdjacentNodeIds(artifact, nodeId)) {
    addMp(state, adjacentId, -1);
  }
}

function applyFlow(
  artifact: ArtifactDefinition,
  state: EtchingState,
  nodeId: NodeId
): void {
  const flowGroup = [nodeId, ...getAdjacentNodeIds(artifact, nodeId)].filter(
    (id) => !state.nodes[id].locked
  );
  const total = flowGroup.reduce((sum, id) => sum + state.nodes[id].mp, 0);
  const baseMp = Math.floor(total / flowGroup.length);
  let remainder = total % flowGroup.length;

  for (const id of flowGroup) {
    state.nodes[id].mp = baseMp + (remainder > 0 ? 1 : 0);
    remainder = Math.max(0, remainder - 1);
  }
}

function applyFlowSigils(
  artifact: ArtifactDefinition,
  state: EtchingState
): void {
  for (const node of artifact.nodes) {
    if (state.nodes[node.id].sigil === 'flow') {
      applyFlow(artifact, state, node.id);
    }
  }
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
    sigil === 'flow'
  );
}
