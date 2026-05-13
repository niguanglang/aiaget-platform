import { flattenNavigationLinks, type NavigationLink } from '@/components/layout/menu-navigation';

export function isNavigationItemActive(item: NavigationLink, pathname: string): boolean {
  if (item.external) return false;

  if (item.href !== '#' && (pathname === item.href || pathname.startsWith(`${item.href}/`))) {
    return true;
  }

  return item.children.some((child) => isNavigationItemActive(child, pathname));
}

export function findActivePathIds(items: NavigationLink[], pathname: string): string[] {
  for (const item of items) {
    if (!isNavigationItemActive(item, pathname)) continue;
    const childPath = findActivePathIds(item.children, pathname);
    return [item.id, ...childPath];
  }

  return [];
}

export function findActivePath(items: NavigationLink[], pathname: string): NavigationLink[] {
  for (const item of items) {
    if (!isNavigationItemActive(item, pathname)) continue;
    const childPath = findActivePath(item.children, pathname);
    return [item, ...childPath];
  }

  return [];
}

export function searchNavigationItems(items: NavigationLink[], keyword: string): NavigationLink[] {
  const normalizedKeyword = keyword.trim().toLowerCase();
  const flatItems = flattenNavigationLinks(items).filter((item) => item.href !== '#');
  if (!normalizedKeyword) return flatItems.slice(0, 8);
  return flatItems
    .filter((item) => `${item.title} ${item.href}`.toLowerCase().includes(normalizedKeyword))
    .slice(0, 12);
}

export function buildMobileNavigationLevels(items: NavigationLink[], pathIds: string[]): NavigationLink[][] {
  const levels: NavigationLink[][] = [];
  let currentItems = items;
  let levelIndex = 0;

  while (currentItems.length > 0) {
    levels.push(currentItems);
    const selectedItem = currentItems.find((item) => item.id === pathIds[levelIndex]);
    if (!selectedItem || selectedItem.children.length === 0) break;
    currentItems = selectedItem.children;
    levelIndex += 1;
  }

  return levels;
}
