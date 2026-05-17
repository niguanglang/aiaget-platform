'use client';

import { hasPermission, type SkillCategory, type SkillListItem, type SkillStatus } from '@aiaget/shared-types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ClipboardList,
  Copy,
  Edit,
  Eye,
  FileText,
  Layers3,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Send,
  Trash2,
  UsersRound,
} from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';

import { useAuth } from '@/components/auth/auth-provider';
import { formatDateTime, skillCategoryLabel, skillStatusLabel, skillStatusTone } from '@/components/skills/skill-status';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { copySkill, deleteSkill, listSkills, listUsers, type ApiClientError } from '@/lib/api-client';

const skillCategories: SkillCategory[] = ['GENERAL', 'SALES', 'DESIGN', 'OPERATIONS', 'TRAINING', 'REVIEW'];
const skillStatuses: SkillStatus[] = ['DRAFT', 'PUBLISHED', 'DISABLED', 'ARCHIVED'];
const pageSize = 20;

const skillAvatarStyles = [
  'bg-blue-100 text-blue-700',
  'bg-emerald-100 text-emerald-700',
  'bg-violet-100 text-violet-700',
  'bg-orange-100 text-orange-700',
  'bg-cyan-100 text-cyan-700',
] as const;

export function SkillsContent() {
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();
  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [ownerId, setOwnerId] = useState('');
  const [page, setPage] = useState(1);
  const [copyTarget, setCopyTarget] = useState<SkillListItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SkillListItem | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const canWrite = Boolean(
    currentUser?.user.roles.some((role) => role.code === 'tenant_admin') ||
      hasPermission(currentUser?.user.permissions ?? [], 'skill:hub:manage'),
  );

  const skillsQuery = useQuery({
    queryKey: ['skills', page, keyword, category, status, ownerId],
    queryFn: () =>
      listSkills({
        page,
        page_size: pageSize,
        keyword,
        category,
        status,
        owner_id: ownerId,
      }),
  });
  const ownersQuery = useQuery({
    queryKey: ['skill-owners'],
    queryFn: () => listUsers({ page: 1, page_size: 100, status: 'ACTIVE' }),
  });

  const skills = skillsQuery.data?.items ?? [];
  const owners = ownersQuery.data?.items ?? [];
  const total = skillsQuery.data?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  const metrics = useMemo(
    () => [
      {
        helper: '租户范围',
        icon: Layers3,
        iconClassName: 'bg-blue-100 text-blue-700',
        label: 'Skill 总数',
        value: `${total}`,
      },
      {
        helper: '当前页',
        icon: Send,
        iconClassName: 'bg-emerald-100 text-emerald-700',
        label: '已发布',
        value: `${skills.filter((skill) => skill.status === 'PUBLISHED').length}`,
      },
      {
        helper: '当前页',
        icon: FileText,
        iconClassName: 'bg-orange-100 text-orange-700',
        label: '草稿',
        value: `${skills.filter((skill) => skill.status === 'DRAFT').length}`,
      },
      {
        helper: '当前页',
        icon: UsersRound,
        iconClassName: 'bg-violet-100 text-violet-700',
        label: 'Agent 引用',
        value: `${skills.reduce((sum, skill) => sum + skill.agent_reference_count, 0)}`,
      },
    ],
    [skills, total],
  );

  const copyMutation = useMutation({
    mutationFn: copySkill,
    onSuccess: async (skill) => {
      queryClient.setQueryData(['skill', skill.id], skill);
      await queryClient.invalidateQueries({ queryKey: ['skills'] });
      setCopyTarget(null);
      setActionError(null);
    },
    onError: (error: ApiClientError) => setActionError(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteSkill,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['skills'] });
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
    setCategory('');
    setStatus('');
    setOwnerId('');
    setPage(1);
  }

  return (
    <main className="mx-auto grid max-w-[1536px] gap-5 px-4 py-5 lg:px-7">
      <section className="flex flex-col justify-between gap-4 py-3 md:flex-row md:items-center">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-950">技能资产中心</h1>
          <StatusBadge tone="healthy">租户范围</StatusBadge>
          <StatusBadge tone="planned">资产列表</StatusBadge>
        </div>
        {canWrite ? (
          <Button asChild className="w-full bg-blue-600 px-5 shadow-[0_12px_26px_rgba(37,99,235,0.28)] hover:bg-blue-700 md:w-auto">
            <Link href="/skills/create">
              <Plus className="size-4" />
              新建 Skill
            </Link>
          </Button>
        ) : null}
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;

          return (
            <div
              className="flex min-h-[138px] items-center gap-5 rounded-xl border border-slate-200/80 bg-white/[0.86] px-6 py-5 shadow-[0_16px_45px_rgba(15,23,42,0.06)] backdrop-blur-xl"
              key={metric.label}
            >
              <span className={`grid size-16 shrink-0 place-items-center rounded-full ${metric.iconClassName}`}>
                <Icon className="size-8" />
              </span>
              <div>
                <div className="text-sm font-medium text-slate-500">{metric.label}</div>
                <div className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">{metric.value}</div>
                <div className="mt-2 text-sm text-muted-foreground">{metric.helper}</div>
              </div>
            </div>
          );
        })}
      </section>

      {actionError ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {actionError}
        </div>
      ) : null}

      <section className="overflow-hidden rounded-xl border border-slate-200/80 bg-white/[0.86] shadow-[0_18px_55px_rgba(15,23,42,0.06)] backdrop-blur-xl">
        <div className="border-b border-slate-200/80 px-5 py-4">
          <div className="grid gap-4">
            <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
              <h2 className="text-lg font-semibold text-slate-950">资产管理</h2>
              <div className="text-sm text-muted-foreground">
                显示 {skills.length} / {total}
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(260px,1fr)_170px_170px_210px_110px_110px]">
              <label className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm shadow-sm">
                <Search className="size-4 text-muted-foreground" />
                <input
                  className="min-w-0 flex-1 bg-transparent outline-none"
                  onChange={(event) => updateFilter(setKeyword, event.target.value)}
                  placeholder="搜索 Skill 名称、编码"
                  value={keyword}
                />
              </label>
              <select
                className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm shadow-sm outline-none transition-colors hover:border-blue-200"
                onChange={(event) => updateFilter(setCategory, event.target.value)}
                value={category}
              >
                <option value="">全部分类</option>
                {skillCategories.map((option) => (
                  <option key={option} value={option}>
                    {skillCategoryLabel(option)}
                  </option>
                ))}
              </select>
              <select
                className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm shadow-sm outline-none transition-colors hover:border-blue-200"
                onChange={(event) => updateFilter(setStatus, event.target.value)}
                value={status}
              >
                <option value="">全部状态</option>
                {skillStatuses.map((option) => (
                  <option key={option} value={option}>
                    {skillStatusLabel(option)}
                  </option>
                ))}
              </select>
              <select
                className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm shadow-sm outline-none transition-colors hover:border-blue-200"
                onChange={(event) => updateFilter(setOwnerId, event.target.value)}
                value={ownerId}
              >
                <option value="">全部负责人</option>
                {owners.map((owner) => (
                  <option key={owner.id} value={owner.id}>
                    {owner.name}
                  </option>
                ))}
              </select>
              <Button className="h-10" onClick={clearFilters} type="button" variant="outline">
                <RotateCcw className="size-4" />
                清空
              </Button>
              <Button className="h-10" disabled={skillsQuery.isFetching} onClick={() => void skillsQuery.refetch()} type="button" variant="outline">
                <RefreshCw className={`size-4 ${skillsQuery.isFetching ? 'animate-spin' : ''}`} />
                刷新
              </Button>
            </div>
          </div>
        </div>

        {skillsQuery.isError ? (
          <div className="p-6 text-sm text-destructive">加载失败。</div>
        ) : skillsQuery.isLoading ? (
          <div className="p-6 text-sm text-muted-foreground">正在加载...</div>
        ) : skills.length === 0 ? (
          <div className="p-10 text-center">
            <div className="font-medium">暂无数据</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1120px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200/80 bg-slate-50/70">
                  {['', 'Skill', '分类', '状态', '版本', '负责人', 'Agent 引用', '更新时间', '操作'].map(
                    (column) => (
                      <th className="px-5 py-4 font-medium text-slate-500" key={column || 'selection'}>
                        {column}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {skills.map((skill) => (
                  <tr className="border-b border-slate-100 transition-colors last:border-0 hover:bg-slate-50/70" key={skill.id}>
                    <td className="px-5 py-4">
                      <input aria-label={`选择 ${skill.name}`} className="size-4 rounded border-slate-300" type="checkbox" />
                    </td>
                    <td className="px-5 py-4">
                      <Link className="flex max-w-sm items-center gap-3 text-left transition-colors hover:text-blue-700" href={`/skills/${skill.id}`}>
                        <SkillAvatar skill={skill} />
                        <span className="min-w-0">
                          <span className="block truncate font-medium text-slate-900">{skill.name}</span>
                          <span className="mt-1 block truncate text-xs text-muted-foreground">{skill.code}</span>
                        </span>
                      </Link>
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">{skillCategoryLabel(skill.category)}</td>
                    <td className="px-5 py-4">
                      <StatusBadge tone={skillStatusTone(skill.status)}>{skillStatusLabel(skill.status)}</StatusBadge>
                    </td>
                    <td className="px-5 py-4 font-medium text-slate-900">v{skill.version}</td>
                    <td className="px-5 py-4 text-muted-foreground">{skill.owner?.name ?? '-'}</td>
                    <td className="px-5 py-4 text-muted-foreground">{skill.agent_reference_count}</td>
                    <td className="px-5 py-4 text-muted-foreground">{formatDateTime(skill.updated_at)}</td>
                    <td className="px-5 py-4">
                      <div className="flex gap-2">
                        <Button asChild className="size-9 rounded-lg p-0" size="sm" title="查看" variant="outline">
                          <Link href={`/skills/${skill.id}`}>
                            <Eye className="size-4" />
                          </Link>
                        </Button>
                        <Button
                          asChild
                          aria-disabled={!canWrite}
                          className={canWrite ? 'size-9 rounded-lg p-0' : 'pointer-events-none size-9 rounded-lg p-0 opacity-60'}
                          size="sm"
                          title="编辑"
                          variant="outline"
                        >
                          <Link href={`/skills/${skill.id}/edit`}>
                            <Edit className="size-4" />
                          </Link>
                        </Button>
                        <Button
                          className="size-9 rounded-lg p-0"
                          disabled={!canWrite || copyMutation.isPending}
                          onClick={() => setCopyTarget(skill)}
                          size="sm"
                          title="复制"
                          variant="outline"
                        >
                          <Copy className="size-4" />
                        </Button>
                        <Button
                          className="size-9 rounded-lg p-0 text-red-600 hover:text-red-700"
                          disabled={!canWrite}
                          onClick={() => setDeleteTarget(skill)}
                          size="sm"
                          title="删除"
                          variant="outline"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {pageCount > 1 ? (
          <div className="flex flex-col gap-3 border-t border-slate-200/80 px-5 py-4 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
            <span>
              第 {page} / {pageCount} 页
            </span>
            <div className="flex gap-2">
              <Button disabled={page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))} size="sm" type="button" variant="outline">
                上一页
              </Button>
              <Button disabled={page >= pageCount} onClick={() => setPage((current) => Math.min(pageCount, current + 1))} size="sm" type="button" variant="outline">
                下一页
              </Button>
            </div>
          </div>
        ) : null}
      </section>

      {copyTarget ? (
        <ConfirmDialog
          body={`确认复制 Skill ${copyTarget.name}？系统会创建一份新的草稿副本，保留 SOP 字段和标签。`}
          confirmLabel="确认复制"
          onCancel={() => setCopyTarget(null)}
          onConfirm={() => copyMutation.mutate(copyTarget.id)}
          pending={copyMutation.isPending}
          title="确认复制 Skill"
        />
      ) : null}

      {deleteTarget ? (
        <ConfirmDialog
          body={`这会归档 ${deleteTarget.name}，并保留已有版本和审计记录。`}
          confirmLabel="确认删除"
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
          pending={deleteMutation.isPending}
          title="删除 Skill？"
        />
      ) : null}
    </main>
  );
}

function ConfirmDialog({
  body,
  confirmLabel,
  onCancel,
  onConfirm,
  pending,
  title,
}: {
  body: string;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
  pending: boolean;
  title: string;
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/35 px-4 backdrop-blur-sm">
      <Card className="w-full max-w-md p-5">
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{body}</p>
        <div className="mt-5 flex justify-end gap-2">
          <Button onClick={onCancel} type="button" variant="outline">
            取消
          </Button>
          <Button disabled={pending} onClick={onConfirm} type="button" variant="destructive">
            {confirmLabel}
          </Button>
        </div>
      </Card>
    </div>
  );
}

function SkillAvatar({ skill }: { skill: SkillListItem }) {
  const styleIndex = Math.abs(hashText(skill.id || skill.code)) % skillAvatarStyles.length;

  return (
    <span className={`grid size-11 shrink-0 place-items-center rounded-xl ${skillAvatarStyles[styleIndex]}`}>
      <ClipboardList className="size-5" />
    </span>
  );
}

function hashText(value: string) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }

  return hash;
}
