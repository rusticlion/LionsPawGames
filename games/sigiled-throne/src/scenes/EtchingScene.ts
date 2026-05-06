import Phaser from 'phaser';
import { getArtifactDefinition } from '../core/artifacts';
import {
  applySigil,
  createBlankEtching,
  getThreadEdges,
  resetEtching,
  type ArtifactDefinition,
  type ArtifactId,
  type EtchingState,
  type NodeId,
  type SigilId
} from '../core/etching';
import {
  gameViewportHeight,
  gameViewportWidth,
  type Direction,
  type RoomId,
  type TileCoord,
  type WorldInteractionId
} from '../core/gridNavigation';
import {
  evaluateArtifactPredicate,
  getArtifactPredicateNodeIds,
  meetsChargedStaffRequirement,
  tabletTotalManaPredicate
} from '../core/requirements';
import {
  createSaveData,
  saveGameData
} from '../core/saveData';
import {
  createInitialWorldState,
  isSigilUnlocked,
  type WorldState
} from '../core/worldState';
import { worldInteractions } from '../core/worldInteractions';

type SigilView = {
  id: SigilId;
  name: string;
  key: string;
  color: number;
  textColor: string;
  description: string;
};

type ArtifactEtchings = Partial<Record<ArtifactId, EtchingState>>;

type ManaChitRender = {
  chit: Phaser.GameObjects.Triangle;
  center: Phaser.Math.Vector2;
  radius: number;
  phase: number;
  speed: number;
};

type LockFieldRender = {
  halo: Phaser.GameObjects.Arc;
  ring: Phaser.GameObjects.Arc;
  phase: number;
};

type EtchingSceneData = {
  artifactId?: ArtifactId;
  returnRoomId?: RoomId;
  returnTile?: TileCoord;
  returnFacing?: Direction;
  focusInteractionId?: WorldInteractionId;
};

const sigils: SigilView[] = [
  {
    id: 'life',
    name: 'Life',
    key: '1',
    color: 0x68b684,
    textColor: '#d7f4c5',
    description: 'Adjacent nodes gain 1 MP'
  },
  {
    id: 'flame',
    name: 'Flame',
    key: '2',
    color: 0xd86747,
    textColor: '#ffd0b8',
    description: 'Double this node, drain neighbors'
  },
  {
    id: 'stone',
    name: 'Stone',
    key: '3',
    color: 0x9fa3a0,
    textColor: '#f4f0e6',
    description: "Seal this node's MP"
  },
  {
    id: 'thread',
    name: 'Thread',
    key: '4',
    color: 0x66c9d2,
    textColor: '#c4f4f4',
    description: 'Spark and link Threads'
  },
  {
    id: 'diffuse',
    name: 'Diffuse',
    key: '5',
    color: 0xcbb86b,
    textColor: '#fff0b8',
    description: 'Fill lower neighbors first'
  },
  {
    id: 'well',
    name: 'Well',
    key: '6',
    color: 0x7b79c9,
    textColor: '#ddd9ff',
    description: 'Pull 1 MP from neighbors'
  }
];

const paletteWidth = 112;
const paletteHeight = 86;
const artifactCenter = new Phaser.Math.Vector2(430, 326);
const nodeSpacing = 96;

export class EtchingScene extends Phaser.Scene {
  private artifact: ArtifactDefinition = getArtifactDefinition('staff');
  private artifactId: ArtifactId = 'staff';
  private state: EtchingState = createBlankEtching(this.artifact);
  private selectedSigil: SigilId = 'life';
  private graphLayer?: Phaser.GameObjects.Container;
  private animationLayer?: Phaser.GameObjects.Container;
  private statusText?: Phaser.GameObjects.Text;
  private requirementText?: Phaser.GameObjects.Text;
  private paletteItems = new Map<SigilId, Phaser.GameObjects.Container>();
  private manaChits: ManaChitRender[] = [];
  private lockFields: LockFieldRender[] = [];
  private returnRoomId: RoomId = 'island';
  private returnTile: TileCoord = { x: 3, y: 7 };
  private returnFacing: Direction = 'down';
  private focusInteractionId?: WorldInteractionId;
  private focusNodeIds = new Set<NodeId>();

  constructor() {
    super('EtchingScene');
  }

