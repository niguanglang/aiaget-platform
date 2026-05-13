'use client';

import { hasPermission, type RoleScenarioListItem } from '@aiaget/shared-types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Edit, Eye, Plus, Search, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';
import Link from 'next/link';
import { useMemo, useState } from 'react';

import { useAuth } from '@/components/auth/auth-provider';
import { RoleScenarioBackground } from '@/components/role-scenarios/role-scenario-background';
import {
  formatDateTime,
  impactTone,
  scenarioPriorities,
  scenarioPriorityLabel,
  scenarioPriorityTone,
  scenarioStatuses,
  scenarioStatusLabel,
  scenarioStatusTone,
  scenarioTypeLabel,
  scenarioTypes,
} from '@/components/role-scenarios/role-scenario-status';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { MetricCard } from '@/components/ui/metric-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { deleteRoleScenario, listRoleScenarios, listUsers, type ApiClientError } from '@/lib/api-client';

const pageSize = 20;

export function RoleScenariosContent() {
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();
  const [keyword, setKeyword] = useState('');
  const [scenarioType, setScenarioType] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [ownerId, setOwnerId] = useState('');
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<RoleScenarioListItem | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const canWrite = Boolean(
    currentUser?.user.roles.some((role) => role.code === 'tenant_admin') ||
      hasPermission(currentUser?.user.permissions ?? [], 'scenario:package:manage'),
  );

  const scenariosQuery = useQuery({
    queryKey: ['role-scenarios', page, keyword, scenarioType, status, priority, ownerId],
    queryFn: () =>
      listRoleScenarios({
        page,
        page_size: pageSize,
        keyword,
        scenario_type: scenarioType,
        status,
        priority,
        owner_id: ownerId,
      }),
  });
  const ownersQuery = useQuery({
    queryKey: ['role-scenario-owners'],
    queryFn: () => listUsers({ page: 1, page_size: 100, status: 'ACTIVE' }),
  });

  const scenarios = scenariosQuery.data?.items ?? [];
  const owners = ownersQuery.data?.items ?? [];
  const total = scenariosQuery.data?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  const metrics = useMemo(
    () => [
      { label: '场景包', value: `${total}`, helper: '租户范围' },
      { label: '高价值', value: `${scenarios.filter((item) => item.impact_score >= 80).length}`, helper: '当前页 80+' },
      { label: '试点中', value: `${scenarios.filter((item) => item.status === 'PILOTING').length}`, helper: '当前页' },
      { label: '资产齐套', value: `${scenarios.filter((item) => assetCount(item) >= 5).length}`, helper: '五类资产' },
    ],
    [scenarios, total],
  );

  const deleteMutation = useMutation({
    mutationFn: deleteRoleScenario,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['role-scenarios'] });
      setDeleteTarget(null);
      setActionError(null);
    },
    onError: (error: ApiClientError) => setActionError(error.message),
  });

  function updateFilter(setter: (value: string) => void, value: string) {
    setter(value);
    setPage(1);
  }

  function clearFilters() {
    setKeyword('');
    setScenarioType('');
    setStatus('');
    setPriority('');
    setOwnerId('');
    setPage(1);
  }

  return (
    <main className="relative mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:px-6">
      <RoleScenarioBackground />

      <motion.section
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col justify-between gap-4 md:flex-row md:items-start"
        initial={{ opacity: 0, y: 10 }}
        transition={{ duration: 0.32, ease: 'easeOut' }}
      >
        <div>
          <h1 className="text-2xl font-semibold">岗位场景</h1>
        </div>
        {canWrite ? (
          <Button asChild className="w-full md:w-auto">
            <Link href="/role-scenarios/create">
              <Plus className="size-4" />
              新建场景包
            </Link>
          </Button>
        ) : (
          <Button className="w-full md:w-auto" disabled>
            <Plus className="size-4" />
            新建场景包
          </Button>
        )}
      </motion.section>

      <motion.section
        animate={{ opacity: 1, y: 0 }}
        className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"
        initial={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.04, duration: 0.32, ease: 'easeOut' }}
      >
        {metrics.map((metric) => (
          <MetricCard helper={metric.helper} key={metric.label} label={metric.label} value={metric.value} />
        ))}
      </motion.section>

      {actionError ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {actionError}
        </div>
      ) : null}

      <Card>
        <div className="border-b p-4">
          <div className="grid gap-4">
            <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
              <h2 className="text-sm font-semibold">场景包清单</h2>
              <div className="text-sm text-muted-foreground">显示 {scenarios.length} / {total}</div>
            </div>

            <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-[1fr_140px_140px_120px_180px_auto]">
              <label className="flex h-9 items-center gap-2 rounded-md border bg-background/70 px-3 text-sm">
                <Search className="size-4 text-muted-foreground" />
                <input
                  className="min-w-0 flex-1 bg-transparent outline-none"
                  onChange={(event) => updateFilter(setKeyword, event.target.value)}
                  placeholder="搜索场景、岗位、痛点、流程"
                  value={keyword}
                />
              </label>
              <select className="h-9 rounded-md border bg-background/80 px-3 text-sm" onChange={(event) => updateFilter(setScenarioType, event.target.value)} value={scenarioType}>
                <option value="">全部类型</option>
                {scenarioTypes.map((option) => (
                  <option key={option} value={option}>{scenarioTypeLabel(option)}</option>
                ))}
              </select>
              <select className="h-9 rounded-md border bg-background/80 px-3 text-sm" onChange={(event) => updateFilter(setStatus, event.target.value)} value={status}>
                <option value="">全部状态</option>
                {scenarioStatuses.map((option) => (
                  <option key={option} value={option}>{scenarioStatusLabel(option)}</option>
                ))}
              </select>
              <select className="h-9 rounded-md border bg-background/80 px-3 text-sm" onChange={(event) => updateFilter(setPriority, event.target.value)} value={priority}>
                <option value="">全部优先级</option>
                {scenarioPriorities.map((option) => (
                  <option key={option} value={option}>{scenarioPriorityLabel(option)}</option>
                ))}
              </select>
              <select className="h-9 rounded-md border bg-background/80 px-3 text-sm" onChange={(event) => updateFilter(setOwnerId, event.target.value)} value={ownerId}>
                <option value="">全部负责人</option>
                {owners.map((owner) => (
                  <option key={owner.id} value={owner.id}>{owner.name}</option>
                ))}
              </select>
              <Button onClick={clearFilters} type="button" variant="outline">清空</Button>
            </div>
          </div>
        </div>

        {scenariosQuery.isError ? (
          <div className="p-6 text-sm text-destructive">岗位场景加载失败。</div>
        ) : scenariosQuery.isLoading ? (
          <div className="p-6 text-sm text-muted-foreground">正在加载岗位场景...</div>
        ) : scenarios.length === 0 ? (
          <EmptyState
            action={
              canWrite ? (
                <Button asChild>
                  <Link href="/role-scenarios/create">
                    <Plus className="size-4" />
                    新建场景包
                  </Link>
                </Button>
              ) : null
            }
            title="暂无岗位场景"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1240px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  {['场景包', '岗位/部门', '状态', '价值评分', '痛点预览', '流程预览', '关联资产', '负责人', '更新时间', '操作'].map((column) => (
                    <th className="px-4 py-3 font-medium text-muted-foreground" key={column}>{column}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {scenarios.map((scenario, index) => (
                  <motion.tr
                    animate={{ opacity: 1, y: 0 }}
                    className="border-b transition-colors last:border-0 hover:bg-muted/25"
                    initial={{ opacity: 0, y: 8 }}
                    key={scenario.id}
                    transition={{ delay: index * 0.025, duration: 0.22 }}
                  >
                    <td className="px-4 py-3">
                      <div className="grid max-w-60 gap-1">
                        <Link className="font-medium hover:text-primary" href={`/role-scenarios/${scenario.id}`}>{scenario.name}</Link>
                        <span className="text-xs text-muted-foreground">{scenario.code}</span>
                        <div className="flex flex-wrap gap-1">
                          {scenario.tags.slice(0, 3).map((tag) => (
                            <span className="rounded-md border bg-background px-1.5 py-0.5 text-[11px] text-muted-foreground" key={tag}>{tag}</span>
                          ))}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="grid gap-1">
                        <span>{scenario.role_name}</span>
                        <span className="text-xs text-muted-foreground">{scenario.department_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        <StatusBadge tone="planned">{scenarioTypeLabel(scenario.scenario_type)}</StatusBadge>
                        <StatusBadge tone={scenarioStatusTone(scenario.status)}>{scenarioStatusLabel(scenario.status)}</StatusBadge>
                        <StatusBadge tone={scenarioPriorityTone(scenario.priority)}>{scenarioPriorityLabel(scenario.priority)}</StatusBadge>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge tone={impactTone(scenario.impact_score)}>{scenario.impact_score}</StatusBadge>
                    </td>
                    <td className="px-4 py-3">
                      <span className="line-clamp-2 max-w-56 text-muted-foreground">{scenario.pain_point_preview}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="line-clamp-2 max-w-64 text-muted-foreground">{scenario.workflow_preview}</span>
                    </td>
                    <td className="px-4 py-3">
                      <AssetChips scenario={scenario} />
                    </td>
                    <td className="px-4 py-3">{scenario.owner?.name ?? '-'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDateTime(scenario.updated_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/role-scenarios/${scenario.id}`}>
                            <Eye className="size-3.5" />
                            详情
                          </Link>
                        </Button>
                        <Button asChild disabled={!canWrite} size="sm" variant="outline">
                          <Link href={`/role-scenarios/${scenario.id}/edit`}>
                            <Edit className="size-3.5" />
                            编辑
                          </Link>
                        </Button>
                        <Button disabled={!canWrite} onClick={() => setDeleteTarget(scenario)} size="sm" variant="outline">
                          <Trash2 className="size-3.5" />
                          归档
                        </Button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex flex-col gap-3 border-t p-4 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
          <span>第 {page} / {pageCount} 页</span>
          <div className="flex gap-2">
            <Button disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))} variant="outline">上一页</Button>
            <Button disabled={page >= pageCount} onClick={() => setPage((value) => Math.min(pageCount, value + 1))} variant="outline">下一页</Button>
          </div>
        </div>
      </Card>

      {deleteTarget ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-background/70 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-md p-5 shadow-lg">
            <h2 className="text-base font-semibold">确认归档岗位场景</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              归档后该场景包不会出现在默认清单中。当前对象：{deleteTarget.name}
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <Button onClick={() => setDeleteTarget(null)} variant="outline">取消</Button>
              <Button disabled={deleteMutation.isPending} onClick={() => deleteMutation.mutate(deleteTarget.id)}>确认归档</Button>
            </div>
          </Card>
        </div>
      ) : null}
    </main>
  );
}

function AssetChips({ scenario }: { scenario: RoleScenarioListItem }) {
  const assets = [
    ['Agent', scenario.linked_resources.agent],
    ['Skill', scenario.linked_resources.skill],
    ['知识库', scenario.linked_resources.knowledge],
    ['工具', scenario.linked_resources.tool],
    ['提示词', scenario.linked_resources.prompt],
  ] as const;

  return (
    <div className="flex max-w-56 flex-wrap gap-1.5">
      {assets.map(([label, asset]) => (
        <span className="rounded-md border bg-background px-1.5 py-0.5 text-[11px] text-muted-foreground" key={label}>
          {asset ? label : `${label}未绑`}
        </span>
      ))}
    </div>
  );
}

function assetCount(scenario: RoleScenarioListItem) {
  return [
    scenario.linked_resources.agent,
    scenario.linked_resources.skill,
    scenario.linked_resources.knowledge,
    scenario.linked_resources.tool,
    scenario.linked_resources.prompt,
  ].filter(Boolean).length;
}
