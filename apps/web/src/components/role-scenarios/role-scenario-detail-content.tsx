'use client';

import { hasPermission } from '@aiaget/shared-types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Edit, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { useAuth } from '@/components/auth/auth-provider';
import {
  formatDateTime,
  impactTone,
  scenarioPriorityLabel,
  scenarioPriorityTone,
  scenarioStatusLabel,
  scenarioStatusTone,
  scenarioTypeLabel,
} from '@/components/role-scenarios/role-scenario-status';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { deleteRoleScenario, getRoleScenario, type ApiClientError } from '@/lib/api-client';

export function RoleScenarioDetailContent({ scenarioId }: { scenarioId: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();
  const [confirmArchive, setConfirmArchive] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const canWrite = Boolean(
    currentUser?.user.roles.some((role) => role.code === 'tenant_admin') ||
      hasPermission(currentUser?.user.permissions ?? [], 'scenario:package:manage'),
  );

  const scenarioQuery = useQuery({
    queryKey: ['role-scenario', scenarioId],
    queryFn: () => getRoleScenario(scenarioId),
  });

  const archiveMutation = useMutation({
    mutationFn: deleteRoleScenario,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['role-scenarios'] });
      router.push('/role-scenarios');
    },
    onError: (error: ApiClientError) => setActionError(error.message),
  });

  if (scenarioQuery.isLoading) {
    return (
      <main className="mx-auto grid max-w-[1680px] gap-6 rounded-xl border border-slate-200/80 bg-white/[0.9] px-4 py-6 lg:px-6">
        <Card className="p-6 text-sm text-muted-foreground">正在加载岗位场景...</Card>
      </main>
    );
  }

  if (scenarioQuery.isError || !scenarioQuery.data) {
    return (
      <main className="mx-auto grid max-w-[1680px] gap-6 rounded-xl border border-slate-200/80 bg-white/[0.9] px-4 py-6 lg:px-6">
        <Card className="p-6 text-sm text-destructive">岗位场景加载失败。</Card>
      </main>
    );
  }

  const scenario = scenarioQuery.data;

  return (
    <main className="mx-auto grid max-w-[1680px] gap-6 rounded-xl border border-slate-200/80 bg-white/[0.9] px-4 py-6 lg:px-6">
      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <StatusBadge tone="planned">{scenarioTypeLabel(scenario.scenario_type)}</StatusBadge>
            <StatusBadge tone={scenarioStatusTone(scenario.status)}>{scenarioStatusLabel(scenario.status)}</StatusBadge>
            <StatusBadge tone={scenarioPriorityTone(scenario.priority)}>优先级 {scenarioPriorityLabel(scenario.priority)}</StatusBadge>
            <StatusBadge tone={impactTone(scenario.impact_score)}>价值 {scenario.impact_score}</StatusBadge>
          </div>
          <h1 className="text-2xl font-semibold">{scenario.name}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {scenario.role_name} / {scenario.department_name} · 更新于 {formatDateTime(scenario.updated_at)}
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button asChild variant="outline">
            <Link href="/role-scenarios">
              <ArrowLeft className="size-4" />
              返回
            </Link>
          </Button>
          <Button asChild disabled={!canWrite} variant="outline">
            <Link href={`/role-scenarios/${scenario.id}/edit`}>
              <Edit className="size-4" />
              编辑
            </Link>
          </Button>
          <Button disabled={!canWrite} onClick={() => setConfirmArchive(true)} variant="outline">
            <Trash2 className="size-4" />
            归档
          </Button>
        </div>
      </section>

      {actionError ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">{actionError}</div>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
        <div className="grid gap-4">
          <Card className="p-5">
            <h2 className="text-base font-semibold">基础信息</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Info label="编码" value={scenario.code} />
              <Info label="负责人" value={scenario.owner?.name ?? '-'} />
              <Info label="目标岗位" value={scenario.role_name} />
              <Info label="适用部门" value={scenario.department_name} />
            </div>
          </Card>

          <DetailSection title="业务痛点" value={scenario.pain_point} />
          <DetailSection title="业务目标" value={scenario.business_goal} />
          <DetailSection title="流程编排" value={scenario.workflow_summary} />
          <DetailSection title="预期成果" value={scenario.expected_outcome} />
          <DetailSection title="交付成果" value={scenario.sample_deliverable} />
          <DetailSection title="验收标准" value={scenario.acceptance_criteria} />
          <DetailSection title="ROI 指标" value={scenario.roi_metric} />
          {scenario.notes ? <DetailSection title="备注" value={scenario.notes} /> : null}
        </div>

        <div className="grid gap-4 self-start">
          <Card className="p-5">
            <h2 className="text-base font-semibold">关联资产</h2>
            <div className="mt-4 grid gap-3">
              <Asset label="Agent" value={scenario.linked_resources.agent} />
              <Asset label="Skill" value={scenario.linked_resources.skill} />
              <Asset label="知识库" value={scenario.linked_resources.knowledge} />
              <Asset label="工具" value={scenario.linked_resources.tool} />
              <Asset label="提示词" value={scenario.linked_resources.prompt} />
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="text-base font-semibold">标签</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {scenario.tags.length > 0 ? scenario.tags.map((tag) => (
                <span className="rounded-md border bg-muted/40 px-2 py-1 text-xs text-muted-foreground" key={tag}>{tag}</span>
              )) : <span className="text-sm text-muted-foreground">暂无标签</span>}
            </div>
          </Card>
        </div>
      </section>

      {confirmArchive ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-background/70 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-md p-5 shadow-lg">
            <h2 className="text-base font-semibold">确认归档岗位场景</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">归档后该场景包不会出现在默认清单中。当前对象：{scenario.name}</p>
            <div className="mt-5 flex justify-end gap-2">
              <Button onClick={() => setConfirmArchive(false)} variant="outline">取消</Button>
              <Button disabled={archiveMutation.isPending} onClick={() => archiveMutation.mutate(scenario.id)}>确认归档</Button>
            </div>
          </Card>
        </div>
      ) : null}
    </main>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm">{value}</span>
    </div>
  );
}

function DetailSection({ title, value }: { title: string; value: string }) {
  return (
    <Card className="p-5">
      <h2 className="text-base font-semibold">{title}</h2>
      <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-muted-foreground">{value}</p>
    </Card>
  );
}

function Asset({
  label,
  value,
}: {
  label: string;
  value: { id: string; name: string; code: string; status: string; extra?: string | null } | null;
}) {
  return (
    <div className="rounded-md border bg-background/70 p-3">
      <div className="flex items-start justify-between gap-3">
        <span className="text-sm font-medium">{label}</span>
        <StatusBadge tone={value ? 'ready' : 'muted'}>{value ? value.status : '未绑定'}</StatusBadge>
      </div>
      {value ? (
        <div className="mt-2 grid gap-1 text-sm text-muted-foreground">
          <span>{value.name}</span>
          <span>{value.code}{value.extra ? ` · ${value.extra}` : ''}</span>
        </div>
      ) : null}
    </div>
  );
}
