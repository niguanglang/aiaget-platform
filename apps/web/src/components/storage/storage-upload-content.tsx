'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FileUp, UploadCloud } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { uploadStorageObject } from '@/lib/api-client';

import {
  fileToBase64,
  formatBytes,
  invalidateStorage,
  PageMessage,
  storageObjectDetailHref,
  StorageWorkspaceHeader,
} from './storage-shared';

export function StorageUploadContent() {
  const queryClient = useQueryClient();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadFolder, setUploadFolder] = useState('uploads');

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!selectedFile) {
        throw new Error('请选择要上传的文件。');
      }

      return uploadStorageObject({
        content_base64: await fileToBase64(selectedFile),
        content_type: selectedFile.type || 'application/octet-stream',
        file_name: selectedFile.name,
        folder: uploadFolder,
      });
    },
    onSuccess: async () => {
      setSelectedFile(null);
      await invalidateStorage(queryClient);
    },
  });

  const uploadedItem = uploadMutation.data?.item ?? null;

  return (
    <main className="relative mx-auto grid max-w-5xl gap-6 px-4 py-6 lg:px-6">
      <StorageWorkspaceHeader
        backHref="/storage"
        badge="上传文件"
        description="选择本地文件并上传到当前租户的 MinIO 前缀。上传成功后可以进入对象详情查看元数据、下载或删除。"
        title="上传文件"
      />

      {uploadMutation.isError ? <PageMessage tone="error" value={uploadMutation.error.message} /> : null}
      {uploadedItem ? (
        <PageMessage tone="success" value={`已上传 ${uploadedItem.file_name}。`} />
      ) : null}

      <Card className="grid gap-5 p-5">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <UploadCloud className="size-4 text-primary" />
          上传表单
        </div>
        <div className="grid gap-4 md:grid-cols-[260px_1fr]">
          <label className="grid gap-2 text-sm">
            <span className="font-medium">目标目录</span>
            <Input onChange={(event) => setUploadFolder(event.target.value)} placeholder="uploads" value={uploadFolder} />
          </label>

          <label className="grid gap-2 text-sm" htmlFor="storage-upload-file">
            <span className="font-medium">选择文件</span>
            <input
              className="sr-only"
              id="storage-upload-file"
              onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
              type="file"
            />
            <span className="flex h-10 cursor-pointer items-center justify-between gap-3 rounded-md border bg-background px-3 text-sm transition-colors hover:border-primary/40">
              <span className="min-w-0 truncate text-muted-foreground">
                {selectedFile ? selectedFile.name : '点击选择本地文件'}
              </span>
              <span className="shrink-0 rounded-md border bg-muted/40 px-2 py-1 text-xs text-muted-foreground">浏览</span>
            </span>
          </label>
        </div>

        <div className="rounded-md border bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
          {selectedFile ? (
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="font-medium text-foreground">{selectedFile.name}</div>
                <div>{formatBytes(selectedFile.size)} · {selectedFile.type || 'application/octet-stream'}</div>
              </div>
              <FileUp className="size-5 text-primary" />
            </div>
          ) : (
            '请选择一个文件，单次 API 上传限制为 25MB。'
          )}
        </div>

        <div className="flex flex-wrap gap-2 border-t pt-4">
          <Button disabled={!selectedFile || uploadMutation.isPending} onClick={() => uploadMutation.mutate()} type="button">
            <UploadCloud className="size-4" />
            {uploadMutation.isPending ? '正在上传...' : '上传到 MinIO'}
          </Button>
          {uploadedItem ? (
            <Button asChild type="button" variant="outline">
              <Link href={storageObjectDetailHref(uploadedItem)}>查看对象详情</Link>
            </Button>
          ) : null}
        </div>
      </Card>
    </main>
  );
}
