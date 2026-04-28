export type ModuleStatus = 'ready' | 'planned' | 'mock';

export interface MetricPreview {
  label: string;
  value: string;
  helper: string;
}

export interface ModuleSpec {
  key: string;
  title: string;
  navTitle: string;
  href: string;
  description: string;
  permission: string;
  status: ModuleStatus;
  primaryAction: string;
  metrics: MetricPreview[];
  filters: string[];
  columns: string[];
  detailSections: string[];
  rowActions: string[];
  emptyTitle: string;
  emptyDescription: string;
}

export const moduleSpecs: ModuleSpec[] = [
  {
    key: 'agents',
    title: 'Agent Configuration Center',
    navTitle: 'Agents',
    href: '/agents',
    description: 'Create, configure, test, version, publish, disable, copy, and audit enterprise agents.',
    permission: 'agent.read',
    status: 'ready',
    primaryAction: 'New Agent',
    metrics: [
      { label: 'Total agents', value: '0', helper: 'M03 data source' },
      { label: 'Published', value: '0', helper: 'Status: published' },
      { label: 'Drafts', value: '0', helper: 'Status: draft' },
      { label: 'Disabled', value: '0', helper: 'Status: disabled' },
    ],
    filters: ['Keyword: name/code/description', 'Status', 'Category', 'Owner'],
    columns: ['Name', 'Code', 'Status', 'Version', 'Default model', 'Updated at', 'Owner', 'Actions'],
    detailSections: [
      'Basic information',
      'Runtime configuration',
      'Model bindings',
      'Prompt bindings',
      'Knowledge bindings',
      'Tool bindings',
      'Versions',
      'Conversation test',
      'Audit records',
    ],
    rowActions: ['Edit', 'Copy', 'Enable', 'Disable', 'Delete', 'Details'],
    emptyTitle: 'No agents yet',
    emptyDescription: 'Create an agent and manage versioned publish workflows backed by Control API tables.',
  },
  {
    key: 'prompts',
    title: 'Prompt Center',
    navTitle: 'Prompts',
    href: '/prompts',
    description: 'Manage prompt templates, variables, versions, tests, rollback, and agent references.',
    permission: 'prompt.read',
    status: 'ready',
    primaryAction: 'New Prompt',
    metrics: [
      { label: 'Templates', value: '0', helper: 'M05 data source' },
      { label: 'Published', value: '0', helper: 'Immutable versions' },
      { label: 'Drafts', value: '0', helper: 'Editable state' },
      { label: 'Tests', value: '0', helper: 'Prompt test records' },
    ],
    filters: ['Keyword: name/code/content', 'Type', 'Status', 'Creator'],
    columns: ['Name', 'Code', 'Type', 'Status', 'Version', 'Updated at', 'Actions'],
    detailSections: [
      'Basic information',
      'Monaco prompt editor',
      'Variables',
      'Versions',
      'Test panel',
      'Agent references',
      'Audit records',
    ],
    rowActions: ['Edit', 'Copy', 'Publish', 'Rollback', 'Delete', 'Test'],
    emptyTitle: 'No prompt templates yet',
    emptyDescription: 'Create prompt templates, variables, immutable versions, render checks, and agent references.',
  },
  {
    key: 'models',
    title: 'Model Center',
    navTitle: 'Models',
    href: '/models',
    description: 'Manage providers, model configs, encrypted API keys, costs, rate limits, and call logs.',
    permission: 'model.read',
    status: 'ready',
    primaryAction: 'New Provider',
    metrics: [
      { label: 'Providers', value: '0', helper: 'M04 data source' },
      { label: 'Enabled models', value: '0', helper: 'Ready for binding' },
      { label: 'Calls today', value: '0', helper: 'Model call logs' },
      { label: 'Cost today', value: '$0.00', helper: 'Cost rules' },
    ],
    filters: ['Keyword: provider/model', 'Provider type', 'Capability', 'Status'],
    columns: ['Provider', 'Model', 'Capabilities', 'Context', 'Input price', 'Output price', 'Rate limit', 'Status'],
    detailSections: [
      'Provider profile',
      'Masked API keys',
      'Capabilities',
      'Cost rules',
      'Rate limits',
      'Call test panel',
      'Call logs',
    ],
    rowActions: ['Edit', 'Disable', 'Delete', 'Test', 'Details'],
    emptyTitle: 'No model providers yet',
    emptyDescription: 'Configure OpenAI-compatible providers, masked keys, models, pricing, and call tests.',
  },
  {
    key: 'knowledge',
    title: 'Knowledge Center',
    navTitle: 'Knowledge',
    href: '/knowledge',
    description: 'Manage knowledge bases, documents, segments, embedding tasks, search, and agent bindings.',
    permission: 'knowledge.read',
    status: 'planned',
    primaryAction: 'New Knowledge Base',
    metrics: [
      { label: 'Knowledge bases', value: '0', helper: 'M06 data source' },
      { label: 'Documents', value: '0', helper: 'MinIO metadata' },
      { label: 'Segments', value: '0', helper: 'PostgreSQL segments' },
      { label: 'Failed tasks', value: '0', helper: 'Embedding tasks' },
    ],
    filters: ['Keyword: name/code/description', 'Status', 'Visibility', 'Updated time'],
    columns: ['Name', 'Code', 'Documents', 'Segments', 'Status', 'Updated at', 'Actions'],
    detailSections: [
      'Basic information',
      'Document list',
      'Upload panel',
      'Document preview',
      'Segments',
      'Retrieval test',
      'Processing tasks',
      'Agent bindings',
    ],
    rowActions: ['Edit', 'Upload', 'Retrieval test', 'Rebuild index', 'Delete', 'Details'],
    emptyTitle: 'No knowledge bases yet',
    emptyDescription: 'M06 will add document upload, segmentation, embedding, and hybrid retrieval.',
  },
  {
    key: 'tools',
    title: 'Tool Center',
    navTitle: 'Tools',
    href: '/tools',
    description: 'Manage HTTP tools, JSON schemas, auth configs, risk policies, tests, and call logs.',
    permission: 'tool.read',
    status: 'planned',
    primaryAction: 'New HTTP Tool',
    metrics: [
      { label: 'Tools', value: '0', helper: 'M07 data source' },
      { label: 'Enabled', value: '0', helper: 'Callable tools' },
      { label: 'Calls today', value: '0', helper: 'Tool call logs' },
      { label: 'Failure rate', value: '0%', helper: 'Execution status' },
    ],
    filters: ['Keyword: name/code/url', 'Type', 'Status', 'Risk level'],
    columns: ['Name', 'Code', 'Type', 'Method', 'Risk level', 'Status', 'Updated at', 'Actions'],
    detailSections: [
      'Basic information',
      'HTTP configuration',
      'Input JSON Schema',
      'Output JSON Schema',
      'Auth configuration',
      'Safety policy',
      'Test panel',
      'Agent bindings',
      'Call logs',
    ],
    rowActions: ['Edit', 'Copy', 'Enable', 'Disable', 'Test', 'Delete', 'Details'],
    emptyTitle: 'No tools yet',
    emptyDescription: 'M07 will add schema validation, HTTP execution, and high-risk approval placeholders.',
  },
  {
    key: 'conversations',
    title: 'Conversation Center',
    navTitle: 'Conversations',
    href: '/conversations',
    description: 'Inspect agent conversations, messages, citations, tool calls, run steps, and feedback.',
    permission: 'conversation.read',
    status: 'planned',
    primaryAction: 'New Conversation',
    metrics: [
      { label: 'Conversations', value: '0', helper: 'M08 data source' },
      { label: 'Messages', value: '0', helper: 'Stored messages' },
      { label: 'Active runs', value: '0', helper: 'Runtime runs' },
      { label: 'Feedback', value: '0', helper: 'User ratings' },
    ],
    filters: ['Agent', 'User', 'Status', 'Last message time'],
    columns: ['Agent', 'User', 'Title', 'Messages', 'Status', 'Last message at', 'Actions'],
    detailSections: [
      'Message stream',
      'References',
      'Tool calls',
      'Run steps',
      'Debug prompt',
      'Model config',
      'Feedback',
    ],
    rowActions: ['Open', 'Continue', 'Inspect run', 'Export', 'Delete'],
    emptyTitle: 'No conversations yet',
    emptyDescription: 'M08 will connect agent chat, SSE, run traces, references, and feedback.',
  },
  {
    key: 'monitor',
    title: 'Monitor',
    navTitle: 'Monitor',
    href: '/monitor',
    description: 'Operate platform health, latency, token cost, model/tool/RAG metrics, and errors.',
    permission: 'monitor.read',
    status: 'planned',
    primaryAction: 'Export Report',
    metrics: [
      { label: 'Calls today', value: '0', helper: 'M09 data source' },
      { label: 'Success rate', value: '0%', helper: 'Run status' },
      { label: 'Average latency', value: '0 ms', helper: 'Run duration' },
      { label: 'P95 latency', value: '0 ms', helper: 'Trace metrics' },
    ],
    filters: ['Time range', 'Agent', 'Model', 'Status'],
    columns: ['Trace ID', 'Module', 'Status', 'Latency', 'Tokens', 'Cost', 'Occurred at', 'Actions'],
    detailSections: [
      'Call overview',
      'Token cost trend',
      'Agent ranking',
      'Model monitor',
      'Tool monitor',
      'RAG monitor',
      'Error detail',
    ],
    rowActions: ['View trace', 'Open run', 'Copy trace ID'],
    emptyTitle: 'No monitor data yet',
    emptyDescription: 'M09 will aggregate run, model, tool, and recall logs into operational views.',
  },
  {
    key: 'audit',
    title: 'Audit',
    navTitle: 'Audit',
    href: '/audit',
    description: 'Query login logs, operation logs, security events, and configuration change records.',
    permission: 'audit.read',
    status: 'planned',
    primaryAction: 'Export Audit',
    metrics: [
      { label: 'Login logs', value: '0', helper: 'M02/M09 data source' },
      { label: 'Operations', value: '0', helper: 'Write audit records' },
      { label: 'Security events', value: '0', helper: 'Security policies' },
      { label: 'Config changes', value: '0', helper: 'Diff records' },
    ],
    filters: ['User', 'Tenant', 'Module', 'Action', 'Time range', 'Result'],
    columns: ['Time', 'User', 'Tenant', 'Module', 'Action', 'Result', 'Trace ID', 'Actions'],
    detailSections: [
      'Request summary',
      'Response summary',
      'IP address',
      'User-Agent',
      'Trace ID',
      'Before/after diff',
    ],
    rowActions: ['Details', 'Copy trace ID'],
    emptyTitle: 'No audit records yet',
    emptyDescription: 'M09 will provide structured audit query and security event details.',
  },
  {
    key: 'settings',
    title: 'Settings',
    navTitle: 'Settings',
    href: '/settings',
    description: 'Prepare tenant, user, role, API key, security, environment, and deployment settings.',
    permission: 'settings.read',
    status: 'planned',
    primaryAction: 'Open Tenant Settings',
    metrics: [
      { label: 'Tenants', value: '1', helper: 'Demo session only' },
      { label: 'Users', value: '1', helper: 'M02 data source' },
      { label: 'Roles', value: '0', helper: 'RBAC setup' },
      { label: 'API keys', value: '0', helper: 'Machine calls' },
    ],
    filters: ['Setting category', 'Status', 'Updated by'],
    columns: ['Category', 'Name', 'Status', 'Updated by', 'Updated at', 'Actions'],
    detailSections: [
      'Tenant profile',
      'User and role settings',
      'API key settings',
      'Security policy',
      'CORS allowlist',
      'Environment variables',
    ],
    rowActions: ['Open', 'Edit', 'Audit'],
    emptyTitle: 'Settings are not connected yet',
    emptyDescription: 'M02 will add tenants, users, RBAC, API keys, login logs, and operation logs.',
  },
];

export function getModuleSpec(key: string) {
  return moduleSpecs.find((moduleSpec) => moduleSpec.key === key);
}

export function requireModuleSpec(key: string) {
  const moduleSpec = getModuleSpec(key);

  if (!moduleSpec) {
    throw new Error(`Unknown module spec: ${key}`);
  }

  return moduleSpec;
}
