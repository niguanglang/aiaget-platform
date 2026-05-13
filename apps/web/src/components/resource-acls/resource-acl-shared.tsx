'use client';

import type {
  ResourceAclCheckResult,
  ResourceAclEffect,
  ResourceAclItem,
  ResourceAclResourceSummary,
  ResourceAclResourceType,
  ResourceAclStatus,
  ResourceAclSubjectSummary,
  ResourceAclSubjectType,
} from '@aiaget/shared-types';
import { hasPermission } from '@aiaget/shared-types';
import { Database, Search, ShieldCheck, UsersRound } from 'lucide-react';
import { motion } from 'motion/react';
import type { ReactNode } from 'react';

import { useAuth } from '@/components/auth/auth-provider';
import {
  resourceAclDecisionLabel,
  resourceAclDecisionTone,
  resourceAclEffectLabels,
  resourceAclEffectTone,
  resourceAclResourceLabels,
  resourceAclResourceOrder,
  resourceAclStatusLabels,
  resourceAclStatusTone,
  resourceAclSubjectLabels,
  resourceAclSubjectTypes,
} from '@/components/resource-acls/resource-acl-status';
import { Card } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { cn } from '@/lib/utils';

export interface ResourceAclDraft {
  resource_type: ResourceAclResourceType;
  resource_id: string;
  subject_type: ResourceAclSubjectType;
  subject_id: string;
  permission_code: string;
  effect: ResourceAclEffect;
  status: Exclude<ResourceAclStatus, 'DELETED'>;
  conditions_text: string;
}

export const defaultResourceAclDraft: ResourceAclDraft = {
  resource_type: 'AGENT',
  resource_id: '',
  subject_type: 'ROLE',
  subject_id: '',
  permission_code: '',
  effect: 'ALLOW',
  status: 'ACTIVE',
  conditions_text: '',
};

export function useCanManageResourceAcl() {
  const { currentUser } = useAuth();

  return Boolean(
    currentUser?.user.roles.some((role) => role.code === 'tenant_admin') ||
      hasPermission(currentUser?.user.permissions ?? [], 'system:resource_acl:manage'),
  );
}

export function validateResourceAclDraft(draft: ResourceAclDraft) {
  if (!draft.resource_id) return '请选择具体资源。';
  if (!draft.subject_id) return '请选择授权主体。';
  if (!draft.permission_code) return '请选择权限编码。';

  return null;
}

export function parseResourceAclConditions(value: string): Record<string, unknown> | null | Error {
  const trimmed = value.trim();
  if (!trimmed) return null;

  try {
    const parsed = JSON.parse(trimmed) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return new Error('条件 JSON 必须是对象。');
    }

    return parsed as Record<string, unknown>;
  } catch {
    return new Error('条件 JSON 格式不正确。');
  }
}

export function draftFromResourceAcl(acl: ResourceAclItem): ResourceAclDraft {
  return {
    resource_type: acl.resource_type,
    resource_id: acl.resource_id,
    subject_type: acl.subject_type,
    subject_id: acl.subject_id,
    permission_code: acl.permission_code,
    effect: acl.effect,
    status: acl.status === 'DISABLED' ? 'DISABLED' : 'ACTIVE',
    conditions_text: acl.conditions ? JSON.stringify(acl.conditions, null, 2) : '',
  };
}

export function ResourceAclPermissionNotice({ canWrite }: { canWrite: boolean }) {
  if (canWrite) return null;

  return (
	    <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
	      当前账号缺少 system:resource_acl:manage 权限，只能读取授权规则并执行访问校验。
	    </div>
  );
}

export function ResourceAclFeedback({
  error,
  success,
}: {
  error: string | null;
  success?: string | null;
}) {
  return (
    <>
      {error ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      ) : null}
      {success ? (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {success}
        </div>
      ) : null}
    </>
  );
}

