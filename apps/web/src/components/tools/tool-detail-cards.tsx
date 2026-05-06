'use client';

import type { ToolDetail } from '@aiaget/shared-types';
import { ShieldAlert, Wrench } from 'lucide-react';

import { Card } from '@/components/ui/card';

import { stringifyJson } from './tool-json';
import {
  formatDateTime,
  toolAuthLabel,
  toolCallStatusLabel,
  toolMethodLabel,
  toolRiskLabel,
  toolStatusLabel,
  toolTypeLabel,
} from './tool-status';

export function ToolConfigCard({ tool }: { tool: ToolDetail }) {
  return (
    <Card className="grid gap-4 p-5">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <Wrench className="size-4" />
        HTTP 配置
      </div>
      <div className="grid gap-3 text-sm md:grid-cols-2">
        <DetailRow label="工具类型" value={toolTypeLabel(tool.tool_type)} />
        <DetailRow label="请求方法" value={toolMethodLabel(tool.method)} />
        <DetailRow label="接口链接" value={tool.url} />
        <DetailRow label="超时毫秒" value={`${tool.timeout_ms}`} />
        <DetailRow label="更新时间" value={formatDateTime(tool.updated_at)} />
        <DetailRow label="最近调用" value={tool.last_call_at ? formatDateTime(tool.last_call_at) : '暂无'} />
      </div>
      <div className="rounded-md border bg-slate-950 p-3">
        <div className="mb-2 text-xs font-medium text-slate-300">默认请求头</div>
        <pre className="max-h-56 overflow-auto whitespace-pre-wrap text-xs leading-5 text-slate-100">
          {stringifyJson(tool.headers, '{}')}
        </pre>
      </div>
    </Card>
  );
}

export function ToolPolicyCard({ tool }: { tool: ToolDetail }) {
  return (
    <Card className="grid gap-4 p-5">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <ShieldAlert className="size-4" />
        鉴权与风险策略
      </div>
      <div className="grid gap-3 text-sm md:grid-cols-2">
        <DetailRow label="工具状态" value={toolStatusLabel(tool.status)} />
        <DetailRow label="风险级别" value={toolRiskLabel(tool.risk_level)} />
        <DetailRow label="鉴权方式" value={toolAuthLabel(tool.auth_type)} />
        <DetailRow label="审批要求" value={tool.require_approval ? '需要审批' : '无需审批'} />
      </div>
      <div className="rounded-md border bg-slate-950 p-3">
        <div className="mb-2 text-xs font-medium text-slate-300">鉴权配置</div>
        <pre className="max-h-56 overflow-auto whitespace-pre-wrap text-xs leading-5 text-slate-100">
          {stringifyJson(tool.auth_config, '{}')}
        </pre>
      </div>
    </Card>
  );
}

export function ToolSchemaCard({ schema, title }: { schema: Record<string, unknown> | null; title: string }) {
  return (
    <Card className="grid gap-4 p-5">
      <div className="text-sm font-semibold">{title}</div>
      <pre className="max-h-[480px] overflow-auto rounded-md border bg-slate-950 p-4 text-xs leading-6 text-slate-100">
        {stringifyJson(schema, '{}')}
      </pre>
    </Card>
  );
}

export function ToolReferencesCard({ tool }: { tool: ToolDetail }) {
  return (
    <Card className="grid gap-4 p-5">
      <h2 className="text-sm font-semibold">智能体引用</h2>
      {tool.agent_references.length === 0 ? (
        <p className="text-sm text-muted-foreground">暂无智能体绑定该工具。</p>
      ) : (
        <div className="grid gap-3">
          {tool.agent_references.map((reference) => (
            <div className="rounded-md border bg-muted/20 px-3 py-2" key={reference.id}>
              <div className="text-sm font-medium">{reference.agent_name}</div>
              <div className="mt-1 text-xs text-muted-foreground">
                {reference.agent_code} · {reference.require_approval ? '绑定时要求审批' : '绑定时无需审批'} · {formatDateTime(reference.created_at)}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

export function ToolUsageCard({ tool }: { tool: ToolDetail }) {
  return (
    <Card className="grid gap-4 p-5">
      <h2 className="text-sm font-semibold">使用摘要</h2>
      <div className="grid gap-3 text-sm">
        <DetailRow label="今日调用" value={`${tool.call_count_today}`} />
        <DetailRow label="今日失败" value={`${tool.failure_count_today}`} />
        <DetailRow label="最近调用状态" value={tool.last_call_status ? toolCallStatusLabel(tool.last_call_status) : '暂无'} />
        <DetailRow label="绑定智能体" value={`${tool.agent_reference_count}`} />
      </div>
    </Card>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 rounded-md border bg-muted/25 px-3 py-2">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="break-words font-medium">{value}</div>
    </div>
  );
}
