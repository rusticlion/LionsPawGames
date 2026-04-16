import Phaser from 'phaser';
import { getArtifactDefinition } from '../core/artifacts';
import {
  applySigil,
  createBlankEtching,
  resetEtching,
  type ArtifactDefinition,
  type ArtifactId,
  type EtchingState,
  type NodeId,
  type SigilId
} from '../core/etching';
import type { Direction, TileCoord } from '../core/gridNavigation';
import { meetsChargedStaffRequirement } from '../core/requirements';
import {
  createInitialWorldState,
  isSigilUnlocked,
  type WorldState
} from '../core/worldState';

type SigilView = {
  id: SigilId;
  name: string;
  key: string;
  color: number;
  textColor: string;
  description: string;
};

type ArtifactEtchings = Partial<Record<ArtifactId, EtchingState>>;

type EtchingSceneData = {
  artifactId?: ArtifactId;
  returnTile?: TileCoord;
  returnFacing?: Direction;
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
    description: 'Freeze this node'
  },
  {
    id: 'flow',
    name: 'Flow',
    key: '4',
    color: 0x66c9d2,
    textColor: '#c4f4f4',
    description: 'Even out this node and neighbors'
  }
];

const paletteWidth = 162;
const paletteHeight = 88;
const artifactCenter = new Phaser.Math.Vector2(480, 312);
const nodeSpacing = 96;

export class EtchingScene extends Phaser.Scene {
  private artifact: ArtifactDefinition = getArtifactDefinition('staff');
  private artifactId: ArtifactId = 'staff';
  private state: EtchingState = createBlankEtching(this.artifact);
  private selectedSigil: SigilId = 'life';
  private graphLayer?: Phaser.GameObjects.Container;
  private statusText?: Phaser.GameObjects.Text;
  private requirementText?: Phaser.GameObjects.Text;
  private paletteItems = new Map<SigilId, Phaser.GameObjects.Container>();
  private returnTile: TileCoord = { x: 4, y: 8 };
  private returnFacing: Direction = 'down';

  constructor() {
    super('EtchingScene');
  }

  create(data: EtchingSceneData = {}): void {
    const worldState = this.getWorldState();
    this.artifactId =
      data.artifactId ?? worldState.equippedArtifact ?? worldState.obtainedArtifacts[0] ?? 'staff';
    this.artifact = getArtifactDefinition(this.artifactId);
    this.returnTile = data.returnTile ?? this.returnTile;
    this.returnFacing = data.returnFacing ?? this.returnFacing;
    this.state =
      this.getArtifactEtchings()[this.artifactId] ?? createBlankEtching(this.artifact);
    this.ensureSelectedSigilIsAvailable();

    this.drawBackground();
    this.drawHeader();
    this.createPalette();
    this.createControls();
    this.createGraph();
    this.bindKeys();
    this.refresh();
  }

  private drawBackground(): void {
    const graphics = this.add.graphics();

    graphics.fillGradientStyle(0x1b1d18, 0x1b1d18, 0x27352a, 0x27352a, 1);
    graphics.fillRect(0, 0, 960, 540);

    graphics.fillStyle(0x5b4d36, 1);
    graphics.fillRoundedRect(180, 200, 600, 228, 8);
    graphics.fillStyle(0x8c7b50, 1);
    graphics.fillRoundedRect(204, 226, 552, 176, 8);
    graphics.fillStyle(0x2a241c, 1);
    graphics.fillRoundedRect(226, 304, 508, 18, 8);

    graphics.lineStyle(2, 0xc7bd83, 0.8);
    graphics.strokeRoundedRect(180, 200, 600, 228, 8);
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

    this.requirementText = this.add.text(36, 470, '', {
      color: '#f2f0df',
      fontSize: '18px'
    });

    this.statusText = this.add.text(36, 500, '', {
      color: '#9fb8a6',
      fontSize: '16px'
    });
  }

