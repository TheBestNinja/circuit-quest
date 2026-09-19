import Phaser from 'phaser';
import { BootScene } from './game/scenes/BootScene';
import { TitleScene } from './game/scenes/TitleScene';
import { HubScene } from './game/scenes/HubScene';
import { BattleScene } from './game/scenes/BattleScene';
import { initFirebase, wireAuthOverlay } from './systems/FirebaseService';
import { Progress } from './systems/Progression';

initFirebase();
wireAuthOverlay();
Progress.load();

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  backgroundColor: '#0a0e1a',
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: window.innerWidth,
    height: window.innerHeight,
  },
  scene: [BootScene, TitleScene, HubScene, BattleScene],
  audio: {
    disableWebAudio: false,
  },
  render: {
    antialias: true,
    pixelArt: false,
  },
};

// eslint-disable-next-line no-new
new Phaser.Game(config);
