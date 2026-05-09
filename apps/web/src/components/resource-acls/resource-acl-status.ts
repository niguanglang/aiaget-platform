import type {
  ResourceAclEffect,
  ResourceAclResourceType,
  ResourceAclStatus,
  ResourceAclSubjectType,
} from '@aiaget/shared-types';

export const resourceAclResourceOrder: ResourceAclResourceType[] = [
  'AGENT',
  'AGENT_TEAM',
  'ROLE_SCENARIO',
  'SOLUTION_PACKAGE',
  'DELIVERY_REVIEW',
  'DELIVERY_ASSET',
  'CUSTOMER_SUCCESS_PLAN',
  'CUSTOMER_SUCCESS_ACTION',
  'CUSTOMER_ASSESSMENT',
  'SKILL',
  'CHANNEL',
  'PLUGIN',
  'KNOWLEDGE_BASE',
  'DOCUMENT',
  'TOOL',
  'MODEL',
  'CONVERSATION',
  'AUDIT_LOG',
];

export const resourceAclResourceLabels: Record<ResourceAclResourceType, string> = {
  AGENT: 'Agent',
  AGENT_TEAM: 'Agent 协作团队',
  ROLE_SCENARIO: '岗位场景',
  SOLUTION_PACKAGE: '落地方案包',
  DELIVERY_REVIEW: '验收复盘',
  DELIVERY_ASSET: '成果资产',
  CUSTOMER_SUCCESS_PLAN: '客户成功计划',
  CUSTOMER_SUCCESS_ACTION: '客户成功行动',
  CUSTOMER_ASSESSMENT: '客户评估',
  SKILL: '技能资产',
  CHANNEL: '发布渠道',
  PLUGIN: '插件',
  KNOWLEDGE_BASE: '知识库',
  DOCUMENT: '知识文档',
  TOOL: '工具',
  MODEL: '模型',
  CONVERSATION: '会话',
  AUDIT_LOG: '审计日志',
};

export const resourceAclSubjectTypes: ResourceAclSubjectType[] = ['ROLE', 'USER', 'DEPARTMENT', 'TENANT'];

export const resourceAclSubjectLabels: Record<ResourceAclSubjectType, string> = {
  USER: '用户',
  ROLE: '角色',
  DEPARTMENT: '部门',
  TENANT: '租户',
};

export const resourceAclEffectLabels: Record<ResourceAclEffect, string> = {
  ALLOW: '允许',
  DENY: '拒绝',
};

export const resourceAclStatusLabels: Record<ResourceAclStatus, string> = {
  ACTIVE: '启用',
  DISABLED: '停用',
  DELETED: '已删除',
};

export function resourceAclEffectTone(effect: ResourceAclEffect) {
  return effect === 'DENY' ? ('degraded' as const) : ('ready' as const);
}

export function resourceAclStatusTone(status: ResourceAclStatus) {
  if (status === 'ACTIVE') return 'healthy' as const;
  if (status === 'DISABLED') return 'planned' as const;

  return 'unavailable' as const;
}

export function resourceAclDecisionTone(decision: 'ALLOW' | 'DENY' | 'NO_MATCH') {
  if (decision === 'ALLOW') return 'ready' as const;
  if (decision === 'DENY') return 'degraded' as const;

  return 'planned' as const;
}

export function resourceAclDecisionLabel(decision: 'ALLOW' | 'DENY' | 'NO_MATCH') {
  if (decision === 'ALLOW') return '允许';
  if (decision === 'DENY') return '拒绝';

  return '未匹配';
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) return '-';

  return new Intl.DateTimeFormat('zh-CN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}
