import Phaser from 'phaser';
import './style.css';
import { GameScene } from './scenes/GameScene';
import { StoryScene } from './scenes/StoryScene';
import { TitleScene } from './scenes/TitleScene';

const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'app',
  width: 560,
  height: 600,
  backgroundColor: '#12100a',
  // The first scene starts automatically.
  scene: [TitleScene, StoryScene, GameScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
};

new Phaser.Game(gameConfig);
