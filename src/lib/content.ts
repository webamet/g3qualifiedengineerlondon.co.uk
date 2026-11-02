const modules = import.meta.glob('../content/pages/*.json', { eager: true, import: 'default' });

export const pages = Object.values(modules);

const byPath = new Map(pages.map((page) => [page.path, page]));

export function getPage(route) {
  return byPath.get(route);
}

export function getPagesByGroup(group) {
  return pages.filter((page) => page.group === group);
}

export function getPagesByType(type) {
  return pages.filter((page) => page.type === type);
}

export function getCollectionLinks(collectionGroup) {
  return pages.filter((page) => page.group === collectionGroup);
}

export function imageUrl(path) {
  if (!path) return null;
  if (path.startsWith('/images/')) return path;
  if (path.startsWith('/assets')) return path;
  return path;
}
