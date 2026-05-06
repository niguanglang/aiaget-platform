'use client';

import type {
  RenderPromptResult,
  TestPromptResult,
} from '@aiaget/shared-types';
import { FileText, FlaskConical } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';

import {
  promptTestStatusLabel,
  promptTestStatusTone,
} from './prompt-status';

export function PromptRenderTestCard({
  canWrite,
  inputText,
  renderError,
  renderPending,
  renderResult,
  testPending,
  testResult,
  onChangeInput,
  onLoadDefaults,
  onRender,
  onTest,
}: {
  canWrite: boolean;
  inputText: string;
  renderError: string | null;
  renderPending: boolean;
  renderResult: RenderPromptResult | null;
  testPending: boolean;
  testResult: TestPromptResult | null;
  onChangeInput: (value: string) => void;
  onLoadDefaults: () => void;
  onRender: () => void;
  onTest: () => void;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">渲染与测试</h2>
        <Button onClick={onLoadDefaults} size="sm" type="button" variant="outline">
          默认值
        </Button>
      </div>
      <textarea
        className="mt-3 min-h-44 w-full resize-y rounded-md border bg-slate-950 px-3 py-3 font-mono text-xs leading-5 text-slate-100 outline-none focus-visible:ring-2 focus-visible:ring-ring"
        onChange={(event) => onChangeInput(event.target.value)}
        spellCheck={false}
        value={inputText}
      />
      {renderError ? (
        <div className="mt-2 rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {renderError}
        </div>
      ) : null}
      <div className="mt-2 text-xs text-muted-foreground">
        未指定模型时，自动使用租户当前可执行的默认 chat 模型。
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button disabled={renderPending} onClick={onRender} type="button" variant="outline">
          <FileText className="size-4" />
          渲染
        </Button>
        <Button disabled={!canWrite || testPending} onClick={onTest} type="button">
          <FlaskConical className="size-4" />
          运行测试
        </Button>
      </div>
      {renderResult ? (
        <div className="mt-4 rounded-md border bg-muted/25 p-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold">渲染输出</h3>
            <span className="text-xs text-muted-foreground">
              {renderResult.missing_variables.length === 0
                ? '就绪'
                : `${renderResult.missing_variables.length} 个变量缺失`}
            </span>
          </div>
          <pre className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap break-words rounded-md bg-background p-3 text-xs leading-5">
            {renderResult.rendered_content}
          </pre>
        </div>
      ) : null}
      {testResult ? (
        <div className="mt-4 rounded-md border bg-muted/25 p-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold">测试结果</h3>
            <StatusBadge tone={promptTestStatusTone(testResult.status)}>{promptTestStatusLabel(testResult.status)}</StatusBadge>
          </div>
          <div className="mt-2 text-xs text-muted-foreground">延迟 {testResult.latency_ms}ms</div>
          <div className="mt-1 text-xs text-muted-foreground">
            {testResult.model_provider_name ?? '未指定供应商'} · {testResult.request_model ?? '未执行模型'}
          </div>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            {testResult.output_text ?? testResult.error_message ?? '暂无 Runtime 输出。'}
          </p>
        </div>
      ) : null}
    </Card>
  );
}
