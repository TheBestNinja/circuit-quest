import Phaser from 'phaser';
import { makeButton, makePanel } from '../../ui/Button';
import { Progress, computeStats, grantXp } from '../../systems/Progression';
import { generateQuestion, mapIdToOps, type MathQuestion } from '../../data/mathQuestions';
import { getTechById, type TechAbility } from '../../data/tech';
import { pushCloudSave, isConfigured, getCurrentUser } from '../../systems/FirebaseService';

interface CooldownState {
  readyAt: number;
}

export class BattleScene extends Phaser.Scene {
  private bg!: Phaser.GameObjects.TileSprite;
  private player!: Phaser.GameObjects.Image;
  private enemy!: Phaser.GameObjects.Image;
  private question!: MathQuestion;
  private hp = 100;
  private energy = 50;
  private maxHp = 100;
  private maxEnergy = 50;
  private enemyHp = 80;
  private enemyMaxHp = 80;
  private shield = 0;
  private cryoTurns = 0;
  private warpReady = false;
  private round = 0;
  private damageBonus = 10;
  private mathHint = false;
  private hpBar!: Phaser.GameObjects.Rectangle;
  private energyBar!: Phaser.GameObjects.Rectangle;
  private enemyBar!: Phaser.GameObjects.Rectangle;
  private shieldBar!: Phaser.GameObjects.Rectangle;
  private promptText!: Phaser.GameObjects.Text;
  private statusText!: Phaser.GameObjects.Text;
  private choiceButtons: Phaser.GameObjects.Container[] = [];
  private techButtons: Phaser.GameObjects.Container[] = [];
  private cooldowns = new Map<string, CooldownState>();
  private battleOver = false;
  private preferOp?: ReturnType<typeof mapIdToOps>;

  constructor() {
    super('Battle');
  }

