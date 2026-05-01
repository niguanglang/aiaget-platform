'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import type { KnowledgeSourceType } from '@aiaget/shared-types';
import { FileText, X } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { knowledgeSourceTypeLabel } from '@/components/knowledge/knowledge-status';

const sourceTypes = ['TEXT', 'MARKDOWN', 'HTML', 'FAQ'] as const satisfies readonly KnowledgeSourceType[];
type SupportedDocumentSourceType = (typeof sourceTypes)[number];

const documentFormSchema = z.object({
  title: z.string().min(2, '标题至少需要 2 个字符。').max(220, '标题过长。'),
  source_type: z.enum(sourceTypes),
  file_name: z.string().optional(),
  content: z.string().min(1, '文档内容不能为空。'),
});

export type KnowledgeDocumentFormValues = z.infer<typeof documentFormSchema>;

export function KnowledgeDocumentFormPanel({
  error,
  isPending,
  onClose,
  onSubmit,
}: {
  error?: string | null;
  isPending: boolean;
  onClose: () => void;
  onSubmit: (values: KnowledgeDocumentFormValues) => void;
}) {
  const [selectedFile, setSelectedFile] = useState<{ name: string; size: number; type: string } | null>(null);
  const form = useForm<KnowledgeDocumentFormValues>({
    resolver: zodResolver(documentFormSchema),
    defaultValues: {
      title: '',
      source_type: 'MARKDOWN',
      file_name: '',
      content: '# 知识笔记\n\n在这里粘贴文本或 Markdown 文档内容。\n\n使用清晰的标题和段落可以获得更好的切片效果。',
    },
  });

  async function loadFile(file: File | null) {
    if (!file) {
      setSelectedFile(null);
      return;
    }

    const text = await file.text();
    setSelectedFile({
      name: file.name,
      size: file.size,
      type: file.type || inferMimeType(file.name),
    });
    form.setValue('title', form.getValues('title') || file.name.replace(/\.[^.]+$/, ''));
    form.setValue('file_name', file.name);
    form.setValue('source_type', inferSourceType(file.name));
    form.setValue('content', text, { shouldValidate: true });
  }

  return (
    <section className="fixed inset-y-0 right-0 z-30 flex w-full max-w-2xl flex-col border-l bg-background/95 shadow-xl backdrop-blur">
      <div className="border-b p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">上传文档</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              原始文件会写入 MinIO，解析文本继续用于切片、索引和检索。
            </p>
          </div>
          <Button onClick={onClose} size="icon" type="button" variant="ghost">
            <X className="size-4" />
          </Button>
        </div>
      </div>

      <form className="grid flex-1 gap-5 overflow-y-auto p-6" onSubmit={form.handleSubmit(onSubmit)}>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="标题" message={form.formState.errors.title?.message}>
            <Input {...form.register('title')} />
          </Field>
          <Field label="来源类型" message={form.formState.errors.source_type?.message}>
            <select className="h-10 rounded-md border bg-background/80 px-3 text-sm" {...form.register('source_type')}>
              {sourceTypes.map((sourceType) => (
                <option key={sourceType} value={sourceType}>
                  {knowledgeSourceTypeLabel(sourceType)}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="本地文本或 Markdown 文件" message={form.formState.errors.file_name?.message}>
          <input
            accept=".txt,.md,.markdown,.html,.htm,text/plain,text/markdown,text/html"
            className="sr-only"
            id="knowledge-document-file"
            onChange={(event) => void loadFile(event.target.files?.[0] ?? null)}
            type="file"
          />
          <label
            className="flex min-h-16 cursor-pointer items-center justify-between gap-3 rounded-md border bg-background/80 px-3 py-2 transition-colors hover:border-primary/40"
            htmlFor="knowledge-document-file"
          >
            <span className="flex min-w-0 items-center gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-md border bg-muted/30">
                <FileText className="size-4 text-primary" />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium">
                  {selectedFile?.name ?? '点击选择本地文件'}
                </span>
                <span className="mt-1 block text-xs text-muted-foreground">
                  {selectedFile
                    ? `${formatFileSize(selectedFile.size)} · ${selectedFile.type}`
                    : '支持 TXT、Markdown、HTML，上传后原文保存到 MinIO。'}
                </span>
              </span>
            </span>
            <span className="shrink-0 rounded-md border bg-muted/40 px-2 py-1 text-xs text-muted-foreground">
              浏览
            </span>
          </label>
        </Field>

        <Field label="文件名" message={form.formState.errors.file_name?.message}>
          <Input {...form.register('file_name')} />
        </Field>

        <Field label="内容" message={form.formState.errors.content?.message}>
          <textarea
            className="min-h-96 resize-y rounded-md border bg-slate-950 px-3 py-3 font-mono text-sm leading-6 text-slate-100 outline-none focus-visible:ring-2 focus-visible:ring-ring"
            spellCheck={false}
            {...form.register('content')}
          />
        </Field>

        {error ? (
          <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        <div className="sticky bottom-0 -mx-6 mt-auto flex justify-end gap-2 border-t bg-background px-6 py-4">
          <Button onClick={onClose} type="button" variant="outline">
            取消
          </Button>
          <Button disabled={isPending} type="submit">
            上传并处理
          </Button>
        </div>
      </form>
    </section>
  );
}

function Field({ children, label, message }: { children: React.ReactNode; label: string; message?: string }) {
  return (
    <label className="grid gap-2 text-sm font-medium">
      {label}
      {children}
      {message ? <span className="text-xs text-destructive">{message}</span> : null}
    </label>
  );
}

function inferSourceType(fileName: string): SupportedDocumentSourceType {
  const normalized = fileName.toLowerCase();
  if (normalized.endsWith('.md') || normalized.endsWith('.markdown')) return 'MARKDOWN';
  if (normalized.endsWith('.html') || normalized.endsWith('.htm')) return 'HTML';
  return 'TEXT';
}

function inferMimeType(fileName: string) {
  const normalized = fileName.toLowerCase();
  if (normalized.endsWith('.md') || normalized.endsWith('.markdown')) return 'text/markdown';
  if (normalized.endsWith('.html') || normalized.endsWith('.htm')) return 'text/html';
  return 'text/plain';
}

function formatFileSize(value: number) {
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / 1024 / 1024).toFixed(1)} MB`;
}
