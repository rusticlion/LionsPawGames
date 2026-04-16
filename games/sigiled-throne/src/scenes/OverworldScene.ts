import Phaser from 'phaser';
import { getArtifactDefinition } from '../core/artifacts';
import {
  createBlankEtching,
  type ArtifactId,
  type EtchingState
} from '../core/etching';
import {
  canEnterTile,
  getInteractableAt,
  placeholderOverworldMap,
  tileInDirection,
  tileSize,
  tileToPixel,
  type Direction,
  type GridInteractable,
  type TileCoord
} from '../core/gridNavigation';
import { meetsChargedStaffRequirement } from '../core/requirements';
import {
  clearBlocker,
  createInitialWorldState,
  cycleEquippedArtifact,
  isArtifactObtained,
  isBlockerCleared,
  isSigilUnlocked,
  obtainArtifact,
  unlockSigil,
  type WorldState
} from '../core/worldState';

const stepDurationMs = 145;

type ArtifactEtchings = Partial<Record<ArtifactId, EtchingState>>;

type OverworldSceneData = {
  spawnTile?: TileCoord;
  facing?: Direction;
  fromEtching?: boolean;
};

export class OverworldScene extends Phaser.Scene {
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private keys?: Record<'up' | 'left' | 'down' | 'right', Phaser.Input.Keyboard.Key>;
  private interactKey?: Phaser.Input.Keyboard.Key;
  private etchKey?: Phaser.Input.Keyboard.Key;
  private cycleKey?: Phaser.Input.Keyboard.Key;
  private player?: Phaser.GameObjects.Sprite;
  private prompt?: Phaser.GameObjects.Text;
  private artifactText?: Phaser.GameObjects.Text;
  private playerTile: TileCoord = { x: 4, y: 8 };
  private facing: Direction = 'down';
  private isMoving = false;

  constructor() {
    super('OverworldScene');
  }

  create(data: OverworldSceneData = {}): void {
    this.playerTile = data.spawnTile ?? this.playerTile;
    this.facing = data.facing ?? this.facing;

    const worldWidth = placeholderOverworldMap.width * tileSize;
    const worldHeight = placeholderOverworldMap.height * tileSize;

    this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);
    this.drawMap();

