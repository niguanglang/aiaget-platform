'use client';

import type { PromptTemplateDetail, PromptVersionItem } from '@aiaget/shared-types';
import { RotateCcw, Send } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { StatusBadge } from '@/components/ui/status-badge';

import {
  formatDateTime,
  promptStatusLabel,
  promptStatusTone,
} from './prompt-status';

export function PromptVersionsCard({
  canWrite,
  note,
  prompt,
  publishPending,
  rollbackPending,
  onChangeNote,
  onPublish,
  onRollback,
}: {
  canWrite: boolean;
  note: string;
  prompt: PromptTemplateDetail;
  publishPending: boolean;
  rollbackPending: boolean;
  onChangeNote: (value: string) => void;
  onPublish: () => void;
  onRollback: (version: PromptVersionItem) => void;
}) {
  return (
    <Card>
      <div className="border-b p-4">
        <h2 className="text-sm font-semibold">版本</h2>
        <div className="mt-3 grid gap-2 md:grid-cols-[1fr_auto]">
          <input
            className="h-9 rounded-md border bg-background/80 px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onChange={(event) => onChangeNote(event.target.value)}
            placeholder="变更说明"
            value={note}
          />
          <Button disabled={!canWrite || publishPending} onClick={onPublish}>
            <Send className="size-4" />
            发布
          </Button>
        </div>
      </div>
      {prompt.versions.length === 0 ? (
        <EmptyState
          title="暂无已发布版本"
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                {['版本', '状态', '说明', '发布人', '发布时间', '操作'].map((column) => (
                  <th className="px-4 py-3 font-medium text-muted-foreground" key={column}>
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {prompt.versions.map((version) => (
                <tr className="border-b last:border-0 hover:bg-muted/25" key={version.id}>
                  <td className="px-4 py-3 font-medium">v{version.version}</td>
                  <td className="px-4 py-3">
                    <StatusBadge tone={promptStatusTone(version.status)}>{promptStatusLabel(version.status)}</StatusBadge>
                  </td>
                  <td className="max-w-[260px] truncate px-4 py-3 text-muted-foreground">
                    {version.change_note ?? '-'}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{version.created_by?.name ?? '-'}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDateTime(version.published_at)}</td>
                  <td className="px-4 py-3">
                    <Button
                      disabled={!canWrite || rollbackPending}
                      onClick={() => onRollback(version)}
                      size="sm"
                      variant="outline"
                    >
                      <RotateCcw className="size-4" />
                      回滚
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
