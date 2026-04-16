import Phaser from 'phaser';

export class TitleScene extends Phaser.Scene {
  constructor() {
    super('TitleScene');
  }

  create(): void {
    const { width, height } = this.scale;

    this.add
      .text(width / 2, height / 2 - 72, 'Sigiled Throne', {
        color: '#f2f0df',
        fontFamily: 'Georgia, serif',
        fontSize: '52px'
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height / 2 - 8, 'Etch the tool. Open the island.', {
        color: '#c9d6a3',
        fontSize: '20px'
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height / 2 + 68, 'Press Enter, Space, or click to begin.', {
        color: '#9fb8a6',
        fontSize: '18px'
      })
      .setOrigin(0.5);

    this.input.keyboard?.once('keydown-ENTER', this.startOverworld, this);
    this.input.keyboard?.once('keydown-SPACE', this.startOverworld, this);
    this.input.once('pointerdown', this.startOverworld, this);
  }

  private startOverworld(): void {
    this.scene.start('OverworldScene');
  }
}
