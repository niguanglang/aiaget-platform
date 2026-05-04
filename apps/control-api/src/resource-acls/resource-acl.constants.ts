import type {
  ResourceAclResourceDefinition,
  ResourceAclResourceType,
  ResourceAclSubjectType,
} from '@aiaget/shared-types';

export const RESOURCE_ACL_RESOURCE_TYPES: ResourceAclResourceType[] = [
  'AGENT',
  'AGENT_TEAM',
  'CHANNEL',
  'PLUGIN',
  'KNOWLEDGE_BASE',
  'DOCUMENT',
  'TOOL',
  'MODEL',
  'CONVERSATION',
  'AUDIT_LOG',
];

export const RESOURCE_ACL_SUBJECT_TYPES: ResourceAclSubjectType[] = [
  'USER',
  'ROLE',
  'DEPARTMENT',
  'TENANT',
];

export const RESOURCE_ACL_EFFECTS = ['ALLOW', 'DENY'] as const;
export const RESOURCE_ACL_STATUSES = ['ACTIVE', 'DISABLED', 'DELETED'] as const;

export const RESOURCE_ACL_RESOURCE_DEFINITIONS: ResourceAclResourceDefinition[] = [
  {
    resource_type: 'PLUGIN',
    name: '插件',
    description: '控制具体插件的查看、安装、启停、升级、菜单注入和审计。',
    permission_codes: [
      'plugin:center:view',
      'plugin:center:manage',
      'plugin:center:install',
      'plugin:center:enable',
      'plugin:center:disable',
      'plugin:center:upgrade',
      'plugin:center:audit',
    ],
  },
  {
    resource_type: 'AGENT',
    name: 'Agent',
    description: '控制具体 Agent 的查看、编辑、测试、发布和使用。',
    permission_codes: ['agent:agent:view', 'agent:agent:manage', 'agent:agent:use'],
  },
  {
    resource_type: 'AGENT_TEAM',
    name: 'Agent 协作团队',
    description: '控制具体多 Agent 团队的查看、编辑、运行、接力和反馈。',
    permission_codes: ['agent:team:view', 'agent:team:manage', 'agent:team:run'],
  },
  {
    resource_type: 'CHANNEL',
    name: '发布渠道',
    description: '控制具体发布渠道的查看、编辑、启用、停用和健康检查。',
    permission_codes: ['channel:publish:view', 'channel:publish:manage', 'channel:publish:deploy', 'channel:publish:disable'],
  },
  {
    resource_type: 'KNOWLEDGE_BASE',
    name: '知识库',
    description: '控制具体知识库的查看、上传、检索测试和绑定。',
    permission_codes: ['knowledge:base:view', 'knowledge:base:manage'],
  },
  {
    resource_type: 'DOCUMENT',
    name: '知识文档',
    description: '控制具体文档、切片和引用来源访问。',
    permission_codes: ['knowledge:base:view', 'knowledge:base:manage'],
  },
  {
    resource_type: 'TOOL',
    name: '工具',
    description: '控制具体工具的查看、配置、绑定、测试和调用。',
    permission_codes: ['tool:definition:view', 'tool:definition:manage', 'tool:call:execute'],
  },
  {
    resource_type: 'MODEL',
    name: '模型',
    description: '控制模型供应商和模型配置的查看、配置、调用。',
    permission_codes: ['model:config:view', 'model:config:manage'],
  },
  {
    resource_type: 'CONVERSATION',
    name: '会话',
    description: '控制具体会话、消息和运行轨迹访问。',
    permission_codes: ['conversation:history:view', 'conversation:chat:manage'],
  },
  {
    resource_type: 'AUDIT_LOG',
    name: '审计日志',
    description: '控制具体审计和监控日志访问。',
    permission_codes: ['security:audit:view', 'monitor:log:view'],
  },
];

export const RESOURCE_ACL_RESOURCE_LABELS = RESOURCE_ACL_RESOURCE_DEFINITIONS.reduce<Record<string, string>>(
  (labels, definition) => {
    labels[definition.resource_type] = definition.name;

    return labels;
  },
  {},
);