export function ResourceAclOptionSelector({
  draft,
  loading,
  mode,
  onDraftPatch,
  onKeywordChange,
  onResourceTypeChange,
  onSubjectTypeChange,
  optionKeyword,
  permissions,
  resources,
  subjects,
}: {
  draft: ResourceAclDraft;
  loading: boolean;
  mode: 'create' | 'check';
  onDraftPatch: (patch: Partial<ResourceAclDraft>) => void;
  onKeywordChange: (value: string) => void;
  onResourceTypeChange: (value: ResourceAclResourceType) => void;
  onSubjectTypeChange: (value: ResourceAclSubjectType) => void;
  optionKeyword: string;
  permissions: string[];
  resources: ResourceAclResourceSummary[];
  subjects: ResourceAclSubjectSummary[];
}) {
  return (
    <Card className="min-w-0">
      <div className="border-b p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold">资源与主体</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {mode === 'create' ? '选择要授权的资源对象和授权主体。' : '选择要校验访问权限的资源对象和主体。'}
            </p>
          </div>
          <StatusBadge tone="planned">{resources.length}/{subjects.length}</StatusBadge>
        </div>
        <label className="mt-4 flex h-9 items-center gap-2 rounded-md border bg-background/70 px-3 text-sm">
          <Search className="size-4 text-muted-foreground" />
          <input
            className="min-w-0 flex-1 bg-transparent outline-none"
            onChange={(event) => onKeywordChange(event.target.value)}
            placeholder="搜索资源或主体"
            value={optionKeyword}
          />
        </label>
      </div>

      <div className="grid gap-4 p-4">
        <TypeGrid
          activeType={draft.resource_type}
          labels={resourceAclResourceLabels}
          onChange={onResourceTypeChange}
          order={resourceAclResourceOrder}
          title="资源类型"
          tone="blue"
        />
        <OptionList
          emptyText="暂无可选资源"
          icon={<Database className="size-4 text-blue-700" />}
          items={resources.map((resource) => ({
            id: resource.id,
            label: resource.name,
            meta: resource.code ?? resource.status ?? resource.type,
          }))}
          loading={loading}
          onSelect={(resourceId) => onDraftPatch({ resource_id: resourceId })}
          selectedId={draft.resource_id}
          title="具体资源"
        />

        <TypeGrid
          activeType={draft.subject_type}
          labels={resourceAclSubjectLabels}
          onChange={onSubjectTypeChange}
          order={resourceAclSubjectTypes}
          title="主体类型"
          tone="teal"
        />
        <OptionList
          emptyText="暂无可选主体"
          icon={<UsersRound className="size-4 text-teal-700" />}
          items={subjects.map((subject) => ({
            id: subject.id,
            label: subject.name,
            meta: subject.code ?? resourceAclSubjectLabels[subject.type],
          }))}
          loading={loading}
          onSelect={(subjectId) => onDraftPatch({ subject_id: subjectId })}
          selectedId={draft.subject_id}
          title="授权主体"
        />

        <PermissionSelect
          onChange={(permissionCode) => onDraftPatch({ permission_code: permissionCode })}
          permissions={permissions}
          value={draft.permission_code}
        />
      </div>
    </Card>
  );
}

function TypeGrid<T extends string>({
  activeType,
  labels,
  onChange,
  order,
  title,
  tone,
}: {
  activeType: T;
  labels: Record<T, string>;
  onChange: (value: T) => void;
  order: T[];
  title: string;
  tone: 'blue' | 'teal';
}) {
  return (
    <div className="grid gap-2">
      <div className="text-xs font-medium text-muted-foreground">{title}</div>
      <div className="grid grid-cols-2 gap-2">
        {order.map((type) => (
          <button
            className={cn(
              'rounded-md border bg-background/75 px-3 py-2 text-left text-sm transition-colors',
              tone === 'blue' ? 'hover:border-blue-200 hover:bg-blue-50/45' : 'hover:border-teal-200 hover:bg-teal-50/45',
              activeType === type &&
                (tone === 'blue' ? 'border-blue-300 bg-blue-50/70 shadow-sm' : 'border-teal-300 bg-teal-50/70 shadow-sm'),
            )}
            key={type}
            onClick={() => onChange(type)}
            type="button"
          >
            {labels[type]}
          </button>
        ))}
      </div>
    </div>
  );
}