  create(data: EtchingSceneData = {}): void {
    const worldState = this.getWorldState();
    this.artifactId =
      data.artifactId ?? worldState.equippedArtifact ?? worldState.obtainedArtifacts[0] ?? 'staff';
    this.artifact = getArtifactDefinition(this.artifactId);
    this.returnRoomId = data.returnRoomId ?? worldState.currentRoomId;
    this.returnTile = data.returnTile ?? worldState.playerTile;
    this.returnFacing = data.returnFacing ?? worldState.facing;
    this.focusInteractionId = data.focusInteractionId;
    this.state =
      this.getArtifactEtchings()[this.artifactId] ?? createBlankEtching(this.artifact);
    this.focusNodeIds = this.getFocusedNodeIds();
    this.ensureSelectedSigilIsAvailable();

    this.drawBackground();
    this.drawHeader();
    this.createPalette();
    this.createControls();
    this.createGraph();
    this.bindKeys();
    this.refresh();
  }

  update(time: number): void {
    this.updateManaChits(time);
    this.updateLockFields(time);
  }

  private drawBackground(): void {
    const graphics = this.add.graphics();

    graphics.fillGradientStyle(0x1b1d18, 0x1b1d18, 0x27352a, 0x27352a, 1);
    graphics.fillRect(0, 0, gameViewportWidth, gameViewportHeight);

    this.drawArtifactArtwork(graphics);
  }

  private drawArtifactArtwork(graphics: Phaser.GameObjects.Graphics): void {
    graphics.fillStyle(0x5b4d36, 1);
    graphics.fillRoundedRect(152, 214, 520, 226, 8);
    graphics.fillStyle(0x8c7b50, 1);
    graphics.fillRoundedRect(176, 238, 472, 174, 8);

    graphics.lineStyle(2, 0xc7bd83, 0.8);
    graphics.strokeRoundedRect(152, 214, 520, 226, 8);

    if (this.artifactId === 'tablet') {
      graphics.fillStyle(0x2d352c, 0.48);
      graphics.fillRoundedRect(298, 214, 264, 224, 8);
      graphics.lineStyle(3, 0xc7bd83, 0.75);
      graphics.strokeRoundedRect(314, 230, 232, 192, 8);
      graphics.lineStyle(2, 0xf2f0df, 0.22);
      graphics.lineBetween(334, 294, 526, 294);
      graphics.lineBetween(334, 358, 526, 358);
      graphics.lineBetween(398, 246, 398, 406);
      graphics.lineBetween(462, 246, 462, 406);
      return;
    }

    graphics.fillStyle(0x2a241c, 1);
    graphics.fillRoundedRect(198, 318, 428, 18, 8);
    graphics.lineStyle(2, 0xf2f0df, 0.22);
    graphics.lineBetween(234, 326, 626, 326);
    graphics.fillStyle(0xc7bd83, 0.85);
    graphics.fillRoundedRect(404, 294, 52, 64, 8);
    graphics.fillStyle(0x5b4d36, 1);
    graphics.fillCircle(430, 326, 18);
  }

  private drawHeader(): void {
    this.add.text(34, 28, `${this.artifact.name} Etching`, {
      color: '#f2f0df',
      fontFamily: 'Georgia, serif',
      fontSize: '36px'
    });

    this.add.text(
      36,
      76,
      'Choose a sigil, then click an empty node. Project the ritual before you etch.',
      {
        color: '#c9d6a3',
        fontSize: '16px',
        wordWrap: { width: 610 }
      }
    );

    this.requirementText = this.add.text(36, gameViewportHeight - 72, '', {
      color: '#f2f0df',
      fontSize: '18px'
    });

    this.statusText = this.add.text(36, gameViewportHeight - 42, '', {
      color: '#9fb8a6',
      fontSize: '16px'
    });
  }

