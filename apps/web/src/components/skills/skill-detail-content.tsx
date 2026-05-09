'use client';

import { hasPermission, type SkillDetail } from '@aiaget/shared-types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Copy, Edit, Send, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

import { useAuth } from '@/components/auth/auth-provider';
import { SkillCenterBackground } from '@/components/skills/skill-center-background';
import { formatDateTime, skillCategoryLabel, skillStatusLabel, skillStatusTone } from '@/components/skills/skill-status';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { MetricCard } from '@/components/ui/metric-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { copySkill, deleteSkill, getSkill, publishSkill, type ApiClientError } from '@/lib/api-client';

type ActionTarget = 'publish' | 'delete' | null;

export function SkillDetailContent({ skillId }: { skillId: string }) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { currentUser } = useAuth();
  const [actionTarget, setActionTarget] = useState<ActionTarget>(null);
  const [changeNote, setChangeNote] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);

  const canWrite = Boolean(
    currentUser?.user.roles.some((role) => role.code === 'tenant_admin') ||
      hasPermission(currentUser?.user.permissions ?? [], 'skill:hub:manage'),
  );

  const skillQuery = useQuery({
    queryKey: ['skill', skillId],
    queryFn: () => getSkill(skillId),
  });

  const skill = skillQuery.data ?? null;
  const metrics = useMemo(() => {
    if (!skill) return [];

    return [
      { label: '版本', value: `v${skill.version}`, helper: skillStatusLabel(skill.status) },
      { label: '版本记录', value: `${skill.versions.length}`, helper: '发布快照' },
      { label: 'Agent 引用', value: `${skill.agent_references.length}`, helper: '绑定关系' },
      { label: '标签', value: `${skill.tags.length}`, helper: '资产分类' },
    ];
  }, [skill]);

  const publishMutation = useMutation({
    mutationFn: () => publishSkill(skillId, { change_note: changeNote.trim() || null }),
    onSuccess: async (result) => {
      await refreshSkill(result);
      setActionTarget(null);
      setChangeNote('');
      setActionError(null);
    },
    onError: (error: ApiClientError) => setActionError(error.message),
  });

  const copyMutation = useMutation({
    mutationFn: copySkill,
    onSuccess: async (result) => {
      queryClient.setQueryData(['skill', result.id], result);
      await queryClient.invalidateQueries({ queryKey: ['skills'] });
      router.push(`/skills/${result.id}`);
    },
    onError: (error: ApiClientError) => setActionError(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteSkill,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['skills'] });
      router.push('/skills');
    },
    onError: (error: ApiClientError) => setActionError(error.message),
  });

  async function refreshSkill(result: SkillDetail) {
    queryClient.setQueryData(['skill', result.id], result);
    await queryClient.invalidateQueries({ queryKey: ['skills'] });
  }

  if (skillQuery.isLoading) {
    return (
      <main className="relative mx-auto max-w-7xl px-4 py-6 lg:px-6">
        <SkillCenterBackground />
        <Card className="p-6">
          <div className="text-sm text-muted-foreground">正在加载 Skill 详情...</div>
        </Card>
      </main>
    );
  }

  if (skillQuery.isError || !skill) {
    return (
      <main className="relative mx-auto grid max-w-7xl gap-4 px-4 py-6 lg:px-6">
        <SkillCenterBackground />
        <Button asChild className="w-fit" variant="outline">
          <Link href="/skills">
            <ArrowLeft className="size-4" />
            返回技能资产中心
          </Link>
        </Button>
        <Card className="p-6">
          <div className="text-sm text-destructive">Skill 详情加载失败。</div>
        </Card>
      </main>
    );
  }

  return (
    <main className="relative mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:px-6">
      <SkillCenterBackground />

      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <Button asChild className="mb-4 w-fit" variant="outline">
            <Link href="/skills">
              <ArrowLeft className="size-4" />
              技能资产中心
            </Link>
          </Button>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <StatusBadge tone="ready">Skill 详情</StatusBadge>
            <StatusBadge tone={skillStatusTone(skill.status)}>{skillStatusLabel(skill.status)}</StatusBadge>
            <StatusBadge tone="planned">{skillCategoryLabel(skill.category)}</StatusBadge>
          </div>
          <h1 className="break-words text-2xl font-semibold">{skill.name}</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            {skill.description ?? '暂无描述。'} 这里维护完整 SOP 信息、版本记录和 Agent 引用。
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {skill.tags.map((tag) => (
              <StatusBadge key={tag} tone="planned">
                {tag}
              </StatusBadge>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild disabled={!canWrite} variant="outline">
            <Link href={`/skills/${skill.id}/edit`}>
              <Edit className="size-4" />
              编辑
            </Link>
          </Button>
          <Button disabled={!canWrite || copyMutation.isPending} onClick={() => copyMutation.mutate(skill.id)} variant="outline">
            <Copy className="size-4" />
            复制
          </Button>
          <Button disabled={!canWrite || publishMutation.isPending} onClick={() => setActionTarget('publish')}>
            <Send className="size-4" />
            发布版本
          </Button>
          <Button disabled={!canWrite || deleteMutation.isPending} onClick={() => setActionTarget('delete')} variant="outline">
            <Trash2 className="size-4" />
            删除
          </Button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <MetricCard helper={metric.helper} key={metric.label} label={metric.label} value={metric.value} />
        ))}
      </section>

      {actionError ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {actionError}
        </div>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <TextCard title="触发场景" value={skill.trigger_scenario} />
        <TextCard title="输入要求" value={skill.input_requirements} />
        <TextCard title="执行步骤" value={skill.execution_steps} />
        <TextCard title="输出结构" value={skill.output_format} />
        <TextCard title="质量标准" value={skill.quality_criteria} />
        <TextCard title="边界规则" value={skill.boundary_rules} />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <Card className="p-5">
          <h2 className="text-base font-semibold">版本记录</h2>
          <div className="mt-4 grid gap-3">
            {skill.versions.length === 0 ? (
              <div className="rounded-md border bg-muted/30 p-3 text-sm text-muted-foreground">暂无发布版本。</div>
            ) : (
              skill.versions.map((version) => (
                <div className="rounded-md border p-3" key={version.id}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="font-medium">v{version.version}</div>
                    <StatusBadge tone={skillStatusTone(version.status)}>{skillStatusLabel(version.status)}</StatusBadge>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{version.change_note ?? '无发布说明'}</p>
                  <div className="mt-2 text-xs text-muted-foreground">
                    {formatDateTime(version.published_at ?? version.created_at)} · {version.created_by?.name ?? '系统'}
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-base font-semibold">Agent 引用</h2>
          <div className="mt-4 grid gap-3">
            {skill.agent_references.length === 0 ? (
              <div className="rounded-md border bg-muted/30 p-3 text-sm text-muted-foreground">暂无 Agent 引用。</div>
            ) : (
              skill.agent_references.map((reference) => (
                <div className="rounded-md border p-3" key={reference.id}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Link className="font-medium hover:text-primary" href={`/agents/${reference.agent_id}`}>
                      {reference.agent_name}
                    </Link>
                    <StatusBadge tone={reference.binding_type === 'PRIMARY' ? 'healthy' : 'planned'}>
                      {reference.binding_type === 'PRIMARY' ? '主技能' : '辅助技能'}
                    </StatusBadge>
                  </div>
                  <div className="mt-2 text-sm text-muted-foreground">
                    {reference.agent_code} · {reference.agent_status} · 排序 {reference.sort_order}
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </section>

      <Card className="p-5">
        <h2 className="text-base font-semibold">审计记录</h2>
        <div className="mt-4 grid gap-3">
          {skill.audit_records.map((record) => (
            <div className="rounded-md border p-3" key={record.id}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="font-medium">{record.action}</div>
                <span className="text-xs text-muted-foreground">{formatDateTime(record.created_at)}</span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{record.message}</p>
            </div>
          ))}
        </div>
      </Card>

      {actionTarget === 'publish' ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/35 px-4 backdrop-blur-sm">
          <Card className="w-full max-w-md p-5">
            <h2 className="text-lg font-semibold">发布 Skill 版本</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">发布会创建不可变版本快照，供 Agent 绑定和审计追溯。</p>
            <textarea
              className="mt-4 min-h-24 w-full resize-y rounded-md border bg-background/80 px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onChange={(event) => setChangeNote(event.target.value)}
              placeholder="发布说明"
              value={changeNote}
            />
            <div className="mt-5 flex justify-end gap-2">
              <Button onClick={() => setActionTarget(null)} type="button" variant="outline">
                取消
              </Button>
              <Button disabled={publishMutation.isPending} onClick={() => publishMutation.mutate()} type="button">
                确认发布
              </Button>
            </div>
          </Card>
        </div>
      ) : null}

      {actionTarget === 'delete' ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/35 px-4 backdrop-blur-sm">
          <Card className="w-full max-w-md p-5">
            <h2 className="text-lg font-semibold">删除 Skill？</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">这会归档 {skill.name}，并保留已有版本和审计记录。</p>
            <div className="mt-5 flex justify-end gap-2">
              <Button onClick={() => setActionTarget(null)} type="button" variant="outline">
                取消
              </Button>
              <Button disabled={deleteMutation.isPending} onClick={() => deleteMutation.mutate(skill.id)} type="button" variant="destructive">
                确认删除
              </Button>
            </div>
          </Card>
        </div>
      ) : null}
    </main>
  );
}

function TextCard({ title, value }: { title: string; value: string }) {
  return (
    <Card className="p-5">
      <h2 className="text-base font-semibold">{title}</h2>
      <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{value}</p>
    </Card>
  );
}
