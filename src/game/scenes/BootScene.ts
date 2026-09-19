import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload(): void {
    const { width, height } = this.scale;
    this.add.rectangle(width / 2, height / 2, 320, 18, 0x1a2a40);
    const bar = this.add.rectangle(width / 2 - 158, height / 2, 4, 12, 0x5ce1ff).setOrigin(0, 0.5);
    this.add
      .text(width / 2, height / 2 - 40, 'CIRCUIT QUEST', {
        fontFamily: 'system-ui',
        fontSize: '28px',
        color: '#5ce1ff',
      })
      .setOrigin(0.5);
    this.add
      .text(width / 2, height / 2 + 36, 'Loading systems…', {
        fontFamily: 'system-ui',
        fontSize: '14px',
        color: '#9bb4d0',
      })
      .setOrigin(0.5);

    this.load.on('progress', (p: number) => {
      bar.width = Math.max(4, 316 * p);
    });

    this.load.image('bg_purple', 'assets/backgrounds/purple.png');
    this.load.image('bg_dark', 'assets/backgrounds/darkPurple.png');
    this.load.image('bg_blue', 'assets/backgrounds/blue.png');
    this.load.image('bg_black', 'assets/backgrounds/black.png');

    this.load.image('ship_blue', 'assets/ships/playerShip1_blue.png');
    this.load.image('ship_orange', 'assets/ships/playerShip1_orange.png');
    this.load.image('ship_green', 'assets/ships/playerShip2_green.png');
    this.load.image('ship_red', 'assets/ships/playerShip3_red.png');

    this.load.image('enemy1', 'assets/enemies/enemyRed1.png');
    this.load.image('enemy2', 'assets/enemies/enemyBlack2.png');
    this.load.image('enemy3', 'assets/enemies/enemyGreen3.png');
    this.load.image('enemy4', 'assets/enemies/enemyBlue4.png');

    this.load.image('laser_blue', 'assets/lasers/laserBlue01.png');
    this.load.image('laser_green', 'assets/lasers/laserGreen01.png');
    this.load.image('laser_red', 'assets/lasers/laserRed01.png');
    this.load.image('laser_purple', 'assets/lasers/laserRed05.png');

    this.load.image('pill_blue', 'assets/powerups/pill_blue.png');
    this.load.image('pill_green', 'assets/powerups/pill_green.png');
    this.load.image('star_gold', 'assets/powerups/star_gold.png');
    this.load.image('shield_bronze', 'assets/powerups/shield_bronze.png');

    this.load.image('fire0', 'assets/effects/fire00.png');
    this.load.image('fire3', 'assets/effects/fire03.png');

    this.load.audio('sfx_laser', 'assets/sfx/sfx_laser1.ogg');
    this.load.audio('sfx_zap', 'assets/sfx/sfx_zap.ogg');
    this.load.audio('sfx_shield', 'assets/sfx/sfx_shieldUp.ogg');
    this.load.audio('sfx_lose', 'assets/sfx/sfx_lose.ogg');
    this.load.audio('sfx_ok', 'assets/sfx/sfx_twoTone.ogg');
  }

  create(): void {
    const style = document.createElement('style');
    style.textContent = `
      @font-face {
        font-family: 'kenvector';
        src: url('assets/fonts/kenvector_future.ttf') format('truetype');
      }
    `;
    document.head.appendChild(style);
    this.scene.start('Title');
  }
}
