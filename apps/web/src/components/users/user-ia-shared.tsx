'use client';

import type { DepartmentTreeItem, RoleListItem } from '@aiaget/shared-types';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export function ConfirmDialog({
  body,
  onCancel,
  onConfirm,
  pending,
  title,
}: {
  body: string;
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
            删除
          </Button>
        </div>
      </Card>
    </div>
  );
}

export function DetailLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-dashed pb-2 text-sm last:border-0 last:pb-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="max-w-[72%] break-words text-right font-medium">{value}</span>
    </div>
  );
}

export function flattenDepartments(items: DepartmentTreeItem[]) {
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

export function defaultRoleCodes(roles: RoleListItem[]) {
  const viewer = roles.find((role) => role.code === 'tenant_viewer');
  if (viewer) return [viewer.code];

  return roles[0] ? [roles[0].code] : ['tenant_viewer'];
}