  create(): void {
    const { width, height } = this.scale;
    const save = Progress.get();
    const stats = computeStats(save);
    this.maxHp = stats.maxHp;
    this.maxEnergy = stats.maxEnergy;
    this.damageBonus = stats.damage;
    this.mathHint = stats.mathHint;
    this.hp = Math.min(save.hp || stats.maxHp, stats.maxHp);
    this.energy = Math.min(save.energy || stats.maxEnergy, stats.maxEnergy);
    this.enemyMaxHp = 60 + save.level * 18;
    this.enemyHp = this.enemyMaxHp;
    this.preferOp = mapIdToOps(save.loadout.map);
    this.battleOver = false;
    this.shield = 0;
    this.cryoTurns = 0;
    this.warpReady = false;
    this.round = 0;
    this.cooldowns.clear();

    this.bg = this.add.tileSprite(0, 0, width, height, 'bg_blue').setOrigin(0);
    this.add.rectangle(width / 2, height / 2, width, height, 0x000814, 0.3);

    this.add
      .text(20, 14, 'CHALLENGE ARENA', {
        fontFamily: 'kenvector, system-ui',
        fontSize: '22px',
        color: '#5ce1ff',
      });

    makeButton(this, {
      x: width - 70,
      y: 28,
      label: 'HUB',
      width: 100,
      height: 34,
      fontSize: '14px',
      fill: 0x3a4a5a,
      onClick: () => this.retreat(),
    });

    // Actors
    const shipKey =
      save.loadout.armor.includes('tank') || save.loadout.armor.includes('bulwark')
        ? 'ship_orange'
        : save.loadout.armor.includes('flux')
          ? 'ship_green'
          : 'ship_blue';
    this.player = this.add.image(width * 0.22, height * 0.38, shipKey).setScale(0.75);
    const enemyKeys = ['enemy1', 'enemy2', 'enemy3', 'enemy4'];
    this.enemy = this.add
      .image(width * 0.78, height * 0.38, enemyKeys[save.level % enemyKeys.length])
      .setScale(0.7);
    this.tweens.add({
      targets: this.enemy,
      y: this.enemy.y - 12,
      duration: 1400,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Bars
    this.add.text(20, 50, 'HP', { fontSize: '12px', color: '#9bb' });
    this.add.rectangle(120, 56, 160, 12, 0x331111).setOrigin(0, 0.5);
    this.hpBar = this.add.rectangle(120, 56, 160, 12, 0xff4d6d).setOrigin(0, 0.5);

    this.add.text(20, 72, 'EN', { fontSize: '12px', color: '#9bb' });
    this.add.rectangle(120, 78, 160, 12, 0x112233).setOrigin(0, 0.5);
    this.energyBar = this.add.rectangle(120, 78, 160, 12, 0x4da6ff).setOrigin(0, 0.5);

    this.add.text(20, 94, 'SH', { fontSize: '12px', color: '#9bb' });
    this.add.rectangle(120, 100, 160, 12, 0x113322).setOrigin(0, 0.5);
    this.shieldBar = this.add.rectangle(120, 100, 0, 12, 0x4dff88).setOrigin(0, 0.5);

    this.add.text(width - 200, 50, 'FIREWALL', { fontSize: '12px', color: '#9bb' });
    this.add.rectangle(width - 200, 70, 160, 12, 0x331111).setOrigin(0, 0.5);
    this.enemyBar = this.add.rectangle(width - 200, 70, 160, 12, 0xff8844).setOrigin(0, 0.5);

    makePanel(this, width / 2, height * 0.72, Math.min(width - 30, 860), height * 0.48);

    this.promptText = this.add
      .text(width / 2, height * 0.55, '', {
        fontFamily: 'kenvector, system-ui',
        fontSize: '32px',
        color: '#e8f4ff',
      })
      .setOrigin(0.5);

    this.statusText = this.add
      .text(width / 2, height * 0.55 + 40, '', {
        fontFamily: 'system-ui',
        fontSize: '14px',
        color: '#a0c4e0',
      })
      .setOrigin(0.5);

    this.buildTechRow();
    this.nextQuestion();
    this.refreshBars();
  }

  update(): void {
    if (this.bg) this.bg.tilePositionY -= 0.5;
  }

  private buildTechRow(): void {
    this.techButtons.forEach((b) => b.destroy());
    this.techButtons = [];
    const save = Progress.get();
    const { width, height } = this.scale;
    const ids = save.loadout.techIds.slice(0, 3);
    ids.forEach((id, i) => {
      const tech = getTechById(id);
      if (!tech) return;
      const btn = makeButton(this, {
        x: width / 2 - 240 + i * 240,
        y: height * 0.92,
        label: `${tech.name}`,
        width: 220,
        height: 40,
        fontSize: '13px',
        fill: tech.color,
        onClick: () => this.useTech(tech),
      });
      this.techButtons.push(btn);
    });
  }

  private nextQuestion(): void {
    if (this.battleOver) return;
    this.round += 1;
    this.choiceButtons.forEach((b) => b.destroy());
    this.choiceButtons = [];
    const save = Progress.get();
    this.question = generateQuestion(save.level, this.preferOp);
    this.promptText.setText(this.question.prompt);
    let hint = `Round ${this.round} · Pick the correct answer`;
    if (this.mathHint) {
      const a = this.question.answer;
      hint += ` · Hint: between ${a - 3} and ${a + 3}`;
    }
    this.statusText.setText(hint);

    const { width, height } = this.scale;
    this.question.choices.forEach((c, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const btn = makeButton(this, {
        x: width / 2 - 130 + col * 260,
        y: height * 0.66 + row * 52,
        label: String(c),
        width: 220,
        height: 44,
        fontSize: '22px',
        fill: 0x1a4a7a,
        hover: 0x2a7aba,
        onClick: () => this.answer(c),
      });
      this.choiceButtons.push(btn);
    });
  }

  private answer(choice: number): void {
    if (this.battleOver) return;
    const save = Progress.get();
    const correct = choice === this.question.answer;

    if (correct) {
      this.sound.play('sfx_ok', { volume: 0.4 });
      save.correctAnswers += 1;
      const dmg = this.damageBonus + 8 + Math.floor(Math.random() * 6);
      this.dealDamageToEnemy(dmg, 0xffe14d);
      this.statusText.setText(`Correct! Firewall −${dmg}`);
      this.energy = Math.min(this.maxEnergy, this.energy + 4);
      grantXp(save, 12);
      save.credits += 3;
      this.fireProjectile(true);
    } else {
      this.sound.play('sfx_lose', { volume: 0.35 });
      save.wrongAnswers += 1;
      if (this.warpReady) {
        this.warpReady = false;
        this.statusText.setText('Warp Jump absorbed the miss!');
        this.flashVfx(this.player.x, this.player.y, 0xc44dff);
      } else {
        const cost = 8;
        this.energy = Math.max(0, this.energy - cost);
        let incoming = 10 + Math.floor(save.level * 1.5);
        if (this.cryoTurns > 0) {
          incoming = Math.floor(incoming * 0.5);
          this.cryoTurns -= 1;
        }
        this.takeDamage(incoming);
        this.statusText.setText(`Wrong! −${cost} Energy, took ${incoming} damage`);
        this.fireProjectile(false);
      }
    }

    Progress.set(save);
    this.refreshBars();

    if (this.enemyHp <= 0) {
      this.win();
      return;
    }
    if (this.hp <= 0) {
      this.lose();
      return;
    }

    this.time.delayedCall(550, () => this.nextQuestion());
  }

  private useTech(tech: TechAbility): void {
    if (this.battleOver) return;
    const now = this.time.now;
    const cd = this.cooldowns.get(tech.id);
    if (cd && cd.readyAt > now) {
      this.statusText.setText(`${tech.name} cooling down…`);
      return;
    }
    if (this.energy < tech.energyCost) {
      this.statusText.setText('Not enough Energy / Charge');
      return;
    }
    this.energy -= tech.energyCost;
    this.cooldowns.set(tech.id, { readyAt: now + tech.cooldownMs });
    this.sound.play('sfx_zap', { volume: 0.4 });

    switch (tech.id) {
      case 'plasma_bolt':
        this.dealDamageToEnemy(tech.damage ?? 18, tech.color);
        this.fireLaser('laser_red');
        this.statusText.setText(`Plasma Bolt hits for ${tech.damage}!`);
        break;
      case 'nano_repair': {
        const heal = tech.heal ?? 25;
        this.hp = Math.min(this.maxHp, this.hp + heal);
        this.flashVfx(this.player.x, this.player.y, tech.color);
        this.sound.play('sfx_shield', { volume: 0.35 });
        this.statusText.setText(`Nano Repair restored ${heal} HP`);
        break;
      }
      case 'force_barrier':
        this.shield = Math.min(60, this.shield + (tech.shield ?? 30));
        this.flashVfx(this.player.x, this.player.y, tech.color);
        this.sound.play('sfx_shield', { volume: 0.4 });
        this.statusText.setText('Force Barrier online!');
        break;
      case 'cryo_lock':
        this.cryoTurns = 2;
        this.dealDamageToEnemy(tech.damage ?? 8, tech.color);
        this.fireLaser('laser_blue');
        this.statusText.setText('Cryo Lock — enemy circuits slowed!');
        break;
      case 'arc_discharge':
        this.dealDamageToEnemy(tech.damage ?? 28, tech.color);
        this.fireLaser('laser_green');
        this.flashVfx(this.enemy.x, this.enemy.y, tech.color);
        this.statusText.setText(`Arc Discharge for ${tech.damage}!`);
        break;
      case 'warp_jump':
        this.warpReady = true;
        this.flashVfx(this.player.x, this.player.y, tech.color);
        this.statusText.setText('Warp Jump armed — next miss ignored');
        break;
      default:
        break;
    }

    this.refreshBars();
    if (this.enemyHp <= 0) this.win();
  }

  private dealDamageToEnemy(amount: number, color: number): void {
    this.enemyHp = Math.max(0, this.enemyHp - amount);
    this.flashVfx(this.enemy.x, this.enemy.y, color);
    this.tweens.add({
      targets: this.enemy,
      x: this.enemy.x + 10,
      duration: 60,
      yoyo: true,
      repeat: 2,
    });
  }

  private takeDamage(amount: number): void {
    let dmg = amount;
    if (this.shield > 0) {
      const absorb = Math.min(this.shield, dmg);
      this.shield -= absorb;
      dmg -= absorb;
    }
    this.hp = Math.max(0, this.hp - dmg);
    this.tweens.add({
      targets: this.player,
      x: this.player.x - 10,
      duration: 60,
      yoyo: true,
      repeat: 2,
    });
    this.flashVfx(this.player.x, this.player.y, 0xff4d6d);
  }

  private fireProjectile(fromPlayer: boolean): void {
    const start = fromPlayer
      ? { x: this.player.x, y: this.player.y }
      : { x: this.enemy.x, y: this.enemy.y };
    const end = fromPlayer
      ? { x: this.enemy.x, y: this.enemy.y }
      : { x: this.player.x, y: this.player.y };
    this.fireLaser(fromPlayer ? 'laser_blue' : 'laser_red', start, end);
  }

  private fireLaser(
    key: string,
    start?: { x: number; y: number },
    end?: { x: number; y: number }
  ): void {
    const s = start ?? { x: this.player.x, y: this.player.y };
    const e = end ?? { x: this.enemy.x, y: this.enemy.y };
    const bolt = this.add.image(s.x, s.y, key).setScale(0.6);
    const angle = Phaser.Math.Angle.Between(s.x, s.y, e.x, e.y);
    bolt.setRotation(angle + Math.PI / 2);
    this.sound.play('sfx_laser', { volume: 0.25 });
    this.tweens.add({
      targets: bolt,
      x: e.x,
      y: e.y,
      duration: 280,
      onComplete: () => bolt.destroy(),
    });
  }

  private flashVfx(x: number, y: number, color: number): void {
    const c = this.add.circle(x, y, 8, color, 0.9);
    this.tweens.add({
      targets: c,
      scale: 4,
      alpha: 0,
      duration: 350,
      onComplete: () => c.destroy(),
    });
  }

  private refreshBars(): void {
    this.hpBar.width = 160 * (this.hp / this.maxHp);
    this.energyBar.width = 160 * (this.energy / this.maxEnergy);
    this.enemyBar.width = 160 * (this.enemyHp / this.enemyMaxHp);
    this.shieldBar.width = 160 * Math.min(1, this.shield / 60);
  }

  private persistVitals(): void {
    const save = Progress.get();
    save.hp = this.hp;
    save.energy = this.energy;
    Progress.set(save);
    Progress.save();
    if (isConfigured() && getCurrentUser()) void pushCloudSave();
  }

  private win(): void {
    if (this.battleOver) return;
    this.battleOver = true;
    const save = Progress.get();
    save.battlesWon += 1;
    const rewardXp = 40 + save.level * 10;
    const rewardCredits = 25 + save.level * 5;
    grantXp(save, rewardXp);
    save.credits += rewardCredits;
    this.hp = Math.min(this.maxHp, this.hp + 15);
    this.energy = Math.min(this.maxEnergy, this.energy + 10);
    Progress.set(save);
    this.persistVitals();
    this.choiceButtons.forEach((b) => b.destroy());
    this.promptText.setText('FIREWALL DOWN!');
    this.statusText.setText(`+${rewardXp} XP · +${rewardCredits} credits`);
    this.flashVfx(this.enemy.x, this.enemy.y, 0xffe14d);
    this.enemy.setTint(0x333333);
    const { width, height } = this.scale;
    makeButton(this, {
      x: width / 2 - 130,
      y: height * 0.72,
      label: 'AGAIN',
      width: 200,
      onClick: () => this.scene.restart(),
    });
    makeButton(this, {
      x: width / 2 + 130,
      y: height * 0.72,
      label: 'HUB',
      width: 200,
      fill: 0x2a6a4a,
      onClick: () => this.scene.start('Hub'),
    });
  }

  private lose(): void {
    if (this.battleOver) return;
    this.battleOver = true;
    this.hp = Math.max(1, Math.floor(this.maxHp * 0.3));
    this.energy = Math.floor(this.maxEnergy * 0.4);
    this.persistVitals();
    this.choiceButtons.forEach((b) => b.destroy());
    this.promptText.setText('SYSTEMS CRITICAL');
    this.statusText.setText('Chassis repaired to 30% · Return to Hub');
    this.player.setTint(0x884444);
    const { width, height } = this.scale;
    makeButton(this, {
      x: width / 2,
      y: height * 0.72,
      label: 'RETURN TO HUB',
      width: 240,
      fill: 0x6a2a2a,
      onClick: () => this.scene.start('Hub'),
    });
  }

  private retreat(): void {
    this.persistVitals();
    this.scene.start('Hub');
  }
}