  private createPalette(): void {
    this.availableSigilViews().forEach((sigil, index) => {
      const x = 18 + index * 124;
      const y = 112;
      const item = this.add.container(x, y);
      const plate = this.add.graphics();

      plate.fillStyle(0x242820, 1);
      plate.fillRoundedRect(0, 0, paletteWidth, paletteHeight, 8);
      plate.lineStyle(2, 0x55624d, 1);
      plate.strokeRoundedRect(0, 0, paletteWidth, paletteHeight, 8);

      const icon = this.createSigilIcon(sigil, 18, 24, 13);

      const label = this.add.text(36, 12, `${sigil.key}. ${sigil.name}`, {
        color: sigil.textColor,
        fontSize: '14px'
      });

      const description = this.add.text(10, 42, sigil.description, {
        color: '#c7cbb4',
        fontSize: '10px',
        wordWrap: { width: paletteWidth - 20 }
      });

      item.add([plate, icon, label, description]);
      item.setSize(paletteWidth, paletteHeight);
      item.setInteractive(
        new Phaser.Geom.Rectangle(0, 0, paletteWidth, paletteHeight),
        Phaser.Geom.Rectangle.Contains
      );
      item.on('pointerdown', () => {
        this.selectedSigil = sigil.id;
        this.statusText?.setText(`${sigil.name} selected.`);
        this.refreshPalette();
      });

      this.paletteItems.set(sigil.id, item);
    });
  }

  private createControls(): void {
    this.createButton(gameViewportWidth - 260, 38, 114, 'Reset', () => this.reset());
    this.createButton(gameViewportWidth - 130, 38, 114, 'Back', () =>
      this.backToOverworld()
    );

    this.add.text(gameViewportWidth - 246, 90, 'R: reset   Esc: back', {
      color: '#9fb8a6',
      fontSize: '14px'
    });
  }

  private createButton(
    x: number,
    y: number,
    width: number,
    label: string,
    onClick: () => void
  ): void {
    const button = this.add.container(x, y);
    const plate = this.add.graphics();

    plate.fillStyle(0x2d352c, 1);
    plate.fillRoundedRect(0, 0, width, 38, 8);
    plate.lineStyle(2, 0x82945b, 1);
    plate.strokeRoundedRect(0, 0, width, 38, 8);

    const text = this.add
      .text(width / 2, 19, label, {
        color: '#f2f0df',
        fontSize: '16px'
      })
      .setOrigin(0.5);

    button.add([plate, text]);
    button.setSize(width, 38);
    button.setInteractive(
      new Phaser.Geom.Rectangle(0, 0, width, 38),
      Phaser.Geom.Rectangle.Contains
    );
    button.on('pointerdown', onClick);
  }

  private createGraph(): void {
    this.graphLayer = this.add.container(0, 0);
    this.graphLayer.setDepth(5);
    this.animationLayer = this.add.container(0, 0);
    this.animationLayer.setDepth(20);
  }

  private bindKeys(): void {
    this.input.keyboard?.on('keydown-ONE', () => this.selectSigil('life'));
    this.input.keyboard?.on('keydown-TWO', () => this.selectSigil('flame'));
    this.input.keyboard?.on('keydown-THREE', () => this.selectSigil('stone'));
    this.input.keyboard?.on('keydown-FOUR', () => this.selectSigil('thread'));
    this.input.keyboard?.on('keydown-FIVE', () => this.selectSigil('diffuse'));
    this.input.keyboard?.on('keydown-SIX', () => this.selectSigil('well'));
    this.input.keyboard?.on('keydown-R', () => this.reset());
    this.input.keyboard?.on('keydown-ESC', () => this.backToOverworld());
  }

  private selectSigil(sigil: SigilId): void {
    if (!this.sigilIsAvailable(sigil)) {
      this.statusText?.setText(`${this.getSigilView(sigil).name} has not awakened.`);
      return;
    }

    this.selectedSigil = sigil;
    this.statusText?.setText(`${this.getSigilView(sigil).name} selected.`);
    this.refreshPalette();
  }

  private placeSigil(nodeId: NodeId): void {
    const previousState = this.copyEtchingForRender(this.state);
    const selectedSigil = this.selectedSigil;
    const result = applySigil(this.artifact, this.state, {
      nodeId,
      sigil: selectedSigil
    });

    if (!result.ok) {
      this.statusText?.setText(this.failureText(result.reason));
      return;
    }

    this.state = result.state;
    this.storeCurrentEtching();
    this.statusText?.setText(
      `${this.getSigilView(selectedSigil).name} etched on ${this.nodeLabel(
        nodeId
      )}.`
    );
    this.refresh();
    this.playPlacementAnimation(previousState, this.state, nodeId, selectedSigil);
  }

  private refresh(): void {
    this.refreshPalette();
    this.refreshGraph();
    this.refreshRequirement();
  }

