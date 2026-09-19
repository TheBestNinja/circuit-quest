import Phaser from 'phaser';

export interface ButtonOpts {
  x: number;
  y: number;
  label: string;
  width?: number;
  height?: number;
  fill?: number;
  hover?: number;
  textColor?: string;
  fontSize?: string;
  onClick: () => void;
}

export function makeButton(scene: Phaser.Scene, opts: ButtonOpts): Phaser.GameObjects.Container {
  const w = opts.width ?? 220;
  const h = opts.height ?? 48;
  const fill = opts.fill ?? 0x1e90ff;
  const hover = opts.hover ?? 0x4db8ff;

  const bg = scene.add.rectangle(0, 0, w, h, fill, 0.95).setStrokeStyle(2, 0xa0d8ff);
  const text = scene.add
    .text(0, 0, opts.label, {
      fontFamily: 'kenvector, system-ui, sans-serif',
      fontSize: opts.fontSize ?? '18px',
      color: opts.textColor ?? '#ffffff',
    })
    .setOrigin(0.5);

  const c = scene.add.container(opts.x, opts.y, [bg, text]);
  c.setSize(w, h);
  bg.setInteractive({ useHandCursor: true });

  bg.on('pointerover', () => bg.setFillStyle(hover, 1));
  bg.on('pointerout', () => bg.setFillStyle(fill, 0.95));
  bg.on('pointerdown', () => {
    scene.tweens.add({ targets: c, scaleX: 0.96, scaleY: 0.96, duration: 60, yoyo: true });
    opts.onClick();
  });

  return c;
}

export function makePanel(
  scene: Phaser.Scene,
  x: number,
  y: number,
  w: number,
  h: number,
  color = 0x0d1a2e
): Phaser.GameObjects.Rectangle {
  return scene.add.rectangle(x, y, w, h, color, 0.88).setStrokeStyle(2, 0x3a6ea5);
}
