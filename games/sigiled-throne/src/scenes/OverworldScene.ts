import Phaser from 'phaser';
import { getArtifactDefinition } from '../core/artifacts';
import {
  createBlankEtching,
  type ArtifactId
} from '../core/etching';
import {
  canEnterTile,
  getExitAt,
  getInteractableAt,
  getSpawnById,
  gameViewportWidth,
  tileInDirection,
  tileSize,
  tileToPixel,
  type Direction,
  type GridExit,
  type GridInteractable,
  type InspectableInteractable,
  type InteractableId,
  type RoomId,
  type TileCoord,
  type WorldInteractionId
} from '../core/gridNavigation';
import type { ArtifactEtchings } from '../core/requirements';
import {
  clearSaveData,
  createSaveData,
  loadSaveData,
  saveGameData
} from '../core/saveData';
import {
  describeUnmetWorldRequirements,
  evaluateWorldRequirement,
  resolveWorldInteraction,
  worldInteractions
} from '../core/worldInteractions';
import {
  createInitialWorldState,
  cycleEquippedArtifact,
  isArtifactObtained,
  isBlockerCleared,
  isSigilUnlocked,
  setPlayerLocation,
  type WorldState
} from '../core/worldState';
import {
  getRoomSpawn,
  getWorldRoom,
  startingLocation,
  type RoomDefinition
} from '../core/worldRooms';

const stepDurationMs = 145;

type OverworldSceneData = {
  roomId?: RoomId;
  spawnTile?: TileCoord;
  facing?: Direction;
  fromEtching?: boolean;
  fromRoomTransition?: boolean;
  skipInitialSave?: boolean;
  message?: string;
};

export class OverworldScene extends Phaser.Scene {
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private keys?: Record<'up' | 'left' | 'down' | 'right', Phaser.Input.Keyboard.Key>;
  private interactKey?: Phaser.Input.Keyboard.Key;
  private etchKey?: Phaser.Input.Keyboard.Key;
  private cycleKey?: Phaser.Input.Keyboard.Key;
  private resetSaveKey?: Phaser.Input.Keyboard.Key;
  private debugKey?: Phaser.Input.Keyboard.Key;
  private player?: Phaser.GameObjects.Sprite;
  private prompt?: Phaser.GameObjects.Text;
  private artifactText?: Phaser.GameObjects.Text;
  private debugText?: Phaser.GameObjects.Text;
  private interactionPanel?: Phaser.GameObjects.Container;
  private interactionPanelTarget?: InteractableId;
  private currentRoomId: RoomId = startingLocation.roomId;
  private playerTile: TileCoord = { ...startingLocation.tile };
  private facing: Direction = startingLocation.facing;
  private isMoving = false;

  constructor() {
    super('OverworldScene');
  }

  create(data: OverworldSceneData = {}): void {
    this.resetTransientSceneState();
    this.loadSavedGame();

    const worldState = this.getWorldState();
    this.currentRoomId = data.roomId ?? worldState.currentRoomId;
    this.playerTile = data.spawnTile ?? worldState.playerTile;
    this.facing = data.facing ?? worldState.facing;

    if (!data.skipInitialSave) {
      this.persistLocation();
    }

    const room = this.currentRoom();
    const worldWidth = room.width * tileSize;
    const worldHeight = room.height * tileSize;

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
    this.resetSaveKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.R);
    this.debugKey = this.input.keyboard?.addKey(
      Phaser.Input.Keyboard.KeyCodes.BACKTICK
    );

    this.prompt = this.add
      .text(16, 16, this.defaultPrompt(), {
        backgroundColor: '#151713',
        color: '#f2f0df',
        fontSize: '16px',
        padding: { x: 10, y: 8 },
        wordWrap: { width: gameViewportWidth - 32 }
      })
      .setScrollFactor(0);

    this.artifactText = this.add
      .text(16, 56, '', {
        backgroundColor: '#151713',
        color: '#c9d6a3',
        fontSize: '15px',
        padding: { x: 10, y: 8 },
        wordWrap: { width: gameViewportWidth - 32 }
      })
      .setScrollFactor(0);

    this.updateArtifactHud();
    this.updatePrompt();
    this.syncDebugOverlay();

