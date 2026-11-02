import fs from 'node:fs';
import path from 'node:path';

const names = [
  'G3_03_SERVICES_AREAS_AND_CORE_CONTENT.txt',
  'G3_04_BRANDS_AND_PRODUCT_CONTENT.txt',
  'G3_05_SYMPTOMS_AND_INDICATOR_CONTENT.txt',
  'G3_06_KNOWLEDGE_CONTENT.txt',
];

const pending = [];
const seen = new Set();
const duplicates = [];

for (const name of names) {
  const text = fs.readFileSync(path.join('prompt/data', name), 'utf8').replace(/\r\n/g, '\n');
  const re = /^BEGIN FILE: (src\/content\/pages\/[a-z0-9_-]+\.json)\n([\s\S]*?)\nEND FILE$/gm;
  let match;
  while ((match = re.exec(text))) {
    const target = match[1];
    const data = JSON.parse(match[2]);
    if (seen.has(target)) { duplicates.push(target); continue; }
    seen.add(target);
    if (!data.path || !data.h1 || !data.title || !data.description) {
      throw new Error('Missing page fields: ' + target);
    }
    const body = JSON.stringify(data, null, 2) + '\n';
    pending.push({ target, body, path: data.path, type: data.type });
  }
}

if (pending.length !== 116) {
  console.error('Expected 116 page records, found ' + pending.length);
  process.exit(1);
}

for (const item of pending) {
  fs.mkdirSync(path.dirname(item.target), { recursive: true });
  fs.writeFileSync(item.target, item.body);
}

console.log('Materialized ' + pending.length + ' page records.');
// Print a compact route list for verification
const byType = {};
for (const item of pending) {
  byType[item.type] = (byType[item.type] || 0) + 1;
}
console.log('By type:', JSON.stringify(byType));
