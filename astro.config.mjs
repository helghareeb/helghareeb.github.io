import { defineConfig } from 'astro/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// HADITH_BOOK=<book> builds that hadith book's own site (repo helghareeb/hadith-<book>, served at
// /hadith-<book>/): the same project and design, keeping only that book's pages. Links in it to the
// rest of the site are root-relative, so they lead back to the main site on the same domain.
const book = process.env.HADITH_BOOK;

/** Book build: drop everything but the book's pages and the built assets. */
const bookSiteOnly = {
  name: 'hadith-book-site',
  hooks: {
    'astro:build:done': ({ dir }) => {
      const root = fileURLToPath(dir);
      const data = JSON.parse(fs.readFileSync(`src/data/hadith/${book}.json`, 'utf-8'));
      const keep = new Set(data.kutub.flatMap((k) => [k.slug, ...k.hadith.map((h) => String(h.n))]));
      for (const name of fs.readdirSync(root)) {
        if (!['_astro', 'ar', 'en'].includes(name)) fs.rmSync(path.join(root, name), { recursive: true, force: true });
      }
      for (const lang of ['ar', 'en']) {
        for (const name of fs.readdirSync(path.join(root, lang))) {
          if (!keep.has(name)) fs.rmSync(path.join(root, lang, name), { recursive: true, force: true });
        }
      }
      // The book site's own front door, for now the hadith section of the main site.
      const home = (to) => `<!doctype html><meta charset="utf-8"><meta http-equiv="refresh" content="0; url=${to}"><a href="${to}">${to}</a>\n`;
      fs.writeFileSync(path.join(root, 'index.html'), home('/ar/hadith/'));
      for (const lang of ['ar', 'en']) fs.writeFileSync(path.join(root, lang, 'index.html'), home(`/${lang}/hadith/`));
      fs.writeFileSync(path.join(root, '.nojekyll'), '');
    },
  },
};

export default defineConfig({
  site: 'https://helghareeb.github.io',
  ...(book ? { base: `/hadith-${book}`, integrations: [bookSiteOnly] } : {}),
});
