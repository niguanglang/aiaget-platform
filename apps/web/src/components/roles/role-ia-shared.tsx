'use client';

import type { MenuTreeItem, PermissionCatalogGroup } from '@aiaget/shared-types';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export function ConfirmDialog({
  body,
  confirmLabel = '确认删除',
  onCancel,
  onConfirm,
  pending,
  title,
}: {
  body: string;
  confirmLabel?: string;
  onCancel: () => void;
  onConfirm: () => void;
  pending: boolean;
  title: string;
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/35 px-4 backdrop-blur-sm">
      <Card className="w-full max-w-md p-5">
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{body}</p>
        <div className="mt-5 flex justify-end gap-2">
          <Button onClick={onCancel} type="button" variant="outline">
            取消
          </Button>
          <Button disabled={pending} onClick={onConfirm} type="button" variant="destructive">
            {confirmLabel}
          </Button>
        </div>
      </Card>
    </div>
  );
}

export function DetailLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-dashed pb-2 last:border-0 last:pb-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="max-w-[72%] break-words text-right font-medium">{value}</span>
    </div>
  );
}

export function ReferencePanel({
  children,
  emptyText,
  icon,
  title,
}: {
  children: React.ReactNode;
  emptyText: string;
  icon: React.ReactNode;
  title: string;
}) {
  const isEmpty = Array.isArray(children) && children.length === 0;

  return (
    <div className="rounded-lg border bg-background p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
        {icon}
        {title}
      </div>
      {isEmpty ? (
        <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">{emptyText}</div>
      ) : (
        <div className="grid gap-2">{children}</div>
      )}
    </div>
  );
}

export function flattenPermissionCatalog(catalog: PermissionCatalogGroup[]) {
  return catalog.flatMap((group) => group.resources.flatMap((resource) => resource.permissions));
}

export function flattenMenuTree(items: MenuTreeItem[]) {
  const output: MenuTreeItem[] = [];

  function visit(nodes: MenuTreeItem[]) {
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
