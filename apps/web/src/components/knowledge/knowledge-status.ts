import type {
  KnowledgeBaseStatus,
  KnowledgeDocumentStatus,
  KnowledgeRetrievalMode,
  KnowledgeSourceType,
  KnowledgeTaskStatus,
  KnowledgeTaskType,
  KnowledgeVectorStatus,
  KnowledgeVisibility,
} from '@aiaget/shared-types';

export function knowledgeStatusTone(status: KnowledgeBaseStatus | KnowledgeDocumentStatus | KnowledgeTaskStatus) {
  if (status === 'ACTIVE' || status === 'READY' || status === 'SUCCESS') return 'healthy';
  if (status === 'PROCESSING' || status === 'RUNNING' || status === 'PENDING') return 'mock';
  if (status === 'DISABLED') return 'degraded';
  if (status === 'FAILED' || status === 'DELETED') return 'unavailable';

  return 'planned';
}

const statusLabels: Record<string, string> = {
  ACTIVE: '启用',
  DISABLED: '停用',
  ARCHIVED: '归档',
  PENDING: '等待中',
  PROCESSING: '处理中',
  READY: '就绪',
  FAILED: '失败',
  DELETED: '已删除',
  RUNNING: '运行中',
  SUCCESS: '成功',
};

const visibilityLabels: Record<KnowledgeVisibility, string> = {
  PRIVATE: '私有',
  TENANT: '租户可见',
  PUBLIC: '公开',
};

const retrievalModeLabels: Record<KnowledgeRetrievalMode, string> = {
  HYBRID: '混合检索',
  VECTOR: '向量检索',
  KEYWORD: '关键词检索',
};

const sourceTypeLabels: Record<KnowledgeSourceType, string> = {
  TEXT: '文本',
  MARKDOWN: 'Markdown 文档',
  PDF: 'PDF',
  WORD: 'Word 文档',
  EXCEL: 'Excel 表格',
  HTML: 'HTML 页面',
  URL: '链接',
  FAQ: '常见问答',
};

const taskTypeLabels: Record<KnowledgeTaskType, string> = {
  PROCESS: '处理',
  PARSE: '解析',
  SEGMENT: '切片',
  EMBED: '向量化',
  INDEX: '建索引',
  REBUILD: '重建索引',
};

export function knowledgeStatusLabel(status: KnowledgeBaseStatus | KnowledgeDocumentStatus | KnowledgeTaskStatus | KnowledgeVectorStatus) {
  return statusLabels[status] ?? status;
}

export function knowledgeVisibilityLabel(visibility: KnowledgeVisibility) {
  return visibilityLabels[visibility] ?? visibility;
}

export function knowledgeRetrievalModeLabel(mode: KnowledgeRetrievalMode) {
  return retrievalModeLabels[mode] ?? mode;
}

export function knowledgeSourceTypeLabel(sourceType: KnowledgeSourceType) {
  return sourceTypeLabels[sourceType] ?? sourceType;
}

export function knowledgeTaskTypeLabel(taskType: KnowledgeTaskType) {
  return taskTypeLabels[taskType] ?? taskType;
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) return '-';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString();
}

export function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;

  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