  private refreshPalette(): void {
    for (const [sigilId, item] of this.paletteItems) {
      const selected = sigilId === this.selectedSigil;
      const plate = item.getAt(0) as Phaser.GameObjects.Graphics;

      plate.clear();
      plate.fillStyle(selected ? 0x374436 : 0x242820, 1);
      plate.fillRoundedRect(0, 0, paletteWidth, paletteHeight, 8);
      plate.lineStyle(2, selected ? 0xf2f0df : 0x55624d, 1);
      plate.strokeRoundedRect(0, 0, paletteWidth, paletteHeight, 8);
    }
  }

  private refreshGraph(): void {
    this.manaChits = [];
    this.lockFields = [];
    this.animationLayer?.removeAll(true);
    this.graphLayer?.removeAll(true);

    if (!this.graphLayer) {
      return;
    }

    const edgeGraphics = this.add.graphics();
    edgeGraphics.lineStyle(6, 0xf2f0df, 0.36);

    for (const [a, b] of this.artifact.edges) {
      const start = this.nodePosition(a);
      const end = this.nodePosition(b);
      edgeGraphics.lineBetween(start.x, start.y, end.x, end.y);
    }

    this.graphLayer.add(edgeGraphics);

    const threadGraphics = this.add.graphics();
    threadGraphics.lineStyle(4, 0x66c9d2, 0.82);

    for (const [a, b] of getThreadEdges(this.state)) {
      const start = this.nodePosition(a);
      const end = this.nodePosition(b);
      threadGraphics.lineBetween(start.x, start.y, end.x, end.y);
    }

    this.graphLayer.add(threadGraphics);

    for (const node of this.artifact.nodes) {
      this.drawNode(node.id);
    }
  }

  private drawNode(nodeId: NodeId): void {
    if (!this.graphLayer) {
      return;
    }

    const position = this.nodePosition(nodeId);
    const nodeState = this.state.nodes[nodeId];
    const sigilView = nodeState.sigil ? this.getSigilView(nodeState.sigil) : undefined;
    const nodeGraphics = this.add.graphics();

    if (nodeState.locked) {
      this.drawLockField(position);
    }

    if (this.focusNodeIds.has(nodeId)) {
      this.drawRequirementFocus(position);
    }

    nodeGraphics.fillStyle(0x151713, 1);
    nodeGraphics.fillCircle(position.x, position.y, 28);
    nodeGraphics.lineStyle(4, nodeState.locked ? 0x9fd3ff : 0xc7bd83, 1);
    nodeGraphics.strokeCircle(position.x, position.y, 28);

    if (sigilView) {
      nodeGraphics.fillStyle(0x0d1110, 0.92);
      nodeGraphics.fillCircle(position.x, position.y, 20);
    }

    this.graphLayer.add(nodeGraphics);

    if (sigilView) {
      this.graphLayer.add(this.createSigilIcon(sigilView, position.x, position.y, 18));
    }

    const nodeName = this.add
      .text(position.x, position.y + 48, this.nodeLabel(nodeId), {
        color: '#f2f0df',
        fontSize: '13px'
      })
      .setOrigin(0.5);
    this.graphLayer.add(nodeName);

    this.drawMpChits(nodeId, nodeState.mp);

    const hotspot = this.add.circle(position.x, position.y, 34, 0xffffff, 0.001);
    hotspot.setInteractive({ useHandCursor: true });
    hotspot.on('pointerdown', () => this.placeSigil(nodeId));
    this.graphLayer.add(hotspot);
  }

  private drawRequirementFocus(position: Phaser.Math.Vector2): void {
    if (!this.graphLayer) {
      return;
    }

    const solved = this.focusRequirementsAreSatisfied();
    const color = solved ? 0x68b684 : 0xffd866;
    const halo = this.add.circle(position.x, position.y, 46, color, solved ? 0.12 : 0.16);

    halo.setStrokeStyle(3, color, solved ? 0.62 : 0.76);
    this.graphLayer.add(halo);
  }

