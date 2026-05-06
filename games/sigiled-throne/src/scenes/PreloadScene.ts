import Phaser from 'phaser';
import { sourceTileSize } from '../core/gridNavigation';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super('PreloadScene');
  }

  create(): void {
    this.createPlaceholderTextures();
    this.scene.start('TitleScene');
  }

  private createPlaceholderTextures(): void {
    const player = this.make.graphics({ x: 0, y: 0 }, false);
    player.fillStyle(0xded26a, 1);
    player.fillTriangle(8, 0, sourceTileSize, sourceTileSize, 0, sourceTileSize);
    player.lineStyle(2, 0x29291f, 1);
    player.strokeTriangle(8, 0, sourceTileSize, sourceTileSize, 0, sourceTileSize);
    player.generateTexture('player-placeholder', sourceTileSize, sourceTileSize);
    player.destroy();

    const sigil = this.make.graphics({ x: 0, y: 0 }, false);
    sigil.fillStyle(0x7fbf9b, 1);
    sigil.fillCircle(8, 8, 7);
    sigil.lineStyle(2, 0xf2f0df, 1);
    sigil.strokeCircle(8, 8, 6);
    sigil.generateTexture('sigil-placeholder', sourceTileSize, sourceTileSize);
    sigil.destroy();
  }
}
