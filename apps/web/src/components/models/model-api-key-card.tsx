import type { ModelApiKeyItem, ModelProviderDetail } from '@aiaget/shared-types';
import { KeyRound, Trash2 } from 'lucide-react';

import { formatDateTime } from '@/components/models/model-status';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export function ModelApiKeyCard({
  apiKey,
  canWrite,
  createKeyPending,
  deleteKeyPending,
  keyName,
  onAddKey,
  onChangeApiKey,
  onChangeKeyName,
  onDeleteKey,
  provider,
}: {
  apiKey: string;
  canWrite: boolean;
  createKeyPending: boolean;
  deleteKeyPending: boolean;
  keyName: string;
  onAddKey: () => void;
  onChangeApiKey: (value: string) => void;
  onChangeKeyName: (value: string) => void;
  onDeleteKey: (key: ModelApiKeyItem) => void;
  provider: ModelProviderDetail;
}) {
  return (
    <Card className="grid gap-3 p-5">
      <div>
        <h2 className="text-sm font-semibold">接口密钥</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          密钥仅写入一次，仅显示脱敏内容和最近使用时间。
        </p>
      </div>

      {provider.api_keys.length === 0 ? (
        <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
          暂无接口密钥。添加后即可执行兼容性测试和真实模型调用。
        </div>
      ) : (
        <div className="grid gap-2">
          {provider.api_keys.map((key) => (
            <div className="flex items-center justify-between gap-3 rounded-lg border bg-background/80 px-3 py-2" key={key.id}>
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <KeyRound className="size-4 text-muted-foreground" />
                  {key.name}
                </div>
                <div className="mt-1 break-all text-xs text-muted-foreground">
                  {key.masked_key} · 前缀 {key.key_prefix} · 最近使用 {formatDateTime(key.last_used_at)}
                </div>
              </div>
              <Button disabled={!canWrite || deleteKeyPending} onClick={() => onDeleteKey(key)} size="sm" type="button" variant="outline">
                <Trash2 className="size-4" />
                删除
              </Button>
            </div>
          ))}
        </div>
      )}

      <div className="grid gap-2">
        <Input disabled={!canWrite} onChange={(event) => onChangeKeyName(event.target.value)} placeholder="密钥名称" value={keyName} />
        <Input disabled={!canWrite} onChange={(event) => onChangeApiKey(event.target.value)} placeholder="仅粘贴一次接口密钥" type="password" value={apiKey} />
        <Button
          disabled={!canWrite || createKeyPending || keyName.trim().length < 1 || apiKey.trim().length < 8}
          onClick={onAddKey}
          type="button"
          variant="outline"
        >
          <KeyRound className="size-4" />
          添加脱敏密钥
        </Button>
      </div>
    </Card>
  );
}