  private drawMpChits(nodeId: NodeId, mp: number): void {
    if (!this.graphLayer || mp <= 0) {
      return;
    }

    const position = this.nodePosition(nodeId);
    const visibleChits = Math.min(mp, 12);

    for (let index = 0; index < visibleChits; index += 1) {
      const angle = (Math.PI * 2 * index) / visibleChits - Math.PI / 2;
      const radius = this.manaOrbitRadius(mp);
      const orbitPosition = this.manaOrbitPosition(nodeId, index, visibleChits, mp);
      const chit = this.createManaChit(orbitPosition.x, orbitPosition.y);

      this.graphLayer.add(chit);
      this.manaChits.push({
        chit,
        center: position,
        radius,
        phase: angle,
        speed: 0.001 + index * 0.00004
      });
    }

    if (mp > visibleChits) {
      const count = this.add
        .text(position.x + 38, position.y - 42, `+${mp - visibleChits}`, {
          color: '#ffd866',
          fontSize: '14px',
          fontStyle: 'bold'
        })
        .setOrigin(0.5);
      this.graphLayer.add(count);
    }
  }

  private drawLockField(position: Phaser.Math.Vector2): void {
    if (!this.graphLayer) {
      return;
    }

    const halo = this.add.circle(position.x, position.y, 40, 0x9fd3ff, 0.12);
    halo.setStrokeStyle(1, 0x9fd3ff, 0.35);
    const ring = this.add.circle(position.x, position.y, 34, 0x9fd3ff, 0);
    ring.setStrokeStyle(3, 0xf2f0df, 0.72);

    this.graphLayer.add([halo, ring]);
    this.lockFields.push({
      halo,
      ring,
      phase: position.x * 0.03 + position.y * 0.017
    });
  }

  private createSigilIcon(
    sigil: SigilView,
    x: number,
    y: number,
    radius: number
  ): Phaser.GameObjects.Container {
    const icon = this.add.container(x, y);
    const backing = this.add.circle(0, 0, radius, sigil.color, 0.95);
    const glyph = this.add.graphics();
    const strokeWidth = Math.max(2, Math.floor(radius / 6));

    backing.setStrokeStyle(2, 0xf2f0df, 0.9);
    glyph.lineStyle(strokeWidth, 0x151713, 0.95);
    glyph.fillStyle(0x151713, 0.9);

    switch (sigil.id) {
      case 'life':
        glyph.lineBetween(0, -radius * 0.62, 0, radius * 0.55);
        glyph.strokeCircle(-radius * 0.22, -radius * 0.15, radius * 0.28);
        glyph.strokeCircle(radius * 0.22, radius * 0.08, radius * 0.28);
        break;
      case 'flame':
        glyph.fillTriangle(
          0,
          -radius * 0.72,
          radius * 0.52,
          radius * 0.48,
          -radius * 0.44,
          radius * 0.48
        );
        glyph.fillStyle(0xf2f0df, 0.5);
        glyph.fillTriangle(
          radius * 0.04,
          -radius * 0.26,
          radius * 0.24,
          radius * 0.35,
          -radius * 0.18,
          radius * 0.35
        );
        break;
      case 'stone':
        glyph.strokeRect(
          -radius * 0.42,
          -radius * 0.42,
          radius * 0.84,
          radius * 0.84
        );
        glyph.lineBetween(-radius * 0.26, 0, radius * 0.26, 0);
        glyph.lineBetween(0, -radius * 0.26, 0, radius * 0.26);
        break;
      case 'thread':
        glyph.strokeCircle(-radius * 0.34, 0, radius * 0.22);
        glyph.strokeCircle(radius * 0.34, 0, radius * 0.22);
        glyph.lineBetween(-radius * 0.12, 0, radius * 0.12, 0);
        glyph.lineBetween(0, -radius * 0.52, 0, radius * 0.52);
        break;
      case 'diffuse':
        glyph.lineBetween(-radius * 0.62, -radius * 0.18, -radius * 0.18, -radius * 0.38);
        glyph.lineBetween(-radius * 0.18, -radius * 0.38, radius * 0.18, -radius * 0.08);
        glyph.lineBetween(radius * 0.18, -radius * 0.08, radius * 0.62, -radius * 0.28);
        glyph.lineBetween(-radius * 0.62, radius * 0.24, -radius * 0.18, radius * 0.04);
        glyph.lineBetween(-radius * 0.18, radius * 0.04, radius * 0.18, radius * 0.34);
        glyph.lineBetween(radius * 0.18, radius * 0.34, radius * 0.62, radius * 0.14);
        break;
      case 'well':
        glyph.strokeCircle(0, 0, radius * 0.5);
        glyph.lineBetween(-radius * 0.34, -radius * 0.4, 0, -radius * 0.1);
        glyph.lineBetween(radius * 0.34, -radius * 0.4, 0, -radius * 0.1);
        glyph.lineBetween(0, -radius * 0.1, 0, radius * 0.36);
        break;
    }

    icon.add([backing, glyph]);
    return icon;
  }

