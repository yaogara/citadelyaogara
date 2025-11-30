import { CharacterType, districts } from 'citadels-common';
import { CharacterMeta, DistrictMeta } from './types';
import { resolveDistrictImage } from './cardMetadata';

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

export const DISTRICTS: Record<string, DistrictMeta> = Object.entries(districts).reduce((acc, [id, payload]) => ({
  ...acc,
  [id]: {
    id,
    name: payload.name,
    color: payload.color as DistrictMeta['color'],
    cost: payload.cost,
    description: payload.description,
    image: resolveDistrictImage(id),
  },
}), {} as Record<string, DistrictMeta>);

export function getDistrictMeta(id: string | null | undefined): DistrictMeta | undefined {
  if (!id) return undefined;
  return DISTRICTS[id];
}
