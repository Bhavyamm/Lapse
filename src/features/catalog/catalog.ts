import type { BillingCycle } from '@/features/subscriptions/types';

import logos from './logos.generated.json';
import services from './services.json';

export type Logo = { hex: string; path: string };

export type CatalogService = {
  id: string;
  name: string;
  /** Typical price in cents, a starting point the person can change. */
  price: number;
  /** True when the price depends on the plan, so it reads "From $7.99". */
  from?: boolean;
  cycle: BillingCycle;
  category: string;
  /** simple-icons slug. Services without one show their first letter. */
  icon?: string;
  /** Tile background and glyph color overrides from the designs. */
  tile?: string;
  glyph?: string;
  aliases?: string[];
  /** Length of the usual free trial, when there is one. */
  trialDays?: number;
  /** Rank in the Popular list. */
  popular?: number;
};

export const CATALOG = services as CatalogService[];

const LOGOS = logos as Record<string, Logo>;

export function logoFor(service: Pick<CatalogService, 'icon'>): Logo | undefined {
  return service.icon ? LOGOS[service.icon] : undefined;
}

export function findService(id: string | null | undefined): CatalogService | undefined {
  return id ? CATALOG.find((s) => s.id === id) : undefined;
}

export const POPULAR = CATALOG.filter((s) => s.popular).sort((a, b) => a.popular! - b.popular!);

/** Lowercase, no accents, letters and digits only, so "Disney+" matches "disney plus" and "disneyplus". */
export function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\+/g, ' plus ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

const squash = (text: string) => text.replace(/ /g, '');

/** Lower is better; null means no match. */
function score(service: CatalogService, query: string): number | null {
  const names = [service.name, ...(service.aliases ?? [])].map(normalize);
  let best: number | null = null;
  names.forEach((name, i) => {
    const alias = i > 0 ? 1 : 0;
    let s: number | null = null;
    if (name.startsWith(query) || squash(name).startsWith(squash(query))) s = 0;
    else if (name.split(' ').some((word) => word.startsWith(query))) s = 2;
    // Matching inside a word only from 3 letters, so "yp" doesn't find Disne(y P)lus.
    else if (query.length >= 3 && squash(name).includes(squash(query))) s = 4;
    if (s !== null && (best === null || s + alias < best)) best = s + alias;
  });
  return best;
}

/** Services matching what was typed: name starts first, then word starts, then anywhere. */
export function searchCatalog(text: string, limit = 30): CatalogService[] {
  const query = normalize(text);
  if (!query) return POPULAR;
  return CATALOG.map((service) => ({ service, rank: score(service, query) }))
    .filter((r): r is { service: CatalogService; rank: number } => r.rank !== null)
    .sort(
      (a, b) =>
        a.rank - b.rank ||
        (a.service.popular ?? 999) - (b.service.popular ?? 999) ||
        a.service.name.localeCompare(b.service.name),
    )
    .slice(0, limit)
    .map((r) => r.service);
}