  private createManaChit(
    x: number,
    y: number,
    scale = 1
  ): Phaser.GameObjects.Triangle {
    const chit = this.add.triangle(
      x,
      y,
      0,
      -6,
      7,
      6,
      -7,
      6,
      0xffd866
    );

    chit.setScale(scale);
    chit.setStrokeStyle(1, 0x3b3121, 0.9);

    return chit;
  }

  private updateManaChits(time: number): void {
    for (const render of this.manaChits) {
      if (!render.chit.active) {
        continue;
      }

      const angle = render.phase + time * render.speed;

      render.chit.setPosition(
        render.center.x + Math.cos(angle) * render.radius,
        render.center.y + Math.sin(angle) * render.radius
      );
      render.chit.setRotation(angle + Math.PI / 2);
    }
  }

  private updateLockFields(time: number): void {
    for (const render of this.lockFields) {
      if (!render.halo.active || !render.ring.active) {
        continue;
      }

      const pulse = (Math.sin(time * 0.004 + render.phase) + 1) / 2;

      render.halo.setScale(1 + pulse * 0.08);
      render.halo.setAlpha(0.1 + pulse * 0.12);
      render.ring.setScale(1 + pulse * 0.04);
      render.ring.setAlpha(0.62 + pulse * 0.26);
    }
  }

  private playPlacementAnimation(
    previousState: EtchingState,
    nextState: EtchingState,
    placedNodeId: NodeId,
    sigil: SigilId
  ): void {
    this.pulsePaintedNode(placedNodeId, this.getSigilView(sigil).color);
    this.playManaTransfers(previousState, nextState, placedNodeId);
  }

  private pulsePaintedNode(nodeId: NodeId, color: number): void {
    if (!this.animationLayer) {
      return;
    }

    const position = this.nodePosition(nodeId);
    const pulse = this.add.circle(position.x, position.y, 24, color, 0.18);

    pulse.setStrokeStyle(3, 0xf2f0df, 0.8);
    this.animationLayer.add(pulse);

    this.tweens.add({
      targets: pulse,
      scale: 2.15,
      alpha: 0,
      duration: 420,
      ease: 'Sine.easeOut',
      onComplete: () => pulse.destroy()
    });
  }

  private playManaTransfers(
    previousState: EtchingState,
    nextState: EtchingState,
    placedNodeId: NodeId
  ): void {
    if (!this.animationLayer) {
      return;
    }

    const lossPool: NodeId[] = [];
    const gainPool: NodeId[] = [];

    for (const node of this.artifact.nodes) {
      const beforeMp = previousState.nodes[node.id]?.mp ?? 0;
      const afterMp = nextState.nodes[node.id]?.mp ?? 0;
      const delta = afterMp - beforeMp;
      const pool = delta > 0 ? gainPool : lossPool;

      for (let index = 0; index < Math.min(Math.abs(delta), 12); index += 1) {
        pool.push(node.id);
      }
    }

    const transferCount = Math.min(
      Math.max(lossPool.length, gainPool.length),
      20
    );

    if (transferCount === 0) {
      return;
    }

    const sourceOrdinals = new Map<NodeId, number>();
    const targetOrdinals = new Map<NodeId, number>();

    for (let index = 0; index < transferCount; index += 1) {
      const fromNodeId =
        lossPool.length > 0 ? lossPool[index % lossPool.length] : placedNodeId;
      const toNodeId =
        gainPool.length > 0 ? gainPool[index % gainPool.length] : placedNodeId;
      const start = lossPool.length > 0
        ? this.nextManaOrbitPosition(
            fromNodeId,
            previousState,
            sourceOrdinals
          )
        : this.nodePosition(placedNodeId);
      const end = gainPool.length > 0
        ? this.nextManaOrbitPosition(toNodeId, nextState, targetOrdinals)
        : this.nodePosition(placedNodeId);

      this.playManaTransfer(start, end, index, gainPool.length === 0);
    }
  }