  private createPalette(): void {
    this.availableSigilViews().forEach((sigil, index) => {
      const x = 42 + index * 190;
      const y = 112;
      const item = this.add.container(x, y);
      const plate = this.add.graphics();

      plate.fillStyle(0x242820, 1);
      plate.fillRoundedRect(0, 0, paletteWidth, paletteHeight, 8);
      plate.lineStyle(2, 0x55624d, 1);
      plate.strokeRoundedRect(0, 0, paletteWidth, paletteHeight, 8);

      const icon = this.add.graphics();
      icon.fillStyle(sigil.color, 1);
      icon.fillCircle(22, 24, 14);
      icon.lineStyle(2, 0xf2f0df, 1);
      icon.strokeCircle(22, 24, 12);

      const label = this.add.text(44, 12, `${sigil.key}. ${sigil.name}`, {
        color: sigil.textColor,
        fontSize: '17px'
      });

      const description = this.add.text(12, 44, sigil.description, {
        color: '#c7cbb4',
        fontSize: '12px',
        wordWrap: { width: paletteWidth - 24 }
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
    this.createButton(662, 38, 114, 'Reset', () => this.reset());
    this.createButton(800, 38, 114, 'Back', () => this.backToOverworld());

    this.add.text(676, 90, 'R: reset   Esc: back', {
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
  }

  private bindKeys(): void {
    this.input.keyboard?.on('keydown-ONE', () => this.selectSigil('life'));
    this.input.keyboard?.on('keydown-TWO', () => this.selectSigil('flame'));
    this.input.keyboard?.on('keydown-THREE', () => this.selectSigil('stone'));
    this.input.keyboard?.on('keydown-FOUR', () => this.selectSigil('flow'));
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
    const result = applySigil(this.artifact, this.state, {
      nodeId,
      sigil: this.selectedSigil
    });

    if (!result.ok) {
      this.statusText?.setText(this.failureText(result.reason));
      return;
    }

    this.state = result.state;
    this.storeCurrentEtching();
    this.statusText?.setText(
      `${this.getSigilView(this.selectedSigil).name} etched on ${this.nodeLabel(
        nodeId
      )}.`
    );
    this.refresh();
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

    nodeGraphics.fillStyle(0x151713, 1);
    nodeGraphics.fillCircle(position.x, position.y, 28);
    nodeGraphics.lineStyle(4, nodeState.locked ? 0xf2f0df : 0xc7bd83, 1);
    nodeGraphics.strokeCircle(position.x, position.y, 28);

    if (sigilView) {
      nodeGraphics.fillStyle(sigilView.color, 0.9);
      nodeGraphics.fillCircle(position.x, position.y, 18);
    }

    this.graphLayer.add(nodeGraphics);

    const label = this.add
      .text(position.x, position.y, sigilView ? sigilView.name[0] : '', {
        color: '#151713',
        fontSize: '20px',
        fontStyle: 'bold'
      })
      .setOrigin(0.5);
    this.graphLayer.add(label);

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

  private drawMpChits(nodeId: NodeId, mp: number): void {
    if (!this.graphLayer || mp <= 0) {
      return;
    }

    const position = this.nodePosition(nodeId);
    const visibleChits = Math.min(mp, 12);

    for (let index = 0; index < visibleChits; index += 1) {
      const angle = (Math.PI * 2 * index) / visibleChits - Math.PI / 2;
      const radius = 42;
      const x = position.x + Math.cos(angle) * radius;
      const y = position.y + Math.sin(angle) * radius;
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

      chit.setRotation(angle + Math.PI / 2);
      chit.setStrokeStyle(1, 0x3b3121, 0.9);
      this.graphLayer.add(chit);
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

  private refreshRequirement(): void {
    if (this.artifactId !== 'staff') {
      this.requirementText?.setText('No world gate is listening to this artifact yet.');
      this.requirementText?.setColor('#f2f0df');
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

  private reset(): void {
    this.state = resetEtching(this.artifact);
    this.storeCurrentEtching();
    this.statusText?.setText(`The ${this.artifact.name} is blank again.`);
    this.refresh();
  }

  private backToOverworld(): void {
    this.storeCurrentEtching();
    this.scene.start('OverworldScene', {
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
