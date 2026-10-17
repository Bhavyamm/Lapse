import { CATALOG, logoFor, normalize, POPULAR, searchCatalog } from './catalog';

describe('catalog', () => {
  it('has unique ids, positive prices and a logo for every icon it names', () => {
    const ids = new Set(CATALOG.map((s) => s.id));
    expect(ids.size).toBe(CATALOG.length);
    for (const s of CATALOG) {
      expect(s.price).toBeGreaterThan(0);
      if (s.icon) expect(logoFor(s)).toBeDefined();
    }
  });

  it('lists popular services in their ranked order', () => {
    expect(POPULAR.slice(0, 5).map((s) => s.name)).toEqual([
      'Netflix',
      'Spotify',
      'YouTube Premium',
      'ChatGPT Plus',
      'Duolingo Max',
    ]);
  });

  it('normalizes accents, case, punctuation and plus signs', () => {
    expect(normalize('  Disney+ ')).toBe('disney plus');
    expect(normalize('Crème Brûlée!')).toBe('creme brulee');
  });

  it('shows the popular list for an empty query', () => {
    expect(searchCatalog('   ')).toBe(POPULAR);
  });

  it('ranks names that start with the query first', () => {
    expect(searchCatalog('spo')[0].name).toBe('Spotify');
    expect(searchCatalog('net')[0].name).toBe('Netflix');
  });

  it('finds services by alias and by a word inside the name', () => {
    expect(searchCatalog('hbo')[0].name).toBe('Max');
    expect(searchCatalog('openai')[0].name).toBe('ChatGPT Plus');
    expect(searchCatalog('game pass')[0].name).toBe('Xbox Game Pass');
  });

  it('matches regardless of spaces and plus signs', () => {
    expect(searchCatalog('disneyplus')[0].name).toBe('Disney+');
    expect(searchCatalog('disney plus')[0].name).toBe('Disney+');
    expect(searchCatalog('youtubepremium')[0].name).toBe('YouTube Premium');
  });

  it('does not match two letters across a word break', () => {
    expect(searchCatalog('yp').map((s) => s.name)).not.toContain('Disney+');
  });

  it('returns nothing for gibberish', () => {
    expect(searchCatalog('zzqx')).toEqual([]);
  });
});
