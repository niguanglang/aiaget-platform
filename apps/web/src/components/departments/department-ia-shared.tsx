'use client';

import type { DepartmentTreeItem } from '@aiaget/shared-types';

export function flattenDepartmentTree(items: DepartmentTreeItem[]) {
  const output: DepartmentTreeItem[] = [];

  function visit(nodes: DepartmentTreeItem[]) {
    for (const node of nodes) {
      output.push(node);
      visit(node.children);
    }
  }

  visit(items);

  return output;
}

export function nullableText(value?: string | null) {
  const trimmed = value?.trim();

  return trimmed ? trimmed : null;
}

