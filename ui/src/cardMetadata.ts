import { districts } from 'citadels-common';

export const CARD_IMAGE_PLACEHOLDER = '/cards/placeholder.svg';

const friendlyNameToSlug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const safeDistrictEntries = districts ? Object.entries(districts) : [];

// Mapping of district id (from citadels-common) to a best-guess asset path. If an image is missing
// Vite will serve the placeholder from /public/cards/.
export const DISTRICT_IMAGE_MAP: Record<string, string> = safeDistrictEntries.reduce((acc, [id]) => {
  const slug = friendlyNameToSlug(id);
  acc[id] = `/cards/${slug}.jpg`;
  return acc;
}, {} as Record<string, string>);

export function resolveDistrictImage(id?: string | null) {
  if (!id) return CARD_IMAGE_PLACEHOLDER;
  return DISTRICT_IMAGE_MAP[id] ?? CARD_IMAGE_PLACEHOLDER;
}
