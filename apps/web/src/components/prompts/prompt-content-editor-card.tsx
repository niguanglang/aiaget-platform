'use client';

import { Save } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export function PromptContentEditorCard({
  canWrite,
  content,
  pending,
  onChangeContent,
  onSave,
}: {
  canWrite: boolean;
  content: string;
  pending: boolean;
  onChangeContent: (value: string) => void;
  onSave: () => void;
}) {
  return (
    <Card>
      <div className="flex flex-col justify-between gap-3 border-b p-4 md:flex-row md:items-center">
        <h2 className="text-sm font-semibold">提示词编辑器</h2>
        <Button disabled={!canWrite || pending || content.trim().length === 0} onClick={onSave}>
          <Save className="size-4" />
          保存内容
        </Button>
      </div>
      <div className="p-4">
        <textarea
          className="min-h-[420px] w-full resize-y rounded-md border bg-slate-950 px-4 py-4 font-mono text-sm leading-6 text-slate-100 outline-none focus-visible:ring-2 focus-visible:ring-ring"
          disabled={!canWrite}
          onChange={(event) => onChangeContent(event.target.value)}
          spellCheck={false}
          value={content}
        />
      </div>
    </Card>
  );
}
