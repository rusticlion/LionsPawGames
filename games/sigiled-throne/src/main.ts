import Phaser from 'phaser';
import './style.css';
import { BootScene } from './scenes/BootScene';
import { EtchingScene } from './scenes/EtchingScene';
import { OverworldScene } from './scenes/OverworldScene';
import { PreloadScene } from './scenes/PreloadScene';
import { TitleScene } from './scenes/TitleScene';

const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game',
  width: 960,
  height: 540,
  backgroundColor: '#151713',
  pixelArt: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  physics: {
    default: 'arcade',
    arcade: {
      debug: false
    }
  },
  scene: [BootScene, PreloadScene, TitleScene, OverworldScene, EtchingScene]
};

new Phaser.Game(gameConfig);
