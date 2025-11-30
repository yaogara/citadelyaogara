import { CharacterType, districts } from 'citadels-common';
import { CharacterMeta, DistrictMeta } from './types';
import { resolveDistrictImage } from './cardMetadata';

type DistrictDefinition = {
  type?: number;
  cost?: number;
  name?: string;
  color?: string;
  description?: string;
  extra_points?: number;
};

const DISTRICT_COLOR_BY_TYPE: Record<number, DistrictMeta['color']> = {
  1: 'yellow',
  2: 'blue',
  3: 'green',
  4: 'red',
  5: 'purple',
};

const districtEntries = districts
  ? Object.entries(districts as Record<string, DistrictDefinition>)
  : [];

function toFriendlyDistrictName(id: string, payload?: DistrictDefinition) {
  if (payload?.name) return payload.name;
  return id
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export const CHARACTERS: CharacterMeta[] = [
  { id: CharacterType.ASSASSIN, name: 'Assassin', rank: 1, color: 'purple', description: 'Silently remove a rival from this round.' },
  { id: CharacterType.THIEF, name: 'Thief', rank: 2, color: 'green', description: 'Steal the gold of the named character when their turn begins.' },
  { id: CharacterType.MAGICIAN, name: 'Magician', rank: 3, color: 'purple', description: 'Swap hands or cycle cards with the deck.' },
  { id: CharacterType.KING, name: 'King', rank: 4, color: 'yellow', description: 'Takes the crown and earns from noble districts.' },
  { id: CharacterType.BISHOP, name: 'Bishop', rank: 5, color: 'blue', description: 'Protects cities from destruction and earns from religious districts.' },
  { id: CharacterType.MERCHANT, name: 'Merchant', rank: 6, color: 'green', description: 'Gains extra gold and earns from trade districts.' },
  { id: CharacterType.ARCHITECT, name: 'Architect', rank: 7, color: 'blue', description: 'Builds quickly with additional cards drawn.' },
  { id: CharacterType.WARLORD, name: 'Warlord', rank: 8, color: 'red', description: 'Destroys enemy districts and earns from military sites.' },
];

export const CHARACTER_BY_ID: Record<number, CharacterMeta> = CHARACTERS.reduce((acc, char) => ({
  ...acc,
  [char.id]: char,
}), {} as Record<number, CharacterMeta>);

export const DISTRICTS: Record<string, DistrictMeta> = districtEntries.reduce((acc, [id, payload]) => {
  const color = payload?.color || DISTRICT_COLOR_BY_TYPE[payload?.type ?? 5] || 'purple';
  const description = payload?.description
    || (payload?.extra_points ? `Worth ${payload.extra_points} extra points.` : undefined);

  acc[id] = {
    id,
    name: toFriendlyDistrictName(id, payload),
    color,
    cost: payload?.cost ?? 0,
    description,
    image: resolveDistrictImage(id),
  };
  return acc;
}, {} as Record<string, DistrictMeta>);

export function getDistrictMeta(id: string | null | undefined): DistrictMeta | undefined {
  if (!id) return undefined;
  return DISTRICTS[id] ?? {
    id,
    name: toFriendlyDistrictName(id),
    color: 'purple',
    cost: 0,
    image: resolveDistrictImage(id),
  };
}
