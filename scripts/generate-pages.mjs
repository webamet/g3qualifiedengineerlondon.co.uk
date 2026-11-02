import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const input = path.join(root, 'src/content/pages');
const templates = {
  home: 'Homepage',
  service: 'ServicePage',
  area: 'AreaPage',
  article: 'GuidePage',
  collection: 'CollectionPage',
  contact: 'ContactPage',
  about: 'AboutPage',
  faq: 'FAQPage',
  policy: 'PolicyPage',
  profile: 'AuthorPage',
  web: 'StandardPage',
  notfound: 'NotFoundPage',
};

const files = fs.readdirSync(input).filter((file) => file.endsWith('.json')).sort();
const destinations = [];
const seenDestinations = new Set();

for (const file of files) {
  const page = JSON.parse(fs.readFileSync(path.join(input, file), 'utf8'));
  if (!/^\/(?:[a-z0-9-]+(?:\/[a-z0-9-]+)*)?$/.test(page.path)) throw new Error('Invalid route ' + page.path);
  const route = page.path === '/' ? 'index.astro' : page.path.slice(1) + '.astro';
  const dest = path.join(root, 'src/pages', route);
  if (seenDestinations.has(dest)) throw new Error('Duplicate destination');
  seenDestinations.add(dest);
  const template = templates[page.type];
  if (!template) throw new Error('Unknown template ' + page.type);
  function relative(target) {
    let r = path.relative(path.dirname(dest), target).split(path.sep).join('/');
    return r.startsWith('.') ? r : './' + r;
  }
  const body =
    '---\n' +
    'import BaseLayout from ' + JSON.stringify(relative(path.join(root, 'src/layouts/BaseLayout.astro'))) + ';\n' +
    'import Template from ' + JSON.stringify(relative(path.join(root, 'src/components/pages', template + '.astro'))) + ';\n' +
    'import page from ' + JSON.stringify(relative(path.join(input, file))) + ';\n' +
    '---\n' +
    '<BaseLayout page={page}><Template page={page} /></BaseLayout>\n';
  destinations.push({ dest, body });
}

for (const item of destinations) {
  fs.mkdirSync(path.dirname(item.dest), { recursive: true });
  fs.writeFileSync(item.dest, item.body);
}
console.log('Created ' + destinations.length + ' independent Astro page wrappers.');
