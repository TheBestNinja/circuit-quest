/** Loadout categories: Maps, Weapons (gadgets), Armor (chassis), Tech, Skills, Modules */

export type EquipSlot = 'map' | 'weapon' | 'armor' | 'tech' | 'skill' | 'module';

export interface EquipItem {
  id: string;
  name: string;
  slot: EquipSlot;
  description: string;
  unlockLevel: number;
  costCredits: number;
  bonus?: Partial<{
    maxEnergy: number;
    maxHp: number;
    xpGain: number;
    damage: number;
    mathHint: boolean;
  }>;
  iconKey?: string;
}

export const EQUIPMENT: EquipItem[] = [
  // Maps
  {
    id: 'map_sector_a',
    name: 'Sector Alpha',
    slot: 'map',
    description: 'Starter training grids. Addition & subtraction.',
    unlockLevel: 1,
    costCredits: 0,
  },
  {
    id: 'map_nebula',
    name: 'Neon Nebula',
    slot: 'map',
    description: 'Multiplication challenges in glowing dust clouds.',
    unlockLevel: 3,
    costCredits: 120,
  },
  {
    id: 'map_core',
    name: 'Core Relay',
    slot: 'map',
    description: 'Division & mixed ops near the mainframe.',
    unlockLevel: 5,
    costCredits: 280,
  },
  // Weapons (gadgets)
  {
    id: 'gadget_pulse',
    name: 'Pulse Blaster',
    slot: 'weapon',
    description: 'Standard issue gadget cannon.',
    unlockLevel: 1,
    costCredits: 0,
    bonus: { damage: 5 },
    iconKey: 'laserBlue',
  },
  {
    id: 'gadget_rail',
    name: 'Rail Driver',
    slot: 'weapon',
    description: 'High-precision math strikes.',
    unlockLevel: 2,
    costCredits: 80,
    bonus: { damage: 12 },
    iconKey: 'laserGreen',
  },
  {
    id: 'gadget_nova',
    name: 'Nova Array',
    slot: 'weapon',
    description: 'Heavy payload for tough firewalls.',
    unlockLevel: 4,
    costCredits: 200,
    bonus: { damage: 20 },
    iconKey: 'laserRed',
  },
  // Armor (chassis)
  {
    id: 'chassis_scout',
    name: 'Scout Frame',
    slot: 'armor',
    description: 'Light chassis. Balanced energy.',
    unlockLevel: 1,
    costCredits: 0,
    bonus: { maxHp: 100, maxEnergy: 50 },
    iconKey: 'ship_blue',
  },
  {
    id: 'chassis_tank',
    name: 'Bulwark Chassis',
    slot: 'armor',
    description: 'Reinforced plating. More HP.',
    unlockLevel: 3,
    costCredits: 150,
    bonus: { maxHp: 160, maxEnergy: 40 },
    iconKey: 'ship_orange',
  },
  {
    id: 'chassis_flux',
    name: 'Flux Shell',
    slot: 'armor',
    description: 'Energy-tuned plating. Bigger Charge pool.',
    unlockLevel: 4,
    costCredits: 180,
    bonus: { maxHp: 110, maxEnergy: 80 },
    iconKey: 'ship_green',
  },
  // Skills
  {
    id: 'skill_focus',
    name: 'Focus Circuit',
    slot: 'skill',
    description: '+10% XP from correct answers.',
    unlockLevel: 2,
    costCredits: 60,
    bonus: { xpGain: 0.1 },
  },
  {
    id: 'skill_hint',
    name: 'Hint Protocol',
    slot: 'skill',
    description: 'Show a gentle range hint on hard questions.',
    unlockLevel: 3,
    costCredits: 100,
    bonus: { mathHint: true },
  },
  {
    id: 'skill_overclock',
    name: 'Overclock',
    slot: 'skill',
    description: '+15% gadget damage.',
    unlockLevel: 5,
    costCredits: 220,
    bonus: { damage: 8, xpGain: 0.05 },
  },
  // Modules (replaces Rings)
  {
    id: 'mod_capacitor',
    name: 'Capacitor Ring',
    slot: 'module',
    description: '+10 max Energy / Charge.',
    unlockLevel: 1,
    costCredits: 40,
    bonus: { maxEnergy: 10 },
  },
  {
    id: 'mod_shield_cell',
    name: 'Shield Cell',
    slot: 'module',
    description: '+20 max HP.',
    unlockLevel: 2,
    costCredits: 70,
    bonus: { maxHp: 20 },
  },
  {
    id: 'mod_xp_chip',
    name: 'XP Chip',
    slot: 'module',
    description: '+15% XP gains.',
    unlockLevel: 4,
    costCredits: 160,
    bonus: { xpGain: 0.15 },
  },
];

export const SLOT_LABELS: Record<EquipSlot, string> = {
  map: 'Maps',
  weapon: 'Weapons',
  armor: 'Armor',
  tech: 'Tech',
  skill: 'Skills',
  module: 'Modules',
};

export function itemsForSlot(slot: EquipSlot): EquipItem[] {
  return EQUIPMENT.filter((e) => e.slot === slot);
}

export function getItem(id: string): EquipItem | undefined {
  return EQUIPMENT.find((e) => e.id === id);
}
