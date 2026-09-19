import Phaser from 'phaser';
import { makeButton } from '../../ui/Button';
import { Progress, hasSave } from '../../systems/Progression';
import { showAuthOverlay, getFirebaseStatus, getCurrentUser } from '../../systems/FirebaseService';

export class TitleScene extends Phaser.Scene {
  private bg!: Phaser.GameObjects.TileSprite;

  constructor() {
    super('Title');
  }

  create(): void {
    const { width, height } = this.scale;

    this.bg = this.add.tileSprite(0, 0, width, height, 'bg_purple').setOrigin(0);
    this.add.rectangle(width / 2, height / 2, width, height, 0x050a14, 0.35);

    // Decorative ships
    const ship = this.add.image(width * 0.18, height * 0.55, 'ship_blue').setScale(0.7).setAlpha(0.9);
    this.tweens.add({
      targets: ship,
      y: ship.y - 18,
      duration: 1800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    this.add.image(width * 0.82, height * 0.42, 'enemy1').setScale(0.55).setAlpha(0.7);
    this.add.image(width * 0.78, height * 0.62, 'enemy3').setScale(0.45).setAlpha(0.55);

    this.add
      .text(width / 2, height * 0.22, 'CIRCUIT QUEST', {
        fontFamily: 'kenvector, system-ui, sans-serif',
        fontSize: Math.min(56, width * 0.07) + 'px',
        color: '#5ce1ff',
        stroke: '#0a2040',
        strokeThickness: 6,
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height * 0.22 + 52, 'Math · Gadgets · Circuits', {
        fontFamily: 'system-ui',
        fontSize: '18px',
        color: '#9bb4d0',
      })
      .setOrigin(0.5);

    const continueEnabled = hasSave();
    makeButton(this, {
      x: width / 2,
      y: height * 0.48,
      label: 'START NEW',
      width: 260,
      fill: 0x1e90ff,
      onClick: () => {
        Progress.reset();
        this.scene.start('Hub');
      },
    });

    makeButton(this, {
      x: width / 2,
      y: height * 0.48 + 64,
      label: continueEnabled ? 'CONTINUE' : 'CONTINUE (empty)',
      width: 260,
      fill: continueEnabled ? 0x2a8f5a : 0x334455,
      onClick: () => {
        if (!continueEnabled) return;
        Progress.load();
        this.scene.start('Hub');
      },
    });

    makeButton(this, {
      x: width / 2,
      y: height * 0.48 + 128,
      label: 'ACCOUNT',
      width: 260,
      fill: 0x3a4a6a,
      onClick: () => showAuthOverlay(),
    });

    const status = getFirebaseStatus();
    const user = getCurrentUser();
    const statusText =
      status === 'unconfigured'
        ? 'Guest mode · local saves'
        : user
          ? `Signed in · ${user.email ?? user.uid.slice(0, 8)}`
          : 'Firebase ready · not signed in';

    this.add
      .text(width / 2, height - 28, statusText, {
        fontFamily: 'system-ui',
        fontSize: '13px',
        color: '#6a849e',
      })
      .setOrigin(0.5);

    this.scale.on('resize', this.onResize, this);
  }

  update(_t: number, _dt: number): void {
    if (this.bg) this.bg.tilePositionY -= 0.35;
  }

  private onResize(gameSize: Phaser.Structs.Size): void {
    const { width, height } = gameSize;
    this.bg?.setSize(width, height);
  }

  shutdown(): void {
    this.scale.off('resize', this.onResize, this);
  }
}
