import { EQUIPMENT, getItem, type EquipSlot } from '../data/equipment';
import { TECH_ABILITIES } from '../data/tech';

const STORAGE_KEY = 'circuit-quest-save-v1';

export interface Loadout {
  map: string;
  weapon: string;
  armor: string;
  skill: string | null;
  module: string | null;
  /** Up to 3 equipped tech ability ids */
  techIds: string[];
}

export interface PlayerSave {
  version: 1;
  playerName: string;
  level: number;
  xp: number;
  credits: number;
  hp: number;
  energy: number;
  ownedItemIds: string[];
  loadout: Loadout;
  battlesWon: number;
  correctAnswers: number;
  wrongAnswers: number;
  lastPlayedAt: number;
}

export function xpToNext(level: number): number {
  return 40 + level * 35;
}

export function defaultSave(): PlayerSave {
  return {
    version: 1,
    playerName: 'Cadet',
    level: 1,
    xp: 0,
    credits: 50,
    hp: 100,
    energy: 50,
    ownedItemIds: [
      'map_sector_a',
      'gadget_pulse',
      'chassis_scout',
      'mod_capacitor',
      'plasma_bolt',
      'nano_repair',
    ],
    loadout: {
      map: 'map_sector_a',
      weapon: 'gadget_pulse',
      armor: 'chassis_scout',
      skill: null,
      module: 'mod_capacitor',
      techIds: ['plasma_bolt', 'nano_repair'],
    },
    battlesWon: 0,
    correctAnswers: 0,
    wrongAnswers: 0,
    lastPlayedAt: Date.now(),
  };
}

export function loadLocal(): PlayerSave {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultSave();
    const parsed = JSON.parse(raw) as PlayerSave;
    if (parsed.version !== 1) return defaultSave();
    return { ...defaultSave(), ...parsed, loadout: { ...defaultSave().loadout, ...parsed.loadout } };
  } catch {
    return defaultSave();
  }
}

export function saveLocal(save: PlayerSave): void {
  save.lastPlayedAt = Date.now();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(save));
}

export function hasSave(): boolean {
  return !!localStorage.getItem(STORAGE_KEY);
}

export function clearSave(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function computeStats(save: PlayerSave) {
  let maxHp = 100;
  let maxEnergy = 50;
  let damage = 10;
  let xpGain = 1;
  let mathHint = false;

  const ids = [
    save.loadout.weapon,
    save.loadout.armor,
    save.loadout.skill,
    save.loadout.module,
  ].filter(Boolean) as string[];

  for (const id of ids) {
    const item = getItem(id);
    if (!item?.bonus) continue;
    maxHp += item.bonus.maxHp ?? 0;
    maxEnergy += item.bonus.maxEnergy ?? 0;
    damage += item.bonus.damage ?? 0;
    xpGain += item.bonus.xpGain ?? 0;
    if (item.bonus.mathHint) mathHint = true;
  }

  return { maxHp, maxEnergy, damage, xpGain, mathHint };
}

export function grantXp(save: PlayerSave, amount: number): { leveled: boolean; save: PlayerSave } {
  const stats = computeStats(save);
  save.xp += Math.round(amount * stats.xpGain);
  let leveled = false;
  while (save.xp >= xpToNext(save.level)) {
    save.xp -= xpToNext(save.level);
    save.level += 1;
    leveled = true;
    // Auto-unlock tech by level
    for (const t of TECH_ABILITIES) {
      if (t.unlockLevel <= save.level && !save.ownedItemIds.includes(t.id)) {
        save.ownedItemIds.push(t.id);
      }
    }
    for (const e of EQUIPMENT) {
      if (e.unlockLevel <= save.level && e.costCredits === 0 && !save.ownedItemIds.includes(e.id)) {
        save.ownedItemIds.push(e.id);
      }
    }
  }
  return { leveled, save };
}

export function buyItem(save: PlayerSave, itemId: string): { ok: boolean; message: string } {
  const item = getItem(itemId);
  if (!item) return { ok: false, message: 'Unknown item' };
  if (save.ownedItemIds.includes(itemId)) return { ok: false, message: 'Already owned' };
  if (save.level < item.unlockLevel) return { ok: false, message: `Requires level ${item.unlockLevel}` };
  if (save.credits < item.costCredits) return { ok: false, message: 'Not enough credits' };
  save.credits -= item.costCredits;
  save.ownedItemIds.push(itemId);
  return { ok: true, message: `Acquired ${item.name}` };
}

export function equipItem(save: PlayerSave, itemId: string): { ok: boolean; message: string } {
  if (itemId.startsWith('plasma') || itemId.includes('bolt') || TECH_ABILITIES.some((t) => t.id === itemId)) {
    return equipTech(save, itemId);
  }
  const item = getItem(itemId);
  if (!item) return { ok: false, message: 'Unknown item' };
  if (!save.ownedItemIds.includes(itemId)) return { ok: false, message: 'Not owned' };
  const slot = item.slot as Exclude<EquipSlot, 'tech'>;
  if (slot === 'skill' || slot === 'module') {
    save.loadout[slot] = itemId;
  } else if (slot === 'map' || slot === 'weapon' || slot === 'armor') {
    save.loadout[slot] = itemId;
  }
  return { ok: true, message: `Equipped ${item.name}` };
}

export function equipTech(save: PlayerSave, techId: string): { ok: boolean; message: string } {
  if (!save.ownedItemIds.includes(techId) && !TECH_ABILITIES.some((t) => t.id === techId && t.unlockLevel <= save.level)) {
    return { ok: false, message: 'Tech locked' };
  }
  if (!save.ownedItemIds.includes(techId)) save.ownedItemIds.push(techId);
  if (save.loadout.techIds.includes(techId)) {
    save.loadout.techIds = save.loadout.techIds.filter((id) => id !== techId);
    return { ok: true, message: 'Tech unequipped' };
  }
  if (save.loadout.techIds.length >= 3) {
    save.loadout.techIds.shift();
  }
  save.loadout.techIds.push(techId);
  return { ok: true, message: 'Tech equipped' };
}

/** Singleton mutable save used by scenes */
let current: PlayerSave = defaultSave();

export const Progress = {
  get(): PlayerSave {
    return current;
  },
  set(s: PlayerSave) {
    current = s;
  },
  load() {
    current = loadLocal();
    return current;
  },
  save() {
    saveLocal(current);
  },
  reset() {
    current = defaultSave();
    saveLocal(current);
    return current;
  },
};
