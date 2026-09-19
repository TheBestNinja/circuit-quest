import Phaser from 'phaser';
import { makeButton, makePanel } from '../../ui/Button';
import {
  Progress,
  computeStats,
  buyItem,
  equipItem,
  equipTech,
  xpToNext,
} from '../../systems/Progression';
import { SLOT_LABELS, itemsForSlot, type EquipSlot } from '../../data/equipment';
import { TECH_ABILITIES, getTechById } from '../../data/tech';
import { pushCloudSave, isConfigured, getCurrentUser } from '../../systems/FirebaseService';

type HubTab = EquipSlot;

export class HubScene extends Phaser.Scene {
  private tab: HubTab = 'map';
  private listRoot?: Phaser.GameObjects.Container;
  private statsText?: Phaser.GameObjects.Text;
  private bg!: Phaser.GameObjects.TileSprite;

  constructor() {
    super('Hub');
  }

  create(): void {
    const { width, height } = this.scale;
    this.bg = this.add.tileSprite(0, 0, width, height, 'bg_dark').setOrigin(0);
    this.add.rectangle(width / 2, height / 2, width, height, 0x000810, 0.45);

    this.add
      .text(24, 18, 'COMMAND HUB', {
        fontFamily: 'kenvector, system-ui',
        fontSize: '28px',
        color: '#5ce1ff',
      });

    this.statsText = this.add.text(24, 52, '', {
      fontFamily: 'system-ui',
      fontSize: '14px',
      color: '#b8cce0',
      lineSpacing: 4,
    });

    const tabs: HubTab[] = ['map', 'weapon', 'armor', 'tech', 'skill', 'module'];
    tabs.forEach((t, i) => {
      makeButton(this, {
        x: 90 + i * 118,
        y: 130,
        label: SLOT_LABELS[t],
        width: 110,
        height: 36,
        fontSize: '13px',
        fill: 0x1a3a5c,
        hover: 0x2a6a9c,
        onClick: () => {
          this.tab = t;
          this.refreshList();
        },
      });
    });

    makePanel(this, width / 2, height / 2 + 40, Math.min(width - 40, 900), height - 220);

    makeButton(this, {
      x: width - 120,
      y: 36,
      label: 'BATTLE',
      width: 160,
      height: 44,
      fill: 0xd94a2a,
      hover: 0xff6a4a,
      onClick: () => this.scene.start('Battle'),
    });

    makeButton(this, {
      x: width - 120,
      y: 88,
      label: 'SAVE',
      width: 160,
      height: 36,
      fontSize: '14px',
      fill: 0x2a6a4a,
      onClick: () => {
        Progress.save();
        if (isConfigured() && getCurrentUser()) void pushCloudSave();
        this.flash('Progress saved');
      },
    });

    makeButton(this, {
      x: width - 300,
      y: 36,
      label: 'TITLE',
      width: 120,
      height: 36,
      fontSize: '14px',
      fill: 0x3a4a5a,
      onClick: () => {
        Progress.save();
        this.scene.start('Title');
      },
    });

    // Ship preview
    const armor = Progress.get().loadout.armor;
    const shipKey =
      armor.includes('tank') || armor.includes('bulwark')
        ? 'ship_orange'
        : armor.includes('flux')
          ? 'ship_green'
          : 'ship_blue';
    this.add.image(width - 140, height - 120, shipKey).setScale(0.85);

    this.refreshStats();
    this.refreshList();
    this.scale.on('resize', () => {
      this.bg.setSize(this.scale.width, this.scale.height);
    });
  }

  update(): void {
    if (this.bg) this.bg.tilePositionY -= 0.2;
  }

  private refreshStats(): void {
    const s = Progress.get();
    const st = computeStats(s);
    s.hp = Math.min(s.hp, st.maxHp);
    s.energy = Math.min(s.energy, st.maxEnergy);
    const techNames = s.loadout.techIds.map((id) => getTechById(id)?.name ?? id).join(', ') || 'None';
    this.statsText?.setText(
      `Cadet Lv ${s.level}  ·  XP ${s.xp}/${xpToNext(s.level)}  ·  Credits ${s.credits}\n` +
        `HP ${s.hp}/${st.maxHp}  ·  Energy ${s.energy}/${st.maxEnergy}  ·  Dmg ${st.damage}\n` +
        `Tech loadout: ${techNames}  ·  Wins ${s.battlesWon}`
    );
  }

