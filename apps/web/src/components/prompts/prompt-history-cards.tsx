'use client';

import type { PromptTemplateDetail } from '@aiaget/shared-types';

import { Card } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';

import {
  formatDateTime,
  promptTestStatusLabel,
  promptTestStatusTone,
  promptTypeLabel,
} from './prompt-status';

export function PromptMetadataCard({ prompt }: { prompt: PromptTemplateDetail }) {
  return (
    <Card className="p-5">
      <h2 className="text-sm font-semibold">模板资料</h2>
      <div className="mt-4 grid gap-3 text-sm">
        <DetailRow label="编码" value={prompt.code} />
        <DetailRow label="负责人" value={prompt.owner?.email ?? '-'} />
        <DetailRow label="创建时间" value={formatDateTime(prompt.created_at)} />
        <DetailRow label="更新时间" value={formatDateTime(prompt.updated_at)} />
      </div>
    </Card>
  );
}

export function PromptRecentTestsCard({ prompt }: { prompt: PromptTemplateDetail }) {
  return (
    <Card className="p-5">
      <h2 className="text-sm font-semibold">最近测试</h2>
      <div className="mt-4 grid gap-3">
        {prompt.test_records.length === 0 ? (
          <p className="text-sm text-muted-foreground">暂无测试记录。</p>
        ) : (
          prompt.test_records.slice(0, 5).map((record) => (
            <div className="rounded-md border bg-muted/25 px-3 py-2" key={record.id}>
              <div className="flex items-center justify-between gap-2">
                <StatusBadge tone={promptTestStatusTone(record.status)}>{promptTestStatusLabel(record.status)}</StatusBadge>
                <span className="text-xs text-muted-foreground">{formatDateTime(record.created_at)}</span>
              </div>
              <div className="mt-2 text-xs text-muted-foreground">延迟 {record.latency_ms}ms</div>
              <div className="mt-1 text-xs text-muted-foreground">
                {record.model_provider_name ?? '未指定供应商'} · {record.request_model ?? '未执行模型'}
              </div>
              <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">
                {record.output_text ?? record.error_message ?? record.rendered_content}
              </p>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}

export function PromptAgentReferencesCard({ prompt }: { prompt: PromptTemplateDetail }) {
  return (
    <Card className="p-5">
      <h2 className="text-sm font-semibold">智能体引用</h2>
      <div className="mt-4 grid gap-3">
        {prompt.agent_references.length === 0 ? (
          <p className="text-sm leading-6 text-muted-foreground">
            暂无智能体引用该提示词。配置智能体提示词绑定后会显示在这里。
          </p>
        ) : (
          prompt.agent_references.map((reference) => (
            <div className="rounded-md border bg-muted/25 px-3 py-2" key={reference.id}>
              <div className="font-medium">{reference.agent_name}</div>
              <div className="mt-1 text-xs text-muted-foreground">
                {reference.agent_code} · {promptTypeLabel(reference.prompt_type as PromptTemplateDetail['type'])} · {formatDateTime(reference.created_at)}
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}

export function PromptActivityCard({ prompt }: { prompt: PromptTemplateDetail }) {
  return (
    <Card className="p-5">
      <h2 className="text-sm font-semibold">活动</h2>
      <div className="mt-4 grid gap-3">
        {prompt.audit_records.map((record) => (
          <div className="rounded-md border bg-muted/25 px-3 py-2" key={record.id}>
            <div className="flex items-center justify-between gap-2">
              <div className="text-sm font-medium">{record.action}</div>
              <span className="text-xs text-muted-foreground">{formatDateTime(record.created_at)}</span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{record.message}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 rounded-md border bg-muted/30 px-3 py-2">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="break-words font-medium">{value}</div>
    </div>
  );
}
