import type { SkillCategory, SkillStatus } from '@aiaget/shared-types';

const statusLabels: Record<SkillStatus, string> = {
  DRAFT: '草稿',
  PUBLISHED: '已发布',
  DISABLED: '已停用',
  ARCHIVED: '已归档',
};

const categoryLabels: Record<SkillCategory, string> = {
  GENERAL: '通用',
  SALES: '销售',
  DESIGN: '设计',
  OPERATIONS: '运营',
  TRAINING: '培训',
  REVIEW: '评审',
};

export function skillStatusLabel(status: SkillStatus) {
  return statusLabels[status] ?? status;
}

export function skillStatusTone(status: SkillStatus) {
  if (status === 'PUBLISHED') return 'healthy';
  if (status === 'DRAFT') return 'planned';
  if (status === 'DISABLED') return 'degraded';
  return 'unavailable';
}

export function skillCategoryLabel(category: SkillCategory) {
  return categoryLabels[category] ?? category;
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) return '-';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString();
}
