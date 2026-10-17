// Regenerates src/features/catalog/logos.generated.json from simple-icons, keeping only
// the icons services.json uses, so the app bundle doesn't carry thousands of paths.
// Run after editing services.json: `npm run catalog:logos`.
import { readFileSync, writeFileSync } from 'node:fs';
import * as icons from 'simple-icons';

const services = JSON.parse(readFileSync(new URL('../src/features/catalog/services.json', import.meta.url)));
// Brands simple-icons no longer ships, with paths taken from the design files.
const extra = JSON.parse(readFileSync(new URL('./extra-logos.json', import.meta.url)));
const bySlug = new Map(
  Object.values(icons)
    .filter((icon) => icon && typeof icon === 'object' && 'slug' in icon)
    .map((icon) => [icon.slug, icon]),
);

const out = {};
const missing = [];
for (const slug of [...new Set(services.map((s) => s.icon).filter(Boolean))].sort()) {
  const icon = bySlug.get(slug) ?? extra[slug];
  if (!icon) {
    missing.push(slug);
    continue;
  }
  out[slug] = { hex: `#${icon.hex}`, path: icon.path };
}
if (missing.length) {
  console.error(`No logo for: ${missing.join(', ')}`);
  process.exit(1);
}
writeFileSync(
  new URL('../src/features/catalog/logos.generated.json', import.meta.url),
  JSON.stringify(out, null, 0) + '\n',
);
console.log(`Wrote ${Object.keys(out).length} logos`);
