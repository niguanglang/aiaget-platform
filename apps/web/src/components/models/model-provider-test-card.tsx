import type { ModelProviderDetail, TestModelProviderResult } from '@aiaget/shared-types';
import { Send } from 'lucide-react';

import { formatMoney, modelCallStatusLabel, modelStatusTone } from '@/components/models/model-status';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';

export function ModelProviderTestCard({
  canWrite,
  onChangePrompt,
  onRunTest,
  provider,
  testPending,
  testPrompt,
  testResult,
}: {
  canWrite: boolean;
  onChangePrompt: (value: string) => void;
  onRunTest: () => void;
  provider: ModelProviderDetail;
  testPending: boolean;
  testPrompt: string;
  testResult: TestModelProviderResult | null;
}) {
  const defaultModel = provider.models.find((model) => model.is_default) ?? provider.models[0] ?? null;

  return (
    <Card className="grid gap-3 p-5">
      <div>
        <h2 className="text-sm font-semibold">兼容性测试</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          使用 {defaultModel ? defaultModel.model : '默认模型'} 发起一次真实模型调用，并写入调用日志。
        </p>
      </div>
      <textarea
        className="min-h-24 resize-y rounded-md border bg-background/80 px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        disabled={!canWrite}
        onChange={(event) => onChangePrompt(event.target.value)}
        value={testPrompt}
      />
      <Button disabled={!canWrite || testPending || !defaultModel || provider.api_keys.length === 0} onClick={onRunTest} type="button">
        <Send className="size-4" />
        运行测试
      </Button>

      {testResult ? (
        <div className="rounded-lg border bg-muted/20 p-4 text-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <StatusBadge tone={modelStatusTone(testResult.status)}>{modelCallStatusLabel(testResult.status)}</StatusBadge>
            <span className="text-xs text-muted-foreground">{testResult.latency_ms} ms</span>
          </div>
          <p className="mt-3 whitespace-pre-wrap text-muted-foreground">{testResult.output_text || testResult.error_message || '-'}</p>
          <div className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-3">
            <span>{testResult.request_model}</span>
            <span>{testResult.total_tokens} tokens</span>
            <span>{formatMoney(testResult.total_cost)}</span>
          </div>
          <div className="mt-2 break-all text-xs text-muted-foreground">Trace {testResult.trace_id}</div>
        </div>
      ) : null}
    </Card>
  );
}
