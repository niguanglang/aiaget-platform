import type {
  DataScopeResourceDefinition,
  DataScopeResourceType,
  DataScopeType,
} from '@aiaget/shared-types';

export const DATA_SCOPE_TYPES: DataScopeType[] = [
  'ALL',
  'TENANT',
  'DEPT',
  'DEPT_AND_CHILD',
  'SELF',
  'CUSTOM',
];

export const DATA_SCOPE_STATUSES = ['ACTIVE', 'DISABLED', 'DELETED'] as const;

export const DATA_SCOPE_RESOURCE_TYPES: DataScopeResourceType[] = [
  'AGENT',
  'AGENT_TEAM',
  'ROLE_SCENARIO',
  'SOLUTION_PACKAGE',
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

export const DATA_SCOPE_RESOURCE_DEFINITIONS: DataScopeResourceDefinition[] = [
  {
    resource_type: 'AGENT',
    name: 'Agent 数据',
    description: '控制智能体列表、配置、运行入口和 Agent 运行数据的可访问范围。',
    permission_codes: ['agent:agent:view', 'agent:agent:manage', 'agent:agent:use'],
  },
  {
    resource_type: 'AGENT_TEAM',
    name: 'Agent 协作团队',
    description: '控制多 Agent 团队、成员、运行、接力和反馈数据的可访问范围。',
    permission_codes: ['agent:team:view', 'agent:team:manage', 'agent:team:run'],
  },
  {
    resource_type: 'ROLE_SCENARIO',
    name: '岗位场景',
    description: '控制岗位场景包、流程编排、样板成果、验收标准和关联资产的可访问范围。',
    permission_codes: ['scenario:package:view', 'scenario:package:manage'],
  },
  {
    resource_type: 'SOLUTION_PACKAGE',
    name: '落地方案包',
    description: '控制 AI 落地方案包、交付路线图、验收计划、ROI 摘要和商务推进策略的可访问范围。',
    permission_codes: ['solution:package:view', 'solution:package:manage'],
  },
  {
    resource_type: 'CUSTOMER_ASSESSMENT',
    name: '客户评估',
    description: '控制客户分层、六问判断、准备度评分、建议打法和风险动作的可访问范围。',
    permission_codes: ['customer:assessment:view', 'customer:assessment:manage'],
  },
  {
    resource_type: 'SKILL',
    name: '技能资产',
    description: '控制可复用业务技能、发布版本、Agent 引用和技能沉淀资产的可访问范围。',
    permission_codes: ['skill:hub:view', 'skill:hub:manage'],
  },
  {
    resource_type: 'CHANNEL',
    name: '发布渠道',
    description: '控制 Agent 在 Web、开放 API、企业微信、钉钉、飞书等渠道的发布配置和运行数据范围。',
    permission_codes: ['channel:publish:view', 'channel:publish:manage', 'channel:publish:deploy', 'channel:publish:disable'],
  },
  {
    resource_type: 'PLUGIN',
    name: '插件数据',
    description: '控制插件市场、安装、启停、升级、菜单注入和审计数据的可访问范围。',
    permission_codes: [
      'plugin:center:view',
      'plugin:center:manage',
      'plugin:center:install',
      'plugin:center:enable',
      'plugin:center:disable',
      'plugin:center:upgrade',
      'plugin:center:uninstall',
      'plugin:center:audit',
    ],
  },
  {
    resource_type: 'KNOWLEDGE_BASE',
    name: '知识库数据',
    description: '控制知识库、绑定关系和检索测试的可访问范围。',
    permission_codes: ['knowledge:base:view', 'knowledge:base:manage'],
  },
  {
    resource_type: 'DOCUMENT',
    name: '知识文档',
    description: '控制文档、切片、解析任务和引用来源的可访问范围。',
    permission_codes: ['knowledge:base:view', 'knowledge:base:manage'],
  },
  {
    resource_type: 'TOOL',
    name: '工具数据',
    description: '控制工具定义、工具测试和工具调用链路的可访问范围。',
    permission_codes: ['tool:definition:view', 'tool:definition:manage'],
  },
  {
    resource_type: 'MODEL',
    name: '模型数据',
    description: '控制模型供应商、模型配置、调用统计和成本数据的可访问范围。',
    permission_codes: ['model:config:view', 'model:config:manage'],
  },
  {
    resource_type: 'CONVERSATION',
    name: '会话数据',
    description: '控制会话记录、消息、运行轨迹和反馈数据的可访问范围。',
    permission_codes: ['conversation:history:view', 'conversation:chat:manage'],
  },
  {
    resource_type: 'AUDIT_LOG',
    name: '审计日志',
    description: '控制登录日志、操作日志、安全事件和链路追踪日志的可访问范围。',
    permission_codes: ['security:audit:view', 'monitor:log:view'],
  },
];

export const DATA_SCOPE_RESOURCE_LABELS = DATA_SCOPE_RESOURCE_DEFINITIONS.reduce<Record<string, string>>(
  (labels, resource) => {
    labels[resource.resource_type] = resource.name;

    return labels;
  },
  {},
);

export const DATA_SCOPE_TYPE_LABELS: Record<DataScopeType, string> = {
  ALL: '全部数据',
  TENANT: '本租户数据',
  DEPT: '本部门数据',
  DEPT_AND_CHILD: '本部门及子部门',
  SELF: '本人数据',
  CUSTOM: '自定义范围',
};