  private playManaTransfer(
    start: Phaser.Math.Vector2,
    end: Phaser.Math.Vector2,
    index: number,
    fadeOut: boolean
  ): void {
    if (!this.animationLayer) {
      return;
    }

    const chit = this.createManaChit(start.x, start.y, 1.1);
    const control = this.transferControlPoint(start, end, index);
    const motion = { t: 0 };

    chit.setAlpha(0.95);
    this.animationLayer.add(chit);

    this.tweens.add({
      targets: motion,
      t: 1,
      delay: index * 24,
      duration: 430,
      ease: 'Sine.easeInOut',
      onUpdate: () => {
        const point = this.quadraticPoint(start, control, end, motion.t);

        chit.setPosition(point.x, point.y);
        chit.setRotation(
          Phaser.Math.Angle.Between(control.x, control.y, end.x, end.y) +
            Math.PI / 2
        );

        if (fadeOut) {
          chit.setAlpha(1 - motion.t);
        }
      },
      onComplete: () => chit.destroy()
    });
  }

  private transferControlPoint(
    start: Phaser.Math.Vector2,
    end: Phaser.Math.Vector2,
    index: number
  ): Phaser.Math.Vector2 {
    const midpoint = new Phaser.Math.Vector2(
      (start.x + end.x) / 2,
      (start.y + end.y) / 2
    );
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const length = Math.max(1, Math.hypot(dx, dy));
    const direction = index % 2 === 0 ? 1 : -1;
    const offset = Math.min(72, 30 + length * 0.18) * direction;

    return new Phaser.Math.Vector2(
      midpoint.x + (-dy / length) * offset,
      midpoint.y + (dx / length) * offset
    );
  }

  private quadraticPoint(
    start: Phaser.Math.Vector2,
    control: Phaser.Math.Vector2,
    end: Phaser.Math.Vector2,
    t: number
  ): Phaser.Math.Vector2 {
    const inverse = 1 - t;

    return new Phaser.Math.Vector2(
      inverse * inverse * start.x + 2 * inverse * t * control.x + t * t * end.x,
      inverse * inverse * start.y + 2 * inverse * t * control.y + t * t * end.y
    );
  }

  private nextManaOrbitPosition(
    nodeId: NodeId,
    state: EtchingState,
    ordinals: Map<NodeId, number>
  ): Phaser.Math.Vector2 {
    const ordinal = ordinals.get(nodeId) ?? 0;
    const mp = Math.max(1, state.nodes[nodeId]?.mp ?? 1);
    const visibleCount = Math.max(1, Math.min(mp, 12));

    ordinals.set(nodeId, ordinal + 1);

    return this.manaOrbitPosition(nodeId, ordinal % visibleCount, visibleCount, mp);
  }

  private manaOrbitPosition(
    nodeId: NodeId,
    index: number,
    visibleCount: number,
    mp: number
  ): Phaser.Math.Vector2 {
    const position = this.nodePosition(nodeId);
    const angle = (Math.PI * 2 * index) / visibleCount - Math.PI / 2;
    const radius = this.manaOrbitRadius(mp);

    return new Phaser.Math.Vector2(
      position.x + Math.cos(angle) * radius,
      position.y + Math.sin(angle) * radius
    );
  }

  private manaOrbitRadius(mp: number): number {
    return mp > 6 ? 46 : 42;
  }

  private copyEtchingForRender(state: EtchingState): EtchingState {
    return {
      artifactId: state.artifactId,
      nodes: Object.fromEntries(
        Object.entries(state.nodes).map(([id, node]) => [id, { ...node }])
      ),
      placements: state.placements.map((placement) => ({ ...placement }))
    };
  }

  private refreshRequirement(): void {
    if (this.artifactId !== 'staff') {
      const solved = evaluateArtifactPredicate(tabletTotalManaPredicate, {
        tablet: this.state
      });

      this.requirementText?.setText(
        solved
          ? 'Tablet charge complete: the Tablet holds at least 4 total MP.'
          : 'Goal: put at least 4 total MP anywhere on the Tablet.'
      );
      this.requirementText?.setColor(solved ? '#d7f4c5' : '#f2f0df');
      return;
    }

    const solved = meetsChargedStaffRequirement(this.state);

    this.requirementText?.setText(
      solved
        ? 'Charged Staff complete: inner-left and inner-right nodes each hold MP.'
        : 'Goal: put at least 1 MP on the inner-left and inner-right nodes.'
    );
    this.requirementText?.setColor(solved ? '#d7f4c5' : '#f2f0df');
  }