function OptionList({
  emptyText,
  icon,
  items,
  loading,
  onSelect,
  selectedId,
  title,
}: {
  emptyText: string;
  icon: ReactNode;
  items: Array<{ id: string; label: string; meta: string }>;
  loading: boolean;
  onSelect: (id: string) => void;
  selectedId: string;
  title: string;
}) {
  return (
    <div className="rounded-lg border bg-muted/15 p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-medium">
          {icon}
          {title}
        </div>
        <StatusBadge tone="planned">{items.length} 项</StatusBadge>
      </div>
      {loading ? (
        <div className="py-4 text-sm text-muted-foreground">正在加载...</div>
      ) : items.length === 0 ? (
        <div className="py-4 text-sm text-muted-foreground">{emptyText}</div>
      ) : (
        <div className="grid max-h-52 gap-2 overflow-y-auto">
          {items.map((item, index) => (
            <motion.button
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                'rounded-md border bg-background/80 p-2 text-left transition-colors hover:border-blue-200 hover:bg-blue-50/45',
                selectedId === item.id && 'border-blue-300 bg-blue-50/75 shadow-sm',
              )}
              initial={{ opacity: 0, y: 6 }}
              key={item.id}
              onClick={() => onSelect(item.id)}
              transition={{ delay: index * 0.015, duration: 0.18 }}
              type="button"
            >
              <div className="truncate text-sm font-medium">{item.label}</div>
              <div className="mt-1 truncate text-xs text-muted-foreground">{item.meta}</div>
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );
}

export function PermissionSelect({
  disabled,
  onChange,
  permissions,
  value,
}: {
  disabled?: boolean;
  onChange: (value: string) => void;
  permissions: string[];
  value: string;
}) {
  return (
    <div className="grid gap-2">
      <label className="text-xs font-medium text-muted-foreground">权限编码</label>
      <select
        className="h-9 rounded-md border bg-background/80 px-3 text-sm outline-none disabled:opacity-70"
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {permissions.length === 0 ? <option value="">暂无权限编码</option> : null}
        {permissions.map((permission) => (
          <option key={permission} value={permission}>
            {permission}
          </option>
        ))}
      </select>
    </div>
  );
}

export function ResourceAclRuleFields({
  disabled,
  draft,
  onDraftPatch,
}: {
  disabled?: boolean;
  draft: ResourceAclDraft;
  onDraftPatch: (patch: Partial<ResourceAclDraft>) => void;
}) {
  return (
    <>
      <div className="grid gap-2">
        <label className="text-xs font-medium text-muted-foreground">授权效果</label>
        <div className="grid grid-cols-2 gap-2">
          {(['ALLOW', 'DENY'] as ResourceAclEffect[]).map((effect) => (
            <button
              className={cn(
                'rounded-lg border bg-background/80 p-3 text-left transition-colors hover:border-blue-200 hover:bg-blue-50/40 disabled:opacity-70',
                draft.effect === effect && 'border-blue-300 bg-blue-50/70 shadow-sm',
              )}
              disabled={disabled}
              key={effect}
              onClick={() => onDraftPatch({ effect })}
              type="button"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium">{resourceAclEffectLabels[effect]}</span>
                {draft.effect === effect ? <ShieldCheck className="size-4 text-blue-700" /> : null}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {effect === 'DENY' ? '显式拒绝会优先生效。' : '允许主体执行该权限动作。'}
              </p>
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-2">
        <label className="text-xs font-medium text-muted-foreground">状态</label>
        <select
          className="h-9 rounded-md border bg-background/80 px-3 text-sm outline-none disabled:opacity-70"
          disabled={disabled}
          onChange={(event) => onDraftPatch({ status: event.target.value as ResourceAclDraft['status'] })}
          value={draft.status}
        >
          <option value="ACTIVE">启用</option>
          <option value="DISABLED">停用</option>
        </select>
      </div>

      <div className="grid gap-2">
        <label className="text-xs font-medium text-muted-foreground">条件 JSON</label>
        <textarea
          className="min-h-28 resize-y rounded-md border bg-background/80 px-3 py-2 font-mono text-xs outline-none focus:border-blue-300 disabled:opacity-70"
          disabled={disabled}
          onChange={(event) => onDraftPatch({ conditions_text: event.target.value })}
          placeholder='例如 {"risk_level":"LOW"}，为空表示无附加条件'
          value={draft.conditions_text}
        />
      </div>
    </>
  );
}

export function ResourceAclSummaryBlock({
  resource,
  subject,
}: {
  resource: ResourceAclResourceSummary | null;
  subject: ResourceAclSubjectSummary | null;
}) {
  return (
    <div className="grid gap-2 rounded-lg border bg-muted/15 p-3">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Database className="size-4 text-blue-700" />
        当前资源
      </div>
      <div className="rounded-md border bg-background/80 p-3">
        <div className="truncate text-sm font-medium">{resource?.name ?? '未选择资源'}</div>
        <div className="mt-1 truncate text-xs text-muted-foreground">{resource?.code ?? resource?.id ?? '-'}</div>
      </div>
      <div className="mt-2 flex items-center gap-2 text-sm font-medium">
        <UsersRound className="size-4 text-teal-700" />
        当前主体
      </div>
      <div className="rounded-md border bg-background/80 p-3">
        <div className="truncate text-sm font-medium">{subject?.name ?? '未选择主体'}</div>
        <div className="mt-1 truncate text-xs text-muted-foreground">{subject?.code ?? subject?.id ?? '-'}</div>
      </div>
    </div>
  );
}

export function ResourceAclImmutableRuleSummary({ acl }: { acl: ResourceAclItem }) {
  return (
    <Card className="grid gap-4 p-4 md:grid-cols-2">
      <ResourceAclSummaryBlock resource={acl.resource} subject={acl.subject} />
      <div className="grid gap-3 rounded-lg border bg-muted/15 p-3">
        <div>
          <div className="text-xs font-medium text-muted-foreground">权限编码</div>
          <div className="mt-1 break-all font-mono text-sm">{acl.permission_code}</div>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusBadge tone={resourceAclEffectTone(acl.effect)}>{resourceAclEffectLabels[acl.effect]}</StatusBadge>
          <StatusBadge tone={resourceAclStatusTone(acl.status)}>{resourceAclStatusLabels[acl.status]}</StatusBadge>
          <StatusBadge tone="planned">{acl.condition_count} 个条件</StatusBadge>
        </div>
	        <p className="text-xs leading-5 text-muted-foreground">资源与主体不可变。</p>
      </div>
    </Card>
  );
}

export function ResourceAclCheckResultPanel({ result }: { result: ResourceAclCheckResult | null }) {
  if (!result) {
    return (
      <div className="rounded-lg border border-dashed bg-muted/20 p-4 text-sm text-muted-foreground">
	        暂无校验结果。
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-background/75 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold">检查结果</div>
          <p className="mt-1 text-xs text-muted-foreground">共检查 {result.checked_count} 条生效规则。</p>
        </div>
        <StatusBadge tone={resourceAclDecisionTone(result.decision)}>
          {resourceAclDecisionLabel(result.decision)}
        </StatusBadge>
      </div>
      <p className="mt-3 rounded-md border bg-muted/20 p-3 text-xs leading-5 text-muted-foreground">{result.reason}</p>
      {result.matched_acl ? (
        <div className="mt-3 rounded-md border bg-blue-50/60 p-3 text-xs text-blue-800">
          命中：{result.matched_acl.resource.name} · {result.matched_acl.subject.name} · {result.matched_acl.permission_code}
        </div>
      ) : null}
    </div>
  );
}

export function ResourceAclPageHeader({
  actions,
  eyebrow,
  title,
}: {
  actions?: ReactNode;
  eyebrow: string;
  title: string;
}) {
  return (
    <motion.section
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col justify-between gap-4 md:flex-row md:items-start"
      initial={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.32, ease: 'easeOut' }}
    >
      <div>
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <StatusBadge tone="healthy">资源授权</StatusBadge>
          <StatusBadge tone="mock">{eyebrow}</StatusBadge>
        </div>
        <h1 className="text-2xl font-semibold">{title}</h1>
      </div>
      {actions ? <div className="flex flex-col gap-2 sm:flex-row">{actions}</div> : null}
    </motion.section>
  );
}