  private refreshList(): void {
    this.listRoot?.destroy(true);
    this.listRoot = this.add.container(0, 0);
    const { width, height } = this.scale;
    const save = Progress.get();
    const startY = 200;
    const maxRows = Math.floor((height - 240) / 56);

    if (this.tab === 'tech') {
      TECH_ABILITIES.slice(0, maxRows).forEach((t, i) => {
        const owned = save.ownedItemIds.includes(t.id) || t.unlockLevel <= save.level;
        const equipped = save.loadout.techIds.includes(t.id);
        const locked = t.unlockLevel > save.level;
        const label = locked
          ? `🔒 ${t.name} (Lv ${t.unlockLevel})`
          : `${equipped ? '◆ ' : ''}${t.name}  ·  ${t.energyCost} Energy  ·  CD ${t.cooldownMs / 1000}s`;
        const btn = makeButton(this, {
          x: width / 2,
          y: startY + i * 54,
          label,
          width: Math.min(width - 80, 720),
          height: 44,
          fontSize: '14px',
          fill: equipped ? 0x2a6a8a : locked ? 0x2a2a35 : 0x1a3a55,
          onClick: () => {
            if (locked) {
              this.flash(`Unlocks at level ${t.unlockLevel}`);
              return;
            }
            if (!owned) save.ownedItemIds.push(t.id);
            const r = equipTech(save, t.id);
            Progress.set(save);
            Progress.save();
            this.flash(r.message);
            this.refreshStats();
            this.refreshList();
          },
        });
        this.listRoot!.add(btn);
        const desc = this.add
          .text(width / 2, startY + i * 54 + 18, t.description, {
            fontSize: '11px',
            color: '#7a94ae',
            fontFamily: 'system-ui',
          })
          .setOrigin(0.5, 0);
        // Keep description out of button hit — place above list visually via short subtitle under name only when space
        desc.setVisible(false);
        this.listRoot!.add(desc);
      });
      return;
    }

    const items = itemsForSlot(this.tab).slice(0, maxRows);
    items.forEach((item, i) => {
      const owned = save.ownedItemIds.includes(item.id);
      const equipped =
        save.loadout.map === item.id ||
        save.loadout.weapon === item.id ||
        save.loadout.armor === item.id ||
        save.loadout.skill === item.id ||
        save.loadout.module === item.id;
      const locked = item.unlockLevel > save.level;
      let label = item.name;
      if (locked) label = `🔒 ${item.name} (Lv ${item.unlockLevel})`;
      else if (!owned) label = `${item.name}  ·  ${item.costCredits}¢`;
      else if (equipped) label = `◆ ${item.name} (equipped)`;
      else label = `${item.name}  ·  Equip`;

      const btn = makeButton(this, {
        x: width / 2,
        y: startY + i * 54,
        label,
        width: Math.min(width - 80, 720),
        height: 44,
        fontSize: '14px',
        fill: equipped ? 0x2a6a4a : locked ? 0x2a2a35 : owned ? 0x1a3a55 : 0x4a3a1a,
        onClick: () => {
          if (locked) {
            this.flash(`Requires level ${item.unlockLevel}`);
            return;
          }
          if (!owned) {
            const r = buyItem(save, item.id);
            this.flash(r.message);
            if (r.ok) {
              equipItem(save, item.id);
              Progress.set(save);
              Progress.save();
            }
          } else {
            const r = equipItem(save, item.id);
            Progress.set(save);
            Progress.save();
            this.flash(r.message);
          }
          this.refreshStats();
          this.refreshList();
        },
      });
      this.listRoot!.add(btn);
    });
  }

  private flash(msg: string): void {
    const { width } = this.scale;
    const t = this.add
      .text(width / 2, 168, msg, {
        fontFamily: 'system-ui',
        fontSize: '15px',
        color: '#ffe08a',
        backgroundColor: '#000000aa',
        padding: { x: 10, y: 4 },
      })
      .setOrigin(0.5);
    this.tweens.add({
      targets: t,
      alpha: 0,
      y: 150,
      duration: 1400,
      onComplete: () => t.destroy(),
    });
  }
}
