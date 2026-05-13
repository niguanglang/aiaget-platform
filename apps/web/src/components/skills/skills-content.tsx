'use client';

import { hasPermission, type SkillCategory, type SkillListItem, type SkillStatus } from '@aiaget/shared-types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'motion/react';
import { Copy, Edit, Eye, Plus, Search, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';

import { useAuth } from '@/components/auth/auth-provider';
import { SkillCenterBackground } from '@/components/skills/skill-center-background';
import { formatDateTime, skillCategoryLabel, skillStatusLabel, skillStatusTone } from '@/components/skills/skill-status';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { MetricCard } from '@/components/ui/metric-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { copySkill, deleteSkill, listSkills, listUsers, type ApiClientError } from '@/lib/api-client';

const skillCategories: SkillCategory[] = ['GENERAL', 'SALES', 'DESIGN', 'OPERATIONS', 'TRAINING', 'REVIEW'];
const skillStatuses: SkillStatus[] = ['DRAFT', 'PUBLISHED', 'DISABLED', 'ARCHIVED'];
const pageSize = 20;

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
      { label: 'Skill', value: `${total}`, helper: '租户范围' },
      { label: '已发布', value: `${skills.filter((skill) => skill.status === 'PUBLISHED').length}`, helper: '当前页' },
      { label: '草稿', value: `${skills.filter((skill) => skill.status === 'DRAFT').length}`, helper: '当前页' },
      { label: 'Agent 引用', value: `${skills.reduce((sum, skill) => sum + skill.agent_reference_count, 0)}`, helper: '当前页' },
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
    <main className="relative mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:px-6">
      <SkillCenterBackground />

      <motion.section
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col justify-between gap-4 md:flex-row md:items-start"
        initial={{ opacity: 0, y: 10 }}
        transition={{ duration: 0.32, ease: 'easeOut' }}
      >
        <div>
          <h1 className="text-2xl font-semibold">技能资产中心</h1>
        </div>
        {canWrite ? (
          <Button asChild className="w-full md:w-auto">
            <Link href="/skills/create">
              <Plus className="size-4" />
              新建 Skill
            </Link>
          </Button>
        ) : null}
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
              <h2 className="text-sm font-semibold">Skill 清单</h2>
              <div className="text-sm text-muted-foreground">
                显示 {skills.length} / {total}
              </div>
            </div>

            <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-[1fr_150px_160px_190px_auto]">
              <label className="flex h-9 items-center gap-2 rounded-md border bg-background/70 px-3 text-sm">
                <Search className="size-4 text-muted-foreground" />
                <input
                  className="min-w-0 flex-1 bg-transparent outline-none"
                  onChange={(event) => updateFilter(setKeyword, event.target.value)}
                  placeholder="搜索 Skill、编码、描述"
                  value={keyword}
                />
              </label>
              <select className="h-9 rounded-md border bg-background/80 px-3 text-sm" onChange={(event) => updateFilter(setCategory, event.target.value)} value={category}>
                <option value="">全部分类</option>
                {skillCategories.map((option) => (
                  <option key={option} value={option}>
                    {skillCategoryLabel(option)}
                  </option>
                ))}
              </select>
              <select className="h-9 rounded-md border bg-background/80 px-3 text-sm" onChange={(event) => updateFilter(setStatus, event.target.value)} value={status}>
                <option value="">全部状态</option>
                {skillStatuses.map((option) => (
                  <option key={option} value={option}>
                    {skillStatusLabel(option)}
                  </option>
                ))}
              </select>
              <select className="h-9 rounded-md border bg-background/80 px-3 text-sm" onChange={(event) => updateFilter(setOwnerId, event.target.value)} value={ownerId}>
                <option value="">全部负责人</option>
                {owners.map((owner) => (
                  <option key={owner.id} value={owner.id}>
                    {owner.name}
                  </option>
                ))}
              </select>
              <Button onClick={clearFilters} type="button" variant="outline">
                清空
              </Button>
            </div>
          </div>
        </div>

        {skillsQuery.isError ? (
          <div className="p-6 text-sm text-destructive">Skill 加载失败。</div>
        ) : skillsQuery.isLoading ? (
          <div className="p-6 text-sm text-muted-foreground">正在加载 Skill...</div>
        ) : skills.length === 0 ? (
          <EmptyState
            action={
              canWrite ? (
                <Button asChild>
                  <Link href="/skills/create">
                    <Plus className="size-4" />
                    新建 Skill
                  </Link>
                </Button>
              ) : null
            }
            description="暂无记录。"
            title="暂无 Skill"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1120px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  {['Skill', '分类', '状态', '版本', '触发预览', '输出预览', 'Agent 引用', '更新时间', '操作'].map((column) => (
                    <th className="px-4 py-3 font-medium text-muted-foreground" key={column}>
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {skills.map((skill, index) => (
                  <motion.tr
                    animate={{ opacity: 1, y: 0 }}
                    className="border-b transition-colors last:border-0 hover:bg-muted/25"
                    initial={{ opacity: 0, y: 8 }}
                    key={skill.id}
                    transition={{ delay: index * 0.025, duration: 0.22 }}
                  >
                    <td className="px-4 py-3">
                      <div className="grid max-w-sm gap-1">
                        <Link className="font-medium hover:text-primary" href={`/skills/${skill.id}`}>
                          {skill.name}
                        </Link>
                        <span className="text-xs text-muted-foreground">{skill.code}</span>
                        <span className="line-clamp-1 text-xs text-muted-foreground">{skill.description ?? '暂无描述'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{skillCategoryLabel(skill.category)}</td>
                    <td className="px-4 py-3">
                      <StatusBadge tone={skillStatusTone(skill.status)}>{skillStatusLabel(skill.status)}</StatusBadge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">v{skill.version}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      <span className="line-clamp-2 max-w-xs">{skill.trigger_scenario_preview}</span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      <span className="line-clamp-2 max-w-xs">{skill.output_format_preview}</span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{skill.agent_reference_count}</td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDateTime(skill.updated_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/skills/${skill.id}`}>
                            <Eye className="size-4" />
                            查看
                          </Link>
                        </Button>
                        <Button asChild aria-disabled={!canWrite} className={!canWrite ? 'pointer-events-none opacity-60' : undefined} size="sm" variant="outline">
                          <Link href={`/skills/${skill.id}/edit`}>
                            <Edit className="size-4" />
                            编辑
                          </Link>
                        </Button>
                        <Button disabled={!canWrite || copyMutation.isPending} onClick={() => setCopyTarget(skill)} size="sm" variant="outline">
                          <Copy className="size-4" />
                          复制
                        </Button>
                        <Button disabled={!canWrite} onClick={() => setDeleteTarget(skill)} size="sm" variant="outline">
                          <Trash2 className="size-4" />
                          删除
                        </Button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {pageCount > 1 ? (
          <div className="flex flex-col gap-3 border-t p-4 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
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
      </Card>

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
