import type { DataScopeResourceType, DataScopeType } from '@aiaget/shared-types';

export const dataScopeResourceOrder: DataScopeResourceType[] = [
  'AGENT',
  'AGENT_TEAM',
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

export const dataScopeResourceLabels: Record<DataScopeResourceType, string> = {
  AGENT: 'Agent 数据',
  AGENT_TEAM: 'Agent 协作团队',
  CUSTOMER_ASSESSMENT: '客户评估',
  SKILL: '技能资产',
  CHANNEL: '发布渠道',
  PLUGIN: '插件数据',
  KNOWLEDGE_BASE: '知识库数据',
  DOCUMENT: '知识文档',
  TOOL: '工具数据',
  MODEL: '模型数据',
  CONVERSATION: '会话数据',
  AUDIT_LOG: '审计日志',
};

export const dataScopeTypeLabels: Record<DataScopeType, string> = {
  ALL: '全部数据',
  TENANT: '本租户数据',
  DEPT: '本部门数据',
  DEPT_AND_CHILD: '本部门及子部门',
  SELF: '本人数据',
  CUSTOM: '自定义范围',
};

export const dataScopeTypeDescriptions: Record<DataScopeType, string> = {
  ALL: '平台级全部数据，通常只给超级管理员。',
  TENANT: '当前租户内全部数据，适合租户管理员。',
  DEPT: '当前用户所属部门的数据。',
  DEPT_AND_CHILD: '当前用户所属部门及所有下级部门的数据。',
  SELF: '仅本人创建、负责或参与的数据。',
  CUSTOM: '按指定部门、用户或资源清单授权。',
};

export function dataScopeTypeTone(scopeType: DataScopeType) {
  if (scopeType === 'ALL') return 'degraded' as const;
  if (scopeType === 'TENANT') return 'mock' as const;
  if (scopeType === 'CUSTOM') return 'ready' as const;
  if (scopeType === 'SELF') return 'planned' as const;

  return 'healthy' as const;
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) return '-';

  return new Intl.DateTimeFormat('zh-CN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}
