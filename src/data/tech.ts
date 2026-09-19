/** Tech modules — spell-loadout mechanics renamed for Circuit Quest. Never Magic/Spells/Mana. */

export interface TechAbility {
  id: string;
  name: string;
  description: string;
  energyCost: number;
  cooldownMs: number;
  damage?: number;
  heal?: number;
  shield?: number;
  color: number;
  unlockLevel: number;
}

export const TECH_ABILITIES: TechAbility[] = [
  {
    id: 'plasma_bolt',
    name: 'Plasma Bolt',
    description: 'Fire a charged plasma projectile. Deals solid damage.',
    energyCost: 8,
    cooldownMs: 2500,
    damage: 18,
    color: 0xff4d6d,
    unlockLevel: 1,
  },
  {
    id: 'nano_repair',
    name: 'Nano Repair',
    description: 'Deploy nanobots to restore chassis integrity.',
    energyCost: 12,
    cooldownMs: 6000,
    heal: 25,
    color: 0x4dff88,
    unlockLevel: 1,
  },
  {
    id: 'force_barrier',
    name: 'Force Barrier',
    description: 'Raise a temporary energy shield.',
    energyCost: 10,
    cooldownMs: 8000,
    shield: 30,
    color: 0x4da6ff,
    unlockLevel: 2,
  },
  {
    id: 'cryo_lock',
    name: 'Cryo Lock',
    description: 'Freeze enemy circuits — reduces their next attack.',
    energyCost: 9,
    cooldownMs: 5000,
    damage: 8,
    color: 0x88e0ff,
    unlockLevel: 3,
  },
  {
    id: 'arc_discharge',
    name: 'Arc Discharge',
    description: 'Chain lightning across enemy systems.',
    energyCost: 15,
    cooldownMs: 7000,
    damage: 28,
    color: 0xffe14d,
    unlockLevel: 4,
  },
  {
    id: 'warp_jump',
    name: 'Warp Jump',
    description: 'Phase shift — skip a math penalty once.',
    energyCost: 14,
    cooldownMs: 12000,
    color: 0xc44dff,
    unlockLevel: 5,
  },
];

export function getTechById(id: string): TechAbility | undefined {
  return TECH_ABILITIES.find((t) => t.id === id);
}

export function getUnlockedTech(level: number): TechAbility[] {
  return TECH_ABILITIES.filter((t) => t.unlockLevel <= level);
}