    const spawnPixel = tileToPixel(this.playerTile);
    this.player = this.add.sprite(
      spawnPixel.x,
      spawnPixel.y,
      'player-placeholder'
    );
    this.player.setScale(2);
    this.updatePlayerFacing();

    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);

    this.cursors = this.input.keyboard?.createCursorKeys();
    this.keys = this.input.keyboard?.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      right: Phaser.Input.Keyboard.KeyCodes.D
    }) as Record<'up' | 'left' | 'down' | 'right', Phaser.Input.Keyboard.Key>;
    this.interactKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    this.etchKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.X);
    this.cycleKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.TAB);

    this.prompt = this.add
      .text(16, 16, this.defaultPrompt(), {
        backgroundColor: '#151713',
        color: '#f2f0df',
        fontSize: '16px',
        padding: { x: 10, y: 8 }
      })
      .setScrollFactor(0);

    if (data.fromEtching) {
      this.prompt.setText('Returned from etching. The island waits.');
    }

    this.artifactText = this.add
      .text(16, 56, '', {
        backgroundColor: '#151713',
        color: '#c9d6a3',
        fontSize: '15px',
        padding: { x: 10, y: 8 }
      })
      .setScrollFactor(0);

    this.updateArtifactHud();
    this.updatePrompt();
  }

  update(): void {
    this.checkArtifactControls();
    this.checkInteractions();
    this.checkMovement();
  }

  private checkArtifactControls(): void {
    if (
      this.cycleKey &&
      Phaser.Input.Keyboard.JustDown(this.cycleKey) &&
      this.getWorldState().obtainedArtifacts.length > 1
    ) {
      this.registry.set('worldState', cycleEquippedArtifact(this.getWorldState()));
      this.updateArtifactHud();
      this.updatePrompt();
    }

    if (this.etchKey && Phaser.Input.Keyboard.JustDown(this.etchKey)) {
      this.openEquippedArtifact();
    }
  }

  private checkMovement(): void {
    if (this.isMoving || !this.player) {
      return;
    }

    const direction = this.getHeldDirection();

    if (!direction) {
      return;
    }

    this.facing = direction;
    this.updatePlayerFacing();

    const targetTile = tileInDirection(this.playerTile, direction);

    if (!canEnterTile(placeholderOverworldMap, targetTile, this.activeInteractables())) {
      this.updatePrompt();
      return;
    }

    this.stepToTile(targetTile);
  }

  private checkInteractions(): void {
    const spacePressed = Boolean(
      this.cursors?.space && Phaser.Input.Keyboard.JustDown(this.cursors.space)
    );
    const interactPressed = Boolean(
      this.interactKey && Phaser.Input.Keyboard.JustDown(this.interactKey)
    );

    if (!spacePressed && !interactPressed) {
      return;
    }

    const interactable = this.facingInteractable();

    switch (interactable?.id) {
      case 'staff-plinth':
        this.obtainArtifactFromPlinth('staff');
        break;
      case 'sealed-way':
        this.tryClearSealedWay();
        break;
      case 'flow-shrine':
        this.unlockFlow();
        break;
      case 'tablet-plinth':
        this.obtainArtifactFromPlinth('tablet');
        break;
    }
  }

  private stepToTile(targetTile: TileCoord): void {
    if (!this.player) {
      return;
    }

    const targetPixel = tileToPixel(targetTile);
    this.isMoving = true;

    this.tweens.add({
      targets: this.player,
      x: targetPixel.x,
      y: targetPixel.y,
      duration: stepDurationMs,
      ease: 'Linear',
      onComplete: () => {
        this.playerTile = targetTile;
        this.isMoving = false;
        this.updatePrompt();
      }
    });
  }

  private getHeldDirection(): Direction | undefined {
    if (this.cursors?.left.isDown || this.keys?.left.isDown) {
      return 'left';
    }

    if (this.cursors?.right.isDown || this.keys?.right.isDown) {
      return 'right';
    }

    if (this.cursors?.up.isDown || this.keys?.up.isDown) {
      return 'up';
    }

    if (this.cursors?.down.isDown || this.keys?.down.isDown) {
      return 'down';
    }

    return undefined;
  }

  private drawMap(): void {
    const graphics = this.add.graphics();
    const worldWidth = placeholderOverworldMap.width * tileSize;
    const worldHeight = placeholderOverworldMap.height * tileSize;

    graphics.fillStyle(0x426b5f, 1);
    graphics.fillRect(0, 0, worldWidth, worldHeight);

    for (let y = 0; y < placeholderOverworldMap.height; y += 1) {
      for (let x = 0; x < placeholderOverworldMap.width; x += 1) {
        const blocked = !canEnterTile(placeholderOverworldMap, { x, y }, []);
        graphics.fillStyle(blocked ? 0x426b5f : 0x82945b, 1);
        graphics.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
        graphics.lineStyle(1, 0x6f8054, 0.24);
        graphics.strokeRect(x * tileSize, y * tileSize, tileSize, tileSize);
      }
    }

    this.drawStaffPlinth();
    this.drawSealedWay();
    this.drawFlowShrine();
    this.drawTabletPlinth();
  }

  private drawStaffPlinth(): void {
    const pixel = tileToPixel({ x: 8, y: 6 });
    const graphics = this.add.graphics();

    graphics.fillStyle(0xb9b56f, 1);
    graphics.fillCircle(pixel.x, pixel.y, 19);
    graphics.fillStyle(0x2d352c, 1);
    graphics.fillRect(pixel.x - 18, pixel.y - 3, 36, 6);
    graphics.fillRect(pixel.x - 3, pixel.y - 18, 6, 36);

    this.add
      .text(
        pixel.x,
        pixel.y + 34,
        this.artifactIsObtained('staff') ? 'Empty Plinth' : 'Staff Plinth',
        {
          color: '#2d352c',
          fontSize: '14px'
        }
      )
      .setOrigin(0.5);
  }

  private drawTabletPlinth(): void {
    if (!this.sealedWayIsCleared()) {
      return;
    }

    const pixel = tileToPixel({ x: 18, y: 8 });
    const graphics = this.add.graphics();

    graphics.fillStyle(this.artifactIsObtained('tablet') ? 0x54634d : 0xb9b56f, 1);
    graphics.fillRoundedRect(pixel.x - 22, pixel.y - 18, 44, 36, 6);
    graphics.lineStyle(3, 0x2d352c, 0.9);
    graphics.strokeRoundedRect(pixel.x - 18, pixel.y - 14, 36, 28, 4);

    this.add
      .text(
        pixel.x,
        pixel.y + 34,
        this.artifactIsObtained('tablet') ? 'Empty Plinth' : 'Tablet Plinth',
        {
          color: '#f2f0df',
          fontSize: '14px'
        }
      )
      .setOrigin(0.5);
  }

  private drawSealedWay(): void {
    const pixel = tileToPixel({ x: 15, y: 6 });
    const graphics = this.add.graphics();

    if (this.sealedWayIsCleared()) {
      graphics.fillStyle(0x426b5f, 1);
      graphics.fillRoundedRect(pixel.x - 25, pixel.y - 22, 50, 44, 8);
      graphics.fillStyle(0xc7bd83, 1);
      graphics.fillRoundedRect(pixel.x - 19, pixel.y - 6, 38, 12, 8);
    } else {
      graphics.fillStyle(0x8b4f50, 1);
      graphics.fillRoundedRect(pixel.x - 22, pixel.y - 22, 44, 44, 8);
    }

    this.add
      .text(pixel.x, pixel.y + 34, this.sealedWayIsCleared() ? 'Opened Way' : 'Sealed Way', {
        color: '#f2f0df',
        fontSize: '14px'
      })
      .setOrigin(0.5);
  }

  private drawFlowShrine(): void {
    if (!this.sealedWayIsCleared() || this.flowIsUnlocked()) {
      return;
    }

    const pixel = tileToPixel({ x: 19, y: 6 });
    const graphics = this.add.graphics();

    graphics.fillStyle(0x66c9d2, 1);
    graphics.fillCircle(pixel.x, pixel.y, 19);
    graphics.lineStyle(3, 0xf2f0df, 0.9);
    graphics.strokeCircle(pixel.x, pixel.y, 18);
    graphics.lineBetween(pixel.x - 14, pixel.y, pixel.x + 14, pixel.y);

    this.add
      .text(pixel.x, pixel.y + 34, 'Flow Shrine', {
        color: '#f2f0df',
        fontSize: '14px'
      })
      .setOrigin(0.5);
  }

  private updatePrompt(): void {
    if (!this.prompt) {
      return;
    }

    const interactable = this.facingInteractable();

    switch (interactable?.id) {
      case 'staff-plinth':
        this.prompt.setText(
          this.artifactIsObtained('staff')
            ? 'Staff Plinth: the Staff is already yours. Press X to etch it.'
            : 'Staff Plinth: press E or Space to take the Staff.'
        );
        return;
      case 'sealed-way':
        this.prompt.setText(
          this.sealedWayIsCleared()
            ? 'Opened Way: the first gate remembers your etch.'
            : this.staffIsCharged()
              ? 'Sealed Way: the charged Staff answers. Press E or Space to clear it.'
              : 'Sealed Way: needs a charged Staff etch.'
        );
        return;
      case 'flow-shrine':
        this.prompt.setText('Flow Shrine: press E or Space to awaken Flow.');
        return;
      case 'tablet-plinth':
        this.prompt.setText(
          this.artifactIsObtained('tablet')
            ? 'Tablet Plinth: the Tablet is already yours. Press Tab to cycle artifacts.'
            : 'Tablet Plinth: press E or Space to take the Tablet.'
        );
        return;
    }

    this.prompt.setText(this.defaultPrompt());
  }

  private activeInteractables(): GridInteractable[] {
    return placeholderOverworldMap.interactables.filter((interactable) => {
      if (interactable.id === 'sealed-way') {
        return !this.sealedWayIsCleared();
      }

      if (interactable.id === 'flow-shrine') {
        return this.sealedWayIsCleared() && !this.flowIsUnlocked();
      }

      if (interactable.id === 'tablet-plinth') {
        return this.sealedWayIsCleared() && !this.artifactIsObtained('tablet');
      }

      return true;
    });
  }

  private facingInteractable(): GridInteractable | undefined {
    const frontTile = tileInDirection(this.playerTile, this.facing);
    const active = getInteractableAt(this.activeInteractables(), frontTile);

    if (active) {
      return active;
    }

    const sealedWay = getInteractableAt(
      placeholderOverworldMap.interactables,
      frontTile
    );

    return sealedWay?.id === 'sealed-way' && this.sealedWayIsCleared()
      ? sealedWay
      : undefined;
  }

  private tryClearSealedWay(): void {
    if (this.sealedWayIsCleared()) {
      this.prompt?.setText('Opened Way: the first gate remembers your etch.');
      return;
    }

    if (!this.staffIsCharged()) {
      this.prompt?.setText('The Staff has not found the right charge yet.');
      return;
    }

    this.registry.set(
      'worldState',
      clearBlocker(this.getWorldState(), 'sealed-way')
    );

    this.scene.restart({
      spawnTile: this.playerTile,
      facing: this.facing
    });
  }

  private staffIsCharged(): boolean {
    const state = this.getArtifactEtchings().staff;

    return Boolean(state && meetsChargedStaffRequirement(state));
  }

  private sealedWayIsCleared(): boolean {
    return isBlockerCleared(this.getWorldState(), 'sealed-way');
  }

  private flowIsUnlocked(): boolean {
    return isSigilUnlocked(this.getWorldState(), 'flow');
  }

  private unlockFlow(): void {
    this.registry.set('worldState', unlockSigil(this.getWorldState(), 'flow'));

    this.scene.restart({
      spawnTile: this.playerTile,
      facing: this.facing
    });
  }

  private obtainArtifactFromPlinth(artifactId: ArtifactId): void {
    if (this.artifactIsObtained(artifactId)) {
      this.prompt?.setText(
        `${getArtifactDefinition(artifactId).name} is already in your hands. Press X to etch.`
      );
      return;
    }

    this.registry.set('worldState', obtainArtifact(this.getWorldState(), artifactId));
    this.ensureEtchingExists(artifactId);
    this.updateArtifactHud();
    this.prompt?.setText(
      `${getArtifactDefinition(artifactId).name} obtained. Press X to etch anywhere.`
    );

    this.scene.restart({
      spawnTile: this.playerTile,
      facing: this.facing
    });
  }

  private openEquippedArtifact(): void {
    const equippedArtifact = this.getWorldState().equippedArtifact;

    if (!equippedArtifact) {
      this.prompt?.setText('No artifact is equipped yet. Find one on the island.');
      return;
    }

    this.ensureEtchingExists(equippedArtifact);
    this.scene.start('EtchingScene', {
      artifactId: equippedArtifact,
      returnTile: this.playerTile,
      returnFacing: this.facing
    });
  }

  private ensureEtchingExists(artifactId: ArtifactId): void {
    if (this.getArtifactEtchings()[artifactId]) {
      return;
    }

    this.registry.set('artifactEtchings', {
      ...this.getArtifactEtchings(),
      [artifactId]: createBlankEtching(getArtifactDefinition(artifactId))
    });
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

  private artifactIsObtained(artifactId: ArtifactId): boolean {
    return isArtifactObtained(this.getWorldState(), artifactId);
  }

  private getArtifactEtchings(): ArtifactEtchings {
    return (this.registry.get('artifactEtchings') as ArtifactEtchings | undefined) ?? {};
  }

  private updateArtifactHud(): void {
    if (!this.artifactText) {
      return;
    }

    const worldState = this.getWorldState();

    if (!worldState.equippedArtifact) {
      this.artifactText.setText('Artifact: none   E/Space: interact');
      return;
    }

    const artifactName = getArtifactDefinition(worldState.equippedArtifact).name;
    const cycleText =
      worldState.obtainedArtifacts.length > 1 ? 'Tab: switch' : 'Tab: no swap yet';

    this.artifactText.setText(`Artifact: ${artifactName}   X: etch   ${cycleText}`);
  }

  private updatePlayerFacing(): void {
    if (!this.player) {
      return;
    }

    const rotations: Record<Direction, number> = {
      up: 0,
      right: Math.PI / 2,
      down: Math.PI,
      left: -Math.PI / 2
    };

    this.player.setRotation(rotations[this.facing]);
  }

  private defaultPrompt(): string {
    return 'Move one tile with arrows or WASD. Face objects, then press E or Space.';
  }
}