  private getFocusedNodeIds(): Set<NodeId> {
    if (!this.focusInteractionId) {
      return new Set();
    }

    const interaction = worldInteractions[this.focusInteractionId];

    return new Set(
      interaction.requirements.flatMap((requirement) =>
        requirement.type === 'artifact-predicate'
          ? getArtifactPredicateNodeIds(requirement.predicate, this.artifactId)
          : []
      )
    );
  }

  private focusRequirementsAreSatisfied(): boolean {
    if (!this.focusInteractionId) {
      return false;
    }

    const predicates = worldInteractions[this.focusInteractionId].requirements
      .filter((requirement) => requirement.type === 'artifact-predicate')
      .map((requirement) => requirement.predicate)
      .filter((predicate) =>
        getArtifactPredicateNodeIds(predicate, this.artifactId).length > 0
      );

    return (
      predicates.length > 0 &&
      predicates.every((predicate) =>
        evaluateArtifactPredicate(predicate, {
          [this.artifactId]: this.state
        })
      )
    );
  }

  private reset(): void {
    this.state = resetEtching(this.artifact);
    this.storeCurrentEtching();
    this.statusText?.setText(`The ${this.artifact.name} is blank again.`);
    this.refresh();
  }

  private backToOverworld(): void {
    this.storeCurrentEtching();
    this.scene.start('OverworldScene', {
      roomId: this.returnRoomId,
      spawnTile: this.returnTile,
      facing: this.returnFacing,
      fromEtching: true
    });
  }

  private getSigilView(sigil: SigilId): SigilView {
    return sigils.find((entry) => entry.id === sigil) ?? sigils[0];
  }

  private availableSigilViews(): SigilView[] {
    return sigils.filter((sigil) => this.sigilIsAvailable(sigil.id));
  }

  private sigilIsAvailable(sigil: SigilId): boolean {
    return isSigilUnlocked(this.getWorldState(), sigil);
  }

  private ensureSelectedSigilIsAvailable(): void {
    if (!this.sigilIsAvailable(this.selectedSigil)) {
      this.selectedSigil = this.availableSigilViews()[0]?.id ?? 'life';
    }
  }

  private getWorldState(): WorldState {
    const state = this.registry.get('worldState') as WorldState | undefined;

    if (state) {
      return state;
    }

    const initialState = createInitialWorldState();
    this.registry.set('worldState', initialState);

    return initialState;
  }

  private getArtifactEtchings(): ArtifactEtchings {
    return (this.registry.get('artifactEtchings') as ArtifactEtchings | undefined) ?? {};
  }

  private storeCurrentEtching(): void {
    this.registry.set('artifactEtchings', {
      ...this.getArtifactEtchings(),
      [this.artifactId]: this.state
    });
    this.saveGame();
  }

  private saveGame(): void {
    const storage = this.getBrowserStorage();

    if (!storage) {
      return;
    }

    try {
      saveGameData(
        storage,
        createSaveData(this.getWorldState(), this.getArtifactEtchings())
      );
    } catch {
      this.statusText?.setText('The island could not save this etch.');
    }
  }

  private getBrowserStorage(): Storage | undefined {
    if (typeof window === 'undefined') {
      return undefined;
    }

    try {
      return window.localStorage;
    } catch {
      return undefined;
    }
  }

  private failureText(reason: string): string {
    switch (reason) {
      case 'node-occupied':
        return 'That node already holds a sigil.';
      case 'node-not-found':
        return `The ${this.artifact.name} does not recognize that point.`;
      default:
        return 'That sigil will not take.';
    }
  }

  private nodeLabel(nodeId: NodeId): string {
    const index = this.artifact.nodes.findIndex((node) => node.id === nodeId);

    if (this.artifactId === 'staff') {
      const names = ['Outer L', 'Inner L', 'Center', 'Inner R', 'Outer R'];

      return names[index] ?? nodeId;
    }

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

    return names[index] ?? nodeId;
  }

  private nodePosition(nodeId: NodeId): Phaser.Math.Vector2 {
    const node = this.artifact.nodes.find((entry) => entry.id === nodeId);

    if (!node) {
      return artifactCenter.clone();
    }

    const xs = this.artifact.nodes.map((entry) => entry.x);
    const ys = this.artifact.nodes.map((entry) => entry.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    return new Phaser.Math.Vector2(
      artifactCenter.x + (node.x - centerX) * nodeSpacing,
      artifactCenter.y + (node.y - centerY) * nodeSpacing
    );
  }
}