    if (data.message) {
      this.prompt.setText(data.message);
    } else if (data.fromEtching) {
      this.prompt.setText('Returned from etching. The island waits.');
    }

    if (data.fromRoomTransition) {
      this.cameras.main.fadeIn(160, 0, 0, 0);
    }
  }

  update(): void {
    this.checkDebugOverlayToggle();
    this.updateDebugOverlay();

    if (this.isMoving) {
      return;
    }

    if (this.checkDevelopmentReset()) {
      return;
    }

    this.checkArtifactControls();
    this.checkInteractions();
    this.checkMovement();
  }

  private checkDevelopmentReset(): boolean {
    if (
      !this.resetSaveKey ||
      !Phaser.Input.Keyboard.JustDown(this.resetSaveKey)
    ) {
      return false;
    }

    this.resetGameState();
    return true;
  }

  private checkDebugOverlayToggle(): void {
    if (!this.debugKey || !Phaser.Input.Keyboard.JustDown(this.debugKey)) {
      return;
    }

    this.registry.set('debugOverlayVisible', !this.debugOverlayIsVisible());
    this.syncDebugOverlay();
  }

  private checkArtifactControls(): void {
    if (
      this.cycleKey &&
      Phaser.Input.Keyboard.JustDown(this.cycleKey) &&
      this.getWorldState().obtainedArtifacts.length > 1
    ) {
      this.hideInteractionPanel();
      this.registry.set('worldState', cycleEquippedArtifact(this.getWorldState()));
      this.saveGame();
      this.updateArtifactHud();
      this.updatePrompt();
    }

    if (this.etchKey && Phaser.Input.Keyboard.JustDown(this.etchKey)) {
      this.hideInteractionPanel();
      this.openEquippedArtifact();
    }
  }

  private checkMovement(): void {
    if (!this.player) {
      return;
    }

    const direction = this.getHeldDirection();

    if (!direction) {
      return;
    }

    this.facing = direction;
    this.updatePlayerFacing();

    const targetTile = tileInDirection(this.playerTile, direction);

    if (!canEnterTile(this.currentRoom(), targetTile, this.activeInteractables())) {
      this.updatePrompt();
      return;
    }

    this.hideInteractionPanel();
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

    if (this.interactionPanelTarget !== interactable?.id) {
      this.hideInteractionPanel();
    }

    if (!interactable) {
      return;
    }

    if (interactable.type === 'inspectable') {
      this.showInspectionPanel(interactable);
      return;
    }

    this.resolveInteraction(interactable.id);
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
      this.persistLocation();

        const exit = getExitAt(this.currentRoom().exits, targetTile);

        if (exit) {
          this.transitionToRoom(exit);
          return;
        }

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

  private transitionToRoom(exit: GridExit): void {
    const destinationRoom = getWorldRoom(exit.toRoomId);
    const spawn =
      getSpawnById(destinationRoom.spawns, exit.spawnId) ??
      getRoomSpawn(destinationRoom);

    if (!spawn) {
      this.prompt?.setText(`${exit.label}: the destination has no valid spawn.`);
      this.isMoving = false;
      return;
    }

    this.isMoving = true;
    this.prompt?.setText(`${exit.label}: crossing the threshold.`);
    const finishTransition = this.onceOnly(() => {
      this.currentRoomId = exit.toRoomId;
      this.playerTile = spawn.tile;
      this.facing = exit.facing ?? spawn.facing;
      this.persistLocation();
      this.isMoving = false;
      this.scene.restart({
        roomId: exit.toRoomId,
        spawnTile: spawn.tile,
        facing: exit.facing ?? spawn.facing,
        fromRoomTransition: true,
        message: destinationRoom.label
      });
    });

    this.cameras.main.fadeOut(160, 0, 0, 0);
    this.cameras.main.once(
      Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE,
      finishTransition
    );
    this.time.delayedCall(220, finishTransition);
  }

  private drawMap(): void {
    const graphics = this.add.graphics();
    const room = this.currentRoom();
    const worldWidth = room.width * tileSize;
    const worldHeight = room.height * tileSize;

    graphics.fillStyle(room.theme === 'interior' ? 0x2b2a28 : 0x426b5f, 1);
    graphics.fillRect(0, 0, worldWidth, worldHeight);

    for (let y = 0; y < room.height; y += 1) {
      for (let x = 0; x < room.width; x += 1) {
        const blocked = !canEnterTile(room, { x, y }, []);
        const floorColor = room.theme === 'interior' ? 0x5b4d52 : 0x82945b;
        const wallColor = room.theme === 'interior' ? 0x2b2a28 : 0x426b5f;
        const lineColor = room.theme === 'interior' ? 0x756466 : 0x6f8054;

        graphics.fillStyle(blocked ? wallColor : floorColor, 1);
        graphics.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
        graphics.lineStyle(1, lineColor, 0.24);
        graphics.strokeRect(x * tileSize, y * tileSize, tileSize, tileSize);
      }
    }

    this.drawRoomDetails(room);

    for (const interactable of this.visibleInteractables()) {
      this.drawInteractable(interactable);
    }

    this.drawExits(room);
  }

  private drawRoomDetails(room: RoomDefinition): void {
    if (room.id !== 'throne-antechamber') {
      return;
    }

    const graphics = this.add.graphics();
    const thronePixel = tileToPixel({ x: 8, y: 3 });

    graphics.fillStyle(0x151713, 0.45);
    graphics.fillEllipse(thronePixel.x, thronePixel.y + 32, 128, 38);
    graphics.fillStyle(0x8c7b50, 1);
    graphics.fillRoundedRect(thronePixel.x - 34, thronePixel.y - 14, 68, 38, 8);
    graphics.fillStyle(0x3d3940, 1);
    graphics.fillRoundedRect(thronePixel.x - 24, thronePixel.y - 34, 48, 44, 6);
    graphics.lineStyle(3, 0xc7bd83, 0.8);
    graphics.strokeRoundedRect(thronePixel.x - 24, thronePixel.y - 34, 48, 44, 6);

    this.add
      .text(thronePixel.x, thronePixel.y + 62, 'The Throne waits.', {
        color: '#f2f0df',
        fontSize: '15px'
      })
      .setOrigin(0.5);
  }

  private drawInteractable(interactable: GridInteractable): void {
    if (interactable.type === 'inspectable') {
      this.drawInspectable(interactable);
      return;
    }

    switch (interactable.id) {
      case 'staff-plinth':
        this.drawStaffPlinth(interactable.tile);
        return;
      case 'sealed-way':
        this.drawSealedWay(interactable.tile);
        return;
      case 'weave-shrine':
        this.drawWeaveShrine(interactable.tile);
        return;
      case 'tablet-plinth':
        this.drawTabletPlinth(interactable.tile);
        return;
      case 'tablet-gate':
        this.drawTabletGate(interactable.tile);
        return;
    }
  }

  private drawInspectable(interactable: InspectableInteractable): void {
    const pixel = tileToPixel(interactable.tile);
    const graphics = this.add.graphics();

    graphics.fillStyle(0x4f5f4c, 1);
    graphics.fillRoundedRect(pixel.x - 16, pixel.y - 18, 32, 36, 6);
    graphics.lineStyle(2, 0xc7bd83, 0.85);
    graphics.strokeRoundedRect(pixel.x - 14, pixel.y - 16, 28, 32, 4);
    graphics.lineStyle(2, 0xf2f0df, 0.75);
    graphics.lineBetween(pixel.x - 8, pixel.y - 6, pixel.x + 8, pixel.y - 6);
    graphics.lineBetween(pixel.x - 8, pixel.y + 1, pixel.x + 8, pixel.y + 1);
    graphics.lineBetween(pixel.x - 8, pixel.y + 8, pixel.x + 4, pixel.y + 8);

    this.add
      .text(pixel.x, pixel.y + 34, interactable.label, {
        color: '#f2f0df',
        fontSize: '14px'
      })
      .setOrigin(0.5);
  }

  private drawExits(room: RoomDefinition): void {
    for (const exit of room.exits) {
      const pixel = tileToPixel(exit.tile);

      this.add
        .text(pixel.x, pixel.y + 22, exit.label, {
          color: '#f2f0df',
          fontSize: '13px'
        })
        .setOrigin(0.5);
    }
  }

  private drawStaffPlinth(tile: TileCoord): void {
    const pixel = tileToPixel(tile);
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

  private drawTabletPlinth(tile: TileCoord): void {
    if (!this.sealedWayIsCleared()) {
      return;
    }

    const pixel = tileToPixel(tile);
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

  private drawTabletGate(tile: TileCoord): void {
    if (!this.sealedWayIsCleared()) {
      return;
    }

    const pixel = tileToPixel(tile);
    const graphics = this.add.graphics();

    if (this.tabletGateIsCleared()) {
      graphics.fillStyle(0x426b5f, 1);
      graphics.fillRoundedRect(pixel.x - 25, pixel.y - 22, 50, 44, 8);
      graphics.fillStyle(0x66c9d2, 1);
      graphics.fillRoundedRect(pixel.x - 19, pixel.y - 6, 38, 12, 8);
    } else {
      graphics.fillStyle(0x4f5f8b, 1);
      graphics.fillRoundedRect(pixel.x - 22, pixel.y - 22, 44, 44, 8);
    }

    this.add
      .text(
        pixel.x,
        pixel.y + 34,
        this.tabletGateIsCleared() ? 'Opened Gate' : 'Tablet Gate',
        {
          color: '#f2f0df',
          fontSize: '14px'
        }
      )
      .setOrigin(0.5);
  }

  private drawSealedWay(tile: TileCoord): void {
    const pixel = tileToPixel(tile);
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

  private drawWeaveShrine(tile: TileCoord): void {
    if (!this.sealedWayIsCleared() || this.advancedSigilsAreUnlocked()) {
      return;
    }

    const pixel = tileToPixel(tile);
    const graphics = this.add.graphics();

    graphics.fillStyle(0x66c9d2, 1);
    graphics.fillCircle(pixel.x, pixel.y, 19);
    graphics.lineStyle(3, 0xf2f0df, 0.9);
    graphics.strokeCircle(pixel.x, pixel.y, 18);
    graphics.lineBetween(pixel.x - 14, pixel.y, pixel.x + 14, pixel.y);

    this.add
      .text(pixel.x, pixel.y + 34, 'Weave Shrine', {
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

    if (interactable?.type === 'inspectable') {
      this.prompt.setText(
        `${interactable.label}: press E or Space to inspect.`
      );
      return;
    }

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
            : this.interactionIsReady('sealed-way')
              ? 'Sealed Way: the charged Staff answers. Press E or Space to clear it.'
              : 'Sealed Way: press E or Space to inspect its requirements.'
        );
        return;
      case 'weave-shrine':
        this.prompt.setText(
          'Weave Shrine: press E or Space to awaken Thread, Diffuse, and Well.'
        );
        return;
      case 'tablet-plinth':
        this.prompt.setText(
          this.artifactIsObtained('tablet')
            ? 'Tablet Plinth: the Tablet is already yours. Press Tab to cycle artifacts.'
            : 'Tablet Plinth: press E or Space to take the Tablet.'
        );
        return;
      case 'tablet-gate':
        this.prompt.setText(
          this.tabletGateIsCleared()
            ? 'Opened Gate: the Tablet has made a way.'
            : this.interactionIsReady('tablet-gate')
              ? 'Tablet Gate: the Tablet answers. Press E or Space to clear it.'
              : 'Tablet Gate: press E or Space to inspect its requirements.'
        );
        return;
    }

    const exit = this.facingExit();

    if (exit) {
      this.prompt.setText(`${exit.label}: walk forward to enter.`);
      return;
    }

    this.prompt.setText(this.defaultPrompt());
  }

  private activeInteractables(): GridInteractable[] {
    return this.visibleInteractables().filter((interactable) => {
      if (interactable.id === 'sealed-way') {
        return !this.sealedWayIsCleared();
      }

      if (interactable.id === 'tablet-plinth') {
        return !this.artifactIsObtained('tablet');
      }

      if (interactable.id === 'tablet-gate') {
        return !this.tabletGateIsCleared();
      }

      if (interactable.id === 'staff-plinth') {
        return !this.artifactIsObtained('staff');
      }

      return true;
    });
  }

  private visibleInteractables(): GridInteractable[] {
    return this.currentRoom().interactables.filter((interactable) => {
      if (interactable.id === 'weave-shrine') {
        return this.sealedWayIsCleared() && !this.advancedSigilsAreUnlocked();
      }

      if (interactable.id === 'tablet-plinth') {
        return this.sealedWayIsCleared();
      }

      if (interactable.id === 'tablet-gate') {
        return this.sealedWayIsCleared();
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

    return getInteractableAt(this.visibleInteractables(), frontTile);
  }

  private facingExit(): GridExit | undefined {
    return getExitAt(
      this.currentRoom().exits,
      tileInDirection(this.playerTile, this.facing)
    );
  }

  private resolveInteraction(interactableId: WorldInteractionId): void {
    this.persistLocation();

    if (interactableId === 'staff-plinth' && this.artifactIsObtained('staff')) {
      this.prompt?.setText('Staff Plinth: the Staff is already yours. Press X to etch it.');
      return;
    }

    if (interactableId === 'tablet-plinth' && this.artifactIsObtained('tablet')) {
      this.prompt?.setText('Tablet Plinth: the Tablet is already yours.');
      return;
    }

    if (interactableId === 'sealed-way' && this.sealedWayIsCleared()) {
      this.prompt?.setText('Opened Way: the first gate remembers your etch.');
      return;
    }

    if (interactableId === 'tablet-gate' && this.tabletGateIsCleared()) {
      this.prompt?.setText('Opened Gate: the Tablet has made a way.');
      return;
    }

    const result = resolveWorldInteraction(worldInteractions[interactableId], {
      worldState: this.getWorldState(),
      artifactEtchings: this.getArtifactEtchings()
    });

    if (!result.ok) {
      this.showInteractionNeeds(interactableId);
      this.prompt?.setText(result.message);
      return;
    }

    this.hideInteractionPanel();
    this.playInteractionEffect(interactableId, () => {
      this.completeInteraction(result.worldState, result.message);
    });
  }

  private completeInteraction(worldState: WorldState, message: string): void {
    this.registry.set('worldState', worldState);

    for (const artifactId of worldState.obtainedArtifacts) {
      this.ensureEtchingExists(artifactId);
    }

    this.saveGame();

    this.scene.restart({
      roomId: this.currentRoomId,
      spawnTile: this.playerTile,
      facing: this.facing,
      message
    });
  }

  private resetGameState(): void {
    this.hideInteractionPanel();

    const storage = this.getBrowserStorage();

    if (storage) {
      try {
        clearSaveData(storage);
      } catch {
        this.prompt?.setText('Development reset could not clear browser storage.');
        return;
      }
    }

    const initialState = createInitialWorldState();
    this.registry.set('worldState', initialState);
    this.registry.set('artifactEtchings', {});
    this.registry.set('saveLoaded', true);
    this.currentRoomId = initialState.currentRoomId;
    this.playerTile = initialState.playerTile;
    this.facing = initialState.facing;

    this.scene.restart({
      roomId: initialState.currentRoomId,
      spawnTile: initialState.playerTile,
      facing: initialState.facing,
      skipInitialSave: true,
      message: 'Development reset: save data cleared.'
    });
  }

  private showInteractionNeeds(interactableId: WorldInteractionId): void {
    const interaction = worldInteractions[interactableId];
    const unmetRequirements = describeUnmetWorldRequirements(
      interaction,
      this.worldInteractionContext()
    );

    if (unmetRequirements.length === 0) {
      this.hideInteractionPanel();
      return;
    }

    this.showInteractionPanel(
      this.interactableName(interactableId),
      unmetRequirements,
      this.interactionHint(unmetRequirements)
    );
  }

  private showInspectionPanel(interactable: InspectableInteractable): void {
    this.persistLocation();
    this.hideInteractionPanel();

    const width = 440;
    const height = 86 + interactable.text.length * 44;
    const panel = this.add.container(16, 104);
    const background = this.add.graphics();

    background.fillStyle(0x151713, 0.94);
    background.fillRoundedRect(0, 0, width, height, 8);
    background.lineStyle(2, 0xc7bd83, 0.88);
    background.strokeRoundedRect(0, 0, width, height, 8);

    const titleText = this.add.text(16, 12, interactable.label, {
      color: '#f2f0df',
      fontSize: '18px',
      fontStyle: 'bold'
    });
    const bodyText = this.add.text(16, 44, interactable.text.join('\n\n'), {
      color: '#f2f0df',
      fontSize: '15px',
      lineSpacing: 8,
      wordWrap: { width: width - 32 }
    });

    panel.add([background, titleText, bodyText]);
    panel.setScrollFactor(0);
    panel.setDepth(50);
    this.interactionPanel = panel;
    this.interactionPanelTarget = interactable.id;
    this.prompt?.setText(`${interactable.label}: the island keeps its counsel.`);
  }

  private showInteractionPanel(
    title: string,
    requirements: string[],
    hint?: string
  ): void {
    this.hideInteractionPanel();

    const width = 440;
    const height = 82 + requirements.length * 25 + (hint ? 34 : 0);
    const panel = this.add.container(16, 104);
    const background = this.add.graphics();

    background.fillStyle(0x151713, 0.94);
    background.fillRoundedRect(0, 0, width, height, 8);
    background.lineStyle(2, 0xc7bd83, 0.88);
    background.strokeRoundedRect(0, 0, width, height, 8);

    const titleText = this.add.text(16, 12, title, {
      color: '#f2f0df',
      fontSize: '18px',
      fontStyle: 'bold'
    });
    const introText = this.add.text(16, 40, 'Needed:', {
      color: '#c9d6a3',
      fontSize: '15px'
    });
    const requirementText = this.add.text(
      16,
      64,
      requirements.map((entry) => `- ${entry}`).join('\n'),
      {
        color: '#f2f0df',
        fontSize: '14px',
        lineSpacing: 6,
        wordWrap: { width: width - 32 }
      }
    );

    panel.add([background, titleText, introText, requirementText]);

    if (hint) {
      panel.add(
        this.add.text(16, height - 26, hint, {
          color: '#9fb8a6',
          fontSize: '14px',
          wordWrap: { width: width - 32 }
        })
      );
    }

    panel.setScrollFactor(0);
    panel.setDepth(50);
    this.interactionPanel = panel;
    this.interactionPanelTarget = this.facingInteractable()?.id;
  }

  private hideInteractionPanel(): void {
    this.interactionPanel?.destroy(true);
    this.interactionPanel = undefined;
    this.interactionPanelTarget = undefined;
  }

  private syncDebugOverlay(): void {
    if (this.debugOverlayIsVisible()) {
      this.showDebugOverlay();
      return;
    }

    this.hideDebugOverlay();
  }

  private showDebugOverlay(): void {
    if (this.debugText) {
      this.updateDebugOverlay();
      return;
    }

    this.debugText = this.add
      .text(gameViewportWidth - 318, 104, '', {
        backgroundColor: '#151713',
        color: '#f2f0df',
        fontSize: '13px',
        lineSpacing: 4,
        padding: { x: 10, y: 8 }
      })
      .setScrollFactor(0)
      .setDepth(100);
    this.updateDebugOverlay();
  }

  private hideDebugOverlay(): void {
    this.debugText?.destroy();
    this.debugText = undefined;
  }

  private updateDebugOverlay(): void {
    if (!this.debugText) {
      return;
    }

    const worldState = this.getWorldState();
    const room = this.currentRoom();
    const frontTile = tileInDirection(this.playerTile, this.facing);
    const activeInteractable = getInteractableAt(
      this.activeInteractables(),
      frontTile
    );
    const visibleInteractable = getInteractableAt(
      this.visibleInteractables(),
      frontTile
    );
    const exit = getExitAt(room.exits, frontTile);
    const canEnterFront = canEnterTile(
      room,
      frontTile,
      this.activeInteractables()
    );
    const saveState = this.browserSaveState();

    this.debugText.setText(
      [
        'DEBUG',
        `room: ${room.id} (${room.label})`,
        `theme: ${room.theme}  size: ${room.width}x${room.height}`,
        `tile: ${this.playerTile.x},${this.playerTile.y}  facing: ${this.facing}`,
        `front: ${frontTile.x},${frontTile.y}  enter: ${canEnterFront ? 'yes' : 'no'}`,
        `front object: ${this.debugInteractableText(
          activeInteractable,
          visibleInteractable
        )}`,
        `front exit: ${exit ? `${exit.id} -> ${exit.toRoomId}` : 'none'}`,
        `equipped: ${worldState.equippedArtifact ?? 'none'}`,
        `obtained: ${listOrNone(worldState.obtainedArtifacts)}`,
        `sigils: ${listOrNone(worldState.unlockedSigils)}`,
        `cleared: ${listOrNone(worldState.clearedBlockers)}`,
        `save: ${saveState}`,
        'Backtick: hide  R: reset save'
      ].join('\n')
    );
  }

  private debugInteractableText(
    activeInteractable: GridInteractable | undefined,
    visibleInteractable: GridInteractable | undefined
  ): string {
    if (activeInteractable) {
      return `${activeInteractable.id} [${activeInteractable.type}] (active)`;
    }

    if (visibleInteractable) {
      return `${visibleInteractable.id} [${visibleInteractable.type}] (inactive)`;
    }

    return 'none';
  }

  private browserSaveState(): string {
    const storage = this.getBrowserStorage();

    if (!storage) {
      return 'unavailable';
    }

    try {
      return storage.getItem('sigiled-throne-save-v1') ? 'present' : 'empty';
    } catch {
      return 'blocked';
    }
  }

  private debugOverlayIsVisible(): boolean {
    return Boolean(this.registry.get('debugOverlayVisible'));
  }

  private interactionHint(requirements: string[]): string | undefined {
    if (requirements.some((entry) => entry.includes('Staff is obtained'))) {
      return 'Find the Staff on its plinth.';
    }

    if (requirements.some((entry) => entry.startsWith('Staff:'))) {
      return 'Press X to etch the Staff.';
    }

    if (requirements.some((entry) => entry.includes('Tablet is obtained'))) {
      return 'Find the Tablet beyond the first gate.';
    }

    if (requirements.some((entry) => entry.startsWith('Tablet:'))) {
      return 'Press Tab to equip the Tablet, then press X to etch it.';
    }

    return undefined;
  }

  private interactableName(interactableId: InteractableId): string {
    return (
      this.currentRoom().interactables.find((entry) => entry.id === interactableId)
        ?.label ?? interactableId
    );
  }

  private playInteractionEffect(
    interactableId: WorldInteractionId,
    onComplete: () => void
  ): void {
    const interactable = this.currentRoom().interactables.find(
      (entry) => entry.id === interactableId
    );

    if (!interactable) {
      onComplete();
      return;
    }

    this.isMoving = true;

    if (interactableId === 'sealed-way' || interactableId === 'tablet-gate') {
      this.playGateOpeningEffect(interactable.tile, onComplete);
      return;
    }

    this.playPulseEffect(interactable.tile, onComplete);
  }

  private playGateOpeningEffect(tile: TileCoord, onComplete: () => void): void {
    const pixel = tileToPixel(tile);
    const gate = this.add.rectangle(pixel.x, pixel.y, 44, 44, 0xf2f0df, 0.78);
    const slit = this.add.rectangle(pixel.x, pixel.y, 8, 48, 0x151713, 0.72);
    const finishEffect = this.onceOnly(() => {
      slit.destroy();
      gate.destroy();
      this.isMoving = false;
      onComplete();
    });

    gate.setDepth(10);
    slit.setDepth(11);
    this.prompt?.setText('The geometry takes hold.');

    this.tweens.add({
      targets: gate,
      scaleX: 0.18,
      alpha: 0,
      duration: 420,
      ease: 'Cubic.easeIn',
      onComplete: finishEffect
    });

    this.tweens.add({
      targets: slit,
      scaleX: 5.2,
      alpha: 0,
      duration: 360,
      ease: 'Cubic.easeOut'
    });
    this.time.delayedCall(500, finishEffect);
  }

  private playPulseEffect(tile: TileCoord, onComplete: () => void): void {
    const pixel = tileToPixel(tile);
    const pulse = this.add.circle(pixel.x, pixel.y, 18, 0xf2f0df, 0.4);
    const finishEffect = this.onceOnly(() => {
      pulse.destroy();
      this.isMoving = false;
      onComplete();
    });

    pulse.setDepth(10);

    this.tweens.add({
      targets: pulse,
      scale: 2.7,
      alpha: 0,
      duration: 260,
      ease: 'Sine.easeOut',
      onComplete: finishEffect
    });
    this.time.delayedCall(330, finishEffect);
  }

  private interactionIsReady(interactableId: WorldInteractionId): boolean {
    return worldInteractions[interactableId].requirements.every((requirement) =>
      evaluateWorldRequirement(requirement, this.worldInteractionContext())
    );
  }

  private worldInteractionContext(): {
    worldState: WorldState;
    artifactEtchings: ArtifactEtchings;
  } {
    return {
      worldState: this.getWorldState(),
      artifactEtchings: this.getArtifactEtchings()
    };
  }

  private sealedWayIsCleared(): boolean {
    return isBlockerCleared(this.getWorldState(), 'sealed-way');
  }

  private tabletGateIsCleared(): boolean {
    return isBlockerCleared(this.getWorldState(), 'tablet-gate');
  }

  private advancedSigilsAreUnlocked(): boolean {
    const worldState = this.getWorldState();

    return (
      isSigilUnlocked(worldState, 'thread') &&
      isSigilUnlocked(worldState, 'diffuse') &&
      isSigilUnlocked(worldState, 'well')
    );
  }

  private openEquippedArtifact(): void {
    const equippedArtifact = this.getWorldState().equippedArtifact;

    if (!equippedArtifact) {
      this.prompt?.setText('No artifact is equipped yet. Find one on the island.');
      return;
    }

    this.persistLocation();
    this.ensureEtchingExists(equippedArtifact);
    this.saveGame();
    this.scene.start('EtchingScene', {
      artifactId: equippedArtifact,
      returnRoomId: this.currentRoomId,
      returnTile: this.playerTile,
      returnFacing: this.facing,
      focusInteractionId: this.facingWorldInteractionId()
    });
  }

  private facingWorldInteractionId(): WorldInteractionId | undefined {
    const interactable = this.facingInteractable();

    return interactable?.type === 'world-interaction' ? interactable.id : undefined;
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

  private resetTransientSceneState(): void {
    this.isMoving = false;
    this.player = undefined;
    this.prompt = undefined;
    this.artifactText = undefined;
    this.debugText = undefined;
    this.interactionPanel = undefined;
    this.interactionPanelTarget = undefined;
  }

  private onceOnly(callback: () => void): () => void {
    let called = false;

    return () => {
      if (called) {
        return;
      }

      called = true;
      callback();
    };
  }

  private currentRoom(): RoomDefinition {
    return getWorldRoom(this.currentRoomId);
  }

  private persistLocation(): void {
    this.registry.set(
      'worldState',
      setPlayerLocation(
        this.getWorldState(),
        this.currentRoomId,
        this.playerTile,
        this.facing
      )
    );
    this.saveGame();
  }

  private loadSavedGame(): void {
    if (this.registry.get('saveLoaded')) {
      return;
    }

    this.registry.set('saveLoaded', true);

    const storage = this.getBrowserStorage();

    if (!storage) {
      return;
    }

    let saveData;

    try {
      saveData = loadSaveData(storage);
    } catch {
      return;
    }

    if (!saveData) {
      return;
    }

    this.registry.set('worldState', saveData.worldState);
    this.registry.set('artifactEtchings', saveData.artifactEtchings);
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
      this.prompt?.setText('The island could not save this change.');
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

  private updateArtifactHud(): void {
    if (!this.artifactText) {
      return;
    }

    const worldState = this.getWorldState();

    if (!worldState.equippedArtifact) {
      this.artifactText.setText(
        'Artifact: none   E/Space: interact   R: reset save   Backtick: debug'
      );
      return;
    }

    const artifactName = getArtifactDefinition(worldState.equippedArtifact).name;
    const cycleText =
      worldState.obtainedArtifacts.length > 1 ? 'Tab: switch' : 'Tab: no swap yet';

    this.artifactText.setText(
      `Artifact: ${artifactName}   X: etch   ${cycleText}   R: reset save   Backtick: debug`
    );
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
    return 'Move: arrows/WASD. Face objects, then press E or Space.';
  }
}

function listOrNone(entries: string[]): string {
  return entries.length > 0 ? entries.join(', ') : 'none';
}
