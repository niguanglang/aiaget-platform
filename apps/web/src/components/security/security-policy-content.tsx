'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  hasPermission,
  type CreateSecurityPolicyInput,
  type SecurityCenterDenialItem,
  type SecurityCenterEventDetail,
  type SecurityCenterEventListItem,
  type SecurityCenterEventSource,
  type SecurityCenterEventWindow,
  type SecurityCenterModuleSummary,
  type SecurityCenterOperationalAlert,
  type SecurityCenterOverview,
  type SecurityApprovalWorkbenchDetail,
  type SecurityApprovalWorkbenchItem,
  type SecurityApprovalWorkbenchOverview,
  type SecurityApprovalWorkbenchRiskDomain,
  type SecurityApprovalWorkbenchRiskLevel,
  type SecurityApprovalWorkbenchStatus,
  type SecurityApprovalWorkbenchTimelineItem,
  type SecurityApprovalWorkbenchType,
  type SecurityCenterRiskLevel,
  type SecurityCenterRiskSignal,
  type SecurityOperationAlertAction,
  type SecurityOperationAlertActionResult,
  type SecurityOperationAlertNotificationArchiveApprovalDetail,
  type SecurityOperationAlertNotificationArchiveApprovalItem,
  type SecurityOperationAlertNotificationArchiveApprovalOverview,
  type SecurityOperationAlertNotificationArchiveApprovalTimelineItem,
  type SecurityOperationAlertNotificationArchiveItem,
  type SecurityOperationAlertNotificationOverview,
  type SecurityOperationAlertNotificationResult,
  type SecurityOperationAlertNotificationStatus,
  type SecurityOperationAlertNotificationTaskOverview,
  type SecurityOperationAlertNotificationTaskRecoveryAction,
  type SecurityOperationAlertNotificationTaskRecoveryActionResult,
  type SecurityOperationAlertNotificationTaskRecoveryAuditArchiveApprovalDetail,
  type SecurityOperationAlertNotificationTaskRecoveryAuditArchiveApprovalItem,
  type SecurityOperationAlertNotificationTaskRecoveryAuditArchiveApprovalOverview,
  type SecurityOperationAlertNotificationTaskRecoveryAuditArchiveApprovalTimelineItem,
  type SecurityOperationAlertNotificationTaskRecoveryAuditArchiveItem,
  type SecurityOperationAlertNotificationTaskRecoveryAuditItem,
  type SecurityOperationAlertNotificationTaskRecoveryAuditOverview,
  type SecurityOperationAlertNotificationTaskRecoveryFailureSource,
  type SecurityOperationAlertNotificationTaskName,
  type SecurityOperationAlertNotificationTaskRecoverySuggestion,
  type SecurityOperationAlertNotificationTaskRecoveryStatus,
  type SecurityOperationAlertNotificationTaskRunItem,
  type SecurityOperationAlertNotificationTaskRunOverview,
  type SecurityOperationAlertNotificationTaskRunResult,
  type SecurityOperationAlertSlaDeadLetterAction,
  type SecurityOperationAlertSlaDeadLetterAuditArchiveApprovalDetail,
  type SecurityOperationAlertSlaDeadLetterAuditArchiveApprovalItem,
  type SecurityOperationAlertSlaDeadLetterAuditArchiveApprovalTimelineItem,
  type SecurityOperationAlertSlaDeadLetterAuditArchiveApprovalOverview,
  type SecurityOperationAlertSlaDeadLetterAuditArchiveItem,
  type SecurityOperationAlertSlaDeadLetterAuditItem,
  type SecurityOperationAlertSlaDeadLetterActionResult,
  type SecurityOperationAlertSlaDeadLetterDispositionStatus,
  type SecurityOperationAlertSlaDeadLetterItem,
  type SecurityOperationAlertSlaDeadLetterOverview,
  type SecurityOperationAlertSlaItem,
  type SecurityOperationAlertSlaNotificationItem,
  type SecurityOperationAlertSlaNotificationOverview,
  type SecurityOperationAlertSlaNotificationRetryOverview,
  type SecurityOperationAlertSlaNotificationRetryTaskRunResult,
  type SecurityOperationAlertSlaNotificationResult,
  type SecurityOperationAlertSlaOverview,
  type SecurityOperationAlertSlaStatus,
  type SecurityOperationAlertSlaTaskRunResult,
  SecurityPolicyDetail,
  SecurityPolicyEffect,
  SecurityPolicyEvaluationItem,
  SecurityPolicyListItem,
  SecurityPolicyStatus,
  SimulateSecurityPolicyResult,
  UpdateSecurityPolicyInput,
} from '@aiaget/shared-types';
import { motion } from 'motion/react';
import {
  Activity,
  AlertTriangle,
  Archive,
  ArrowRight,
  ClipboardCheck,
  Copy,
  ChevronLeft,
  ChevronRight,
  Download,
  Edit,
  Eye,
  FileSearch,
  KeyRound,
  Play,
  Plus,
  Power,
  RefreshCw,
  Search,
  ShieldCheck,
  ShieldEllipsis,
  SlidersHorizontal,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import { useAuth } from '@/components/auth/auth-provider';
import { SecurityPolicyBackground } from '@/components/security/security-policy-background';
import {
  formatDateTime,
  securityPolicyDecisionLabel,
  securityPolicyDecisionTone,
  securityPolicyEffectLabel,
  securityPolicyEffectTone,
  securityPolicyStatusLabel,
  securityPolicyStatusTone,
} from '@/components/security/security-policy-status';
import { parseJsonObjectText, stringifyJson } from '@/components/tools/tool-json';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { MetricCard } from '@/components/ui/metric-card';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  approveSecurityOperationAlertNotificationArchiveApproval,
  approveSecurityOperationAlertNotificationTaskRecoveryAuditArchiveApproval,
  approveSecurityOperationAlertSlaDeadLetterAuditArchiveApproval,
  createSecurityPolicy,
  createSecurityOperationAlertNotificationArchive,
  createSecurityOperationAlertNotificationTaskRecoveryAuditArchive,
  createSecurityOperationAlertSlaDeadLetterAuditArchive,
  deleteSecurityOperationAlertNotificationArchive,
  deleteSecurityOperationAlertNotificationTaskRecoveryAuditArchive,
  deleteSecurityOperationAlertSlaDeadLetterAuditArchive,
  deleteSecurityPolicy,
  disableSecurityPolicy,
  enableSecurityPolicy,
  exportSecurityOperationAlertNotificationTaskRecoveryAudits,
  exportSecurityOperationAlertNotifications,
  exportSecurityOperationAlertSlaDeadLetterAudits,
  getSecurityApprovalWorkbenchItem,
  getSecurityApprovalWorkbenchOverview,
  getSecurityOperationAlertNotificationArchiveApproval,
  getSecurityOperationAlertNotificationArchiveApprovalOverview,
  getSecurityCenterOverview,
  getSecurityCenterEvent,
  getSecurityOperationAlertNotificationArchiveDownloadUrl,
  getSecurityOperationAlertNotificationTaskRecoveryAuditArchiveApproval,
  getSecurityOperationAlertNotificationTaskRecoveryAuditArchiveApprovalOverview,
  getSecurityOperationAlertNotificationTaskRecoveryAuditArchiveDownloadUrl,
  getSecurityOperationAlertNotificationTaskOverview,
  getSecurityOperationAlertSlaDeadLetterAuditArchiveApproval,
  getSecurityOperationAlertSlaDeadLetterAuditArchiveApprovalOverview,
  getSecurityOperationAlertSlaDeadLetterAuditArchiveDownloadUrl,
  getSecurityOperationAlertSlaDeadLetterOverview,
  getSecurityOperationAlertSlaNotificationOverview,
  getSecurityOperationAlertSlaNotificationRetryOverview,
  getSecurityOperationAlertSlaOverview,
  getSecurityPolicy,
  getSecurityPolicyOverview,
  listSecurityCenterEvents,
  listSecurityApprovalWorkbenchItems,
  listSecurityOperationAlertNotificationArchiveApprovals,
  listSecurityOperationAlertNotificationArchives,
  listSecurityOperationAlertNotificationTaskRecoveryAuditArchiveApprovals,
  listSecurityOperationAlertNotificationTaskRecoveryAuditArchives,
  listSecurityOperationAlertSlaDeadLetterAuditArchiveApprovals,
  listSecurityOperationAlertSlaDeadLetterAuditArchives,
  listSecurityOperationAlertSlaDeadLetterAudits,
  listSecurityOperationAlertNotifications,
  listSecurityOperationAlertNotificationTaskRecoveryAudits,
  listSecurityOperationAlertNotificationTaskRuns,
  listSecurityPolicies,
  listSecurityPolicyEvaluations,
  handleSecurityOperationAlertSlaDeadLetterAction,
  notifySecurityOperationAlert,
  notifySecurityOperationAlertSlaOverdue,
  rejectSecurityOperationAlertNotificationArchiveApproval,
  rejectSecurityOperationAlertNotificationTaskRecoveryAuditArchiveApproval,
  rejectSecurityOperationAlertSlaDeadLetterAuditArchiveApproval,
  reviewSecurityApprovalWorkbenchItem,
  retrySecurityOperationAlertNotification,
  retrySecurityOperationAlertSlaNotification,
  runSecurityOperationAlertNotificationAutoNotify,
  runSecurityOperationAlertNotificationAutoRetry,
  runSecurityOperationAlertSlaNotificationAutoRetry,
  runSecurityOperationAlertSlaEscalation,
  simulateSecurityPolicy,
  updateSecurityOperationAlert,
  updateSecurityOperationAlertNotificationTaskRecoverySuggestion,
  updateSecurityPolicy,
  type ApiClientError,
} from '@/lib/api-client';

const policyStatuses: SecurityPolicyStatus[] = ['ACTIVE', 'DISABLED', 'DELETED'];
const policyEffects: SecurityPolicyEffect[] = ['DENY', 'ALLOW'];
const eventSources: Array<{ label: string; value: SecurityCenterEventSource }> = [
  { label: '数据权限', value: 'DATA_SCOPE' },
  { label: '资源授权', value: 'RESOURCE_ACL' },
  { label: '安全策略', value: 'SECURITY_POLICY' },
  { label: '操作拒绝', value: 'OPERATION' },
];
const eventWindows: Array<{ label: string; value: SecurityCenterEventWindow }> = [
  { label: '最近 1 小时', value: '1h' },
  { label: '最近 24 小时', value: '24h' },
  { label: '最近 7 天', value: '7d' },
  { label: '最近 30 天', value: '30d' },
];
const approvalWorkbenchTypes: Array<{ label: string; value: SecurityApprovalWorkbenchType }> = [
  { label: '工具调用审批', value: 'TOOL_CALL' },
  { label: '通知策略审批', value: 'NOTIFICATION_POLICY' },
  { label: '审批审计归档删除', value: 'APPROVAL_AUDIT_ARCHIVE_DELETE' },
  { label: '团队运行报告归档删除', value: 'AGENT_TEAM_RUN_REPORT_ARCHIVE_DELETE' },
  { label: '运营告警通知归档删除', value: 'OPERATION_ALERT_NOTIFICATION_ARCHIVE_DELETE' },
  { label: 'SLA 死信审计归档删除', value: 'SLA_DEAD_LETTER_AUDIT_ARCHIVE_DELETE' },
  { label: '自愈审计归档删除', value: 'NOTIFICATION_TASK_RECOVERY_AUDIT_ARCHIVE_DELETE' },
];
const approvalWorkbenchStatuses: Array<{ label: string; value: SecurityApprovalWorkbenchStatus }> = [
  { label: '待审批', value: 'PENDING' },
  { label: '已批准', value: 'APPROVED' },
  { label: '已拒绝', value: 'REJECTED' },
  { label: '已生效', value: 'APPLIED' },
];
const approvalWorkbenchRiskDomains: Array<{ label: string; value: SecurityApprovalWorkbenchRiskDomain }> = [
  { label: '工具风险', value: 'TOOL' },
  { label: '策略风险', value: 'POLICY' },
  { label: '审计归档', value: 'AUDIT_ARCHIVE' },
  { label: '运营告警', value: 'OPERATION_ALERT' },
];
const eventPageSize = 20;
const securityApprovalWorkbenchPageSize = 12;
const slaDeadLetterAuditPageSize = 6;
type PaginatedSecurityOperationAlertSlaDeadLetterAudits = {
  items: SecurityOperationAlertSlaDeadLetterAuditItem[];
  page: number;
  page_size: number;
  total: number;
};
const securityModuleIcons = {
  security_policies: ShieldCheck,
  data_scopes: SlidersHorizontal,
  resource_acls: KeyRound,
  approvals: ClipboardCheck,
  audit: FileSearch,
  monitor: Activity,
} satisfies Record<SecurityCenterModuleSummary['key'], typeof ShieldCheck>;

const defaultConditions = {
  all: [
    {
      path: 'subject.department_id',
      operator: 'eq',
      value: 'sales',
      label: '主体部门匹配',
    },
  ],
};

const defaultSubject = {
  id: 'user_001',
  role: 'operator',
  department_id: 'sales',
  security_level: 'internal',
};

const defaultResource = {
  id: 'agent_001',
  type: 'agent',
  owner_department_id: 'sales',
  security_level: 'internal',
};

const defaultContext = {
  ip: '127.0.0.1',
  channel: 'console',
};

export function SecurityPolicyContent() {
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState('');
  const [effect, setEffect] = useState('');
  const [resourceType, setResourceType] = useState('');
  const [formMode, setFormMode] = useState<'create' | 'edit' | null>(null);
  const [editingPolicy, setEditingPolicy] = useState<SecurityPolicyDetail | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SecurityPolicyListItem | SecurityPolicyDetail | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [simulateError, setSimulateError] = useState<string | null>(null);
  const [simulateResult, setSimulateResult] = useState<SimulateSecurityPolicyResult | null>(null);
  const [simulateAction, setSimulateAction] = useState('read');
  const [subjectText, setSubjectText] = useState(stringifyJson(defaultSubject));
  const [resourceText, setResourceText] = useState(stringifyJson(defaultResource));
  const [contextText, setContextText] = useState(stringifyJson(defaultContext));
  const [eventKeyword, setEventKeyword] = useState('');
  const [eventSource, setEventSource] = useState('');
  const [eventWindow, setEventWindow] = useState<SecurityCenterEventWindow>('24h');
  const [eventTraceOnly, setEventTraceOnly] = useState(false);
  const [eventPage, setEventPage] = useState(1);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [approvalWorkbenchKeyword, setApprovalWorkbenchKeyword] = useState('');
  const [approvalWorkbenchType, setApprovalWorkbenchType] = useState<SecurityApprovalWorkbenchType | ''>('');
  const [approvalWorkbenchStatus, setApprovalWorkbenchStatus] = useState<SecurityApprovalWorkbenchStatus | ''>('PENDING');
  const [approvalWorkbenchRiskDomain, setApprovalWorkbenchRiskDomain] = useState<SecurityApprovalWorkbenchRiskDomain | ''>('');
  const [approvalWorkbenchPage, setApprovalWorkbenchPage] = useState(1);
  const [selectedApprovalWorkbenchId, setSelectedApprovalWorkbenchId] = useState<string | null>(null);
  const [approvalWorkbenchNote, setApprovalWorkbenchNote] = useState('');
  const [approvalWorkbenchMessage, setApprovalWorkbenchMessage] = useState<string | null>(null);
  const [approvalWorkbenchError, setApprovalWorkbenchError] = useState<string | null>(null);
  const [operationNotificationStatus, setOperationNotificationStatus] = useState<
    SecurityOperationAlertNotificationStatus | ''
  >('');
  const [operationNotificationCategory, setOperationNotificationCategory] = useState('');
  const [operationNotificationKeyword, setOperationNotificationKeyword] = useState('');
  const [operationNotificationExportState, setOperationNotificationExportState] = useState<
    'idle' | 'exporting' | 'success' | 'error'
  >('idle');
  const [operationNotificationArchiveMessage, setOperationNotificationArchiveMessage] = useState<string | null>(null);
  const [operationNotificationArchiveError, setOperationNotificationArchiveError] = useState<string | null>(null);
  const [operationNotificationArchiveApprovalNote, setOperationNotificationArchiveApprovalNote] = useState('');
  const [operationNotificationTaskRunTask, setOperationNotificationTaskRunTask] = useState<
    SecurityOperationAlertNotificationTaskName | ''
  >('');
  const [operationNotificationTaskRunStatus, setOperationNotificationTaskRunStatus] = useState<
    SecurityOperationAlertNotificationTaskRunResult['status'] | ''
  >('');
  const [operationNotificationTaskRunKeyword, setOperationNotificationTaskRunKeyword] = useState('');
  const [operationNotificationTaskRecoveryAuditAction, setOperationNotificationTaskRecoveryAuditAction] = useState<
    SecurityOperationAlertNotificationTaskRecoveryAction | ''
  >('');
  const [operationNotificationTaskRecoveryAuditStatus, setOperationNotificationTaskRecoveryAuditStatus] = useState<
    SecurityOperationAlertNotificationTaskRecoveryStatus | ''
  >('');
  const [operationNotificationTaskRecoveryAuditReason, setOperationNotificationTaskRecoveryAuditReason] = useState<
    SecurityOperationAlertNotificationTaskRecoverySuggestion['reason_code'] | ''
  >('');
  const [operationNotificationTaskRecoveryAuditFailureSource, setOperationNotificationTaskRecoveryAuditFailureSource] =
    useState<SecurityOperationAlertNotificationTaskRecoveryFailureSource | ''>('');
  const [operationNotificationTaskRecoveryAuditKeyword, setOperationNotificationTaskRecoveryAuditKeyword] = useState('');
  const [operationNotificationTaskRecoveryAuditExportState, setOperationNotificationTaskRecoveryAuditExportState] =
    useState<'idle' | 'exporting' | 'success' | 'error'>('idle');
  const [operationNotificationTaskRecoveryAuditArchiveMessage, setOperationNotificationTaskRecoveryAuditArchiveMessage] =
    useState<string | null>(null);
  const [operationNotificationTaskRecoveryAuditArchiveError, setOperationNotificationTaskRecoveryAuditArchiveError] =
    useState<string | null>(null);
  const [operationNotificationTaskRecoveryAuditArchiveApprovalNote, setOperationNotificationTaskRecoveryAuditArchiveApprovalNote] =
    useState('');
  const [operationAlertNotificationResults, setOperationAlertNotificationResults] = useState<
    Record<string, SecurityOperationAlertNotificationResult>
  >({});
  const [operationAlertActionResults, setOperationAlertActionResults] = useState<
    Record<string, SecurityOperationAlertActionResult>
  >({});
  const [operationAlertNotificationTaskRecoveryActionResults, setOperationAlertNotificationTaskRecoveryActionResults] =
    useState<Record<string, SecurityOperationAlertNotificationTaskRecoveryActionResult>>({});
  const [slaDeadLetterNote, setSlaDeadLetterNote] = useState('');
  const [slaDeadLetterAuditKeyword, setSlaDeadLetterAuditKeyword] = useState('');
  const [slaDeadLetterAuditAction, setSlaDeadLetterAuditAction] = useState<SecurityOperationAlertSlaDeadLetterAction | ''>('');
  const [slaDeadLetterAuditStatus, setSlaDeadLetterAuditStatus] = useState<SecurityOperationAlertSlaDeadLetterDispositionStatus | ''>('');
  const [slaDeadLetterAuditPage, setSlaDeadLetterAuditPage] = useState(1);
  const [slaDeadLetterAuditExportState, setSlaDeadLetterAuditExportState] = useState<
    'idle' | 'exporting' | 'success' | 'error'
  >('idle');
  const [slaDeadLetterAuditArchiveMessage, setSlaDeadLetterAuditArchiveMessage] = useState<string | null>(null);
  const [slaDeadLetterAuditArchiveError, setSlaDeadLetterAuditArchiveError] = useState<string | null>(null);
  const [slaDeadLetterAuditArchiveApprovalNote, setSlaDeadLetterAuditArchiveApprovalNote] = useState('');
  const operationNotificationExportParams = useMemo(
    () => ({
      status: operationNotificationStatus,
      alert_category: operationNotificationCategory,
      keyword: operationNotificationKeyword,
    }),
    [operationNotificationCategory, operationNotificationKeyword, operationNotificationStatus],
  );
  const operationNotificationTaskRecoveryAuditExportParams = useMemo(
    () => ({
      keyword: operationNotificationTaskRecoveryAuditKeyword,
      action: operationNotificationTaskRecoveryAuditAction,
      status: operationNotificationTaskRecoveryAuditStatus,
      reason_code: operationNotificationTaskRecoveryAuditReason,
      failure_source: operationNotificationTaskRecoveryAuditFailureSource,
    }),
    [
      operationNotificationTaskRecoveryAuditAction,
      operationNotificationTaskRecoveryAuditFailureSource,
      operationNotificationTaskRecoveryAuditKeyword,
      operationNotificationTaskRecoveryAuditReason,
      operationNotificationTaskRecoveryAuditStatus,
    ],
  );
  const slaDeadLetterAuditExportParams = useMemo(
    () => ({
      keyword: slaDeadLetterAuditKeyword,
      action: slaDeadLetterAuditAction,
      disposition_status: slaDeadLetterAuditStatus,
    }),
    [slaDeadLetterAuditAction, slaDeadLetterAuditKeyword, slaDeadLetterAuditStatus],
  );

  const canWrite = Boolean(
    currentUser?.user.roles.some((role) => role.code === 'tenant_admin') ||
      hasPermission(currentUser?.user.permissions ?? [], 'security:rule:manage'),
  );

  const canViewApprovals = Boolean(
    currentUser?.user.roles.some((role) => role.code === 'tenant_admin') ||
      hasPermission(currentUser?.user.permissions ?? [], 'security:approval:view') ||
      hasPermission(currentUser?.user.permissions ?? [], 'security:approval:handle'),
  );

  const canHandleApprovals = Boolean(
    currentUser?.user.roles.some((role) => role.code === 'tenant_admin') ||
      hasPermission(currentUser?.user.permissions ?? [], 'security:approval:handle'),
  );

  const overviewQuery = useQuery({
    queryKey: ['security-policy-overview'],
    queryFn: getSecurityPolicyOverview,
  });

  const securityCenterQuery = useQuery({
    queryKey: ['security-center-overview'],
    queryFn: getSecurityCenterOverview,
  });

  const policiesQuery = useQuery({
    queryKey: ['security-policies', keyword, status, effect, resourceType],
    queryFn: () =>
      listSecurityPolicies({
        page: 1,
        page_size: 20,
        keyword,
        status,
        effect,
        resource_type: resourceType,
      }),
  });

  const evaluationsQuery = useQuery({
    queryKey: ['security-policy-evaluations'],
    queryFn: () =>
      listSecurityPolicyEvaluations({
        page: 1,
        page_size: 12,
      }),
  });

  const securityEventsQuery = useQuery({
    queryKey: ['security-center-events', eventKeyword, eventSource, eventWindow, eventTraceOnly, eventPage],
    queryFn: () =>
      listSecurityCenterEvents({
        page: eventPage,
        page_size: eventPageSize,
        keyword: eventKeyword,
        source: eventSource,
        window: eventWindow,
        trace_only: eventTraceOnly,
      }),
  });

  const approvalWorkbenchOverviewQuery = useQuery({
    enabled: canViewApprovals,
    queryKey: ['security-approval-workbench-overview'],
    queryFn: getSecurityApprovalWorkbenchOverview,
  });

  const approvalWorkbenchQuery = useQuery({
    enabled: canViewApprovals,
    queryKey: [
      'security-approval-workbench',
      approvalWorkbenchKeyword,
      approvalWorkbenchType,
      approvalWorkbenchStatus,
      approvalWorkbenchRiskDomain,
      approvalWorkbenchPage,
    ],
    queryFn: () =>
      listSecurityApprovalWorkbenchItems({
        page: approvalWorkbenchPage,
        page_size: securityApprovalWorkbenchPageSize,
        keyword: approvalWorkbenchKeyword,
        type: approvalWorkbenchType,
        status: approvalWorkbenchStatus,
        risk_domain: approvalWorkbenchRiskDomain,
      }),
  });

  const selectedApprovalWorkbenchQuery = useQuery({
    enabled: canViewApprovals && Boolean(selectedApprovalWorkbenchId),
    queryKey: ['security-approval-workbench-detail', selectedApprovalWorkbenchId],
    queryFn: () => getSecurityApprovalWorkbenchItem(selectedApprovalWorkbenchId ?? ''),
  });

  const selectedEventQuery = useQuery({
    enabled: Boolean(selectedEventId),
    queryKey: ['security-center-event', selectedEventId],
    queryFn: () => getSecurityCenterEvent(selectedEventId ?? ''),
  });

  const operationAlertNotificationsQuery = useQuery({
    queryKey: [
      'security-operation-alert-notifications',
      operationNotificationStatus,
      operationNotificationCategory,
      operationNotificationKeyword,
    ],
    queryFn: () => listSecurityOperationAlertNotifications(operationNotificationExportParams),
  });

  const operationAlertNotificationArchivesQuery = useQuery({
    queryKey: ['security-operation-alert-notification-archives'],
    queryFn: listSecurityOperationAlertNotificationArchives,
  });

  const operationAlertNotificationArchiveApprovalOverviewQuery = useQuery({
    queryKey: ['security-operation-alert-notification-archive-approval-overview'],
    queryFn: getSecurityOperationAlertNotificationArchiveApprovalOverview,
  });

  const operationAlertNotificationArchiveApprovalsQuery = useQuery({
    queryKey: ['security-operation-alert-notification-archive-approvals'],
    queryFn: listSecurityOperationAlertNotificationArchiveApprovals,
  });

  const operationAlertNotificationTaskQuery = useQuery({
    queryKey: ['security-operation-alert-notification-task-overview'],
    queryFn: getSecurityOperationAlertNotificationTaskOverview,
  });

  const operationAlertNotificationTaskRunsQuery = useQuery({
    queryKey: [
      'security-operation-alert-notification-task-runs',
      operationNotificationTaskRunTask,
      operationNotificationTaskRunStatus,
      operationNotificationTaskRunKeyword,
    ],
    queryFn: () =>
      listSecurityOperationAlertNotificationTaskRuns({
        task: operationNotificationTaskRunTask,
        status: operationNotificationTaskRunStatus,
        keyword: operationNotificationTaskRunKeyword,
      }),
  });

  const operationAlertNotificationTaskRecoveryAuditsQuery = useQuery({
    queryKey: [
      'security-operation-alert-notification-task-recovery-audits',
      operationNotificationTaskRecoveryAuditAction,
      operationNotificationTaskRecoveryAuditStatus,
      operationNotificationTaskRecoveryAuditReason,
      operationNotificationTaskRecoveryAuditFailureSource,
      operationNotificationTaskRecoveryAuditKeyword,
    ],
    queryFn: () =>
      listSecurityOperationAlertNotificationTaskRecoveryAudits({
        action: operationNotificationTaskRecoveryAuditAction,
        status: operationNotificationTaskRecoveryAuditStatus,
        reason_code: operationNotificationTaskRecoveryAuditReason,
        failure_source: operationNotificationTaskRecoveryAuditFailureSource,
        keyword: operationNotificationTaskRecoveryAuditKeyword,
      }),
  });

  const operationAlertNotificationTaskRecoveryAuditArchivesQuery = useQuery({
    queryKey: ['security-operation-alert-notification-task-recovery-audit-archives'],
    queryFn: listSecurityOperationAlertNotificationTaskRecoveryAuditArchives,
  });

  const operationAlertNotificationTaskRecoveryAuditArchiveApprovalOverviewQuery = useQuery({
    queryKey: ['security-operation-alert-notification-task-recovery-audit-archive-approval-overview'],
    queryFn: getSecurityOperationAlertNotificationTaskRecoveryAuditArchiveApprovalOverview,
  });

  const operationAlertNotificationTaskRecoveryAuditArchiveApprovalsQuery = useQuery({
    queryKey: ['security-operation-alert-notification-task-recovery-audit-archive-approvals'],
    queryFn: listSecurityOperationAlertNotificationTaskRecoveryAuditArchiveApprovals,
  });

  const operationAlertSlaQuery = useQuery({
    queryKey: ['security-operation-alert-sla-overview'],
    queryFn: getSecurityOperationAlertSlaOverview,
  });

  const operationAlertSlaNotificationQuery = useQuery({
    queryKey: ['security-operation-alert-sla-notification-overview'],
    queryFn: getSecurityOperationAlertSlaNotificationOverview,
  });

  const operationAlertSlaNotificationRetryQuery = useQuery({
    queryKey: ['security-operation-alert-sla-notification-retry-overview'],
    queryFn: getSecurityOperationAlertSlaNotificationRetryOverview,
  });

  const operationAlertSlaDeadLetterQuery = useQuery({
    queryKey: ['security-operation-alert-sla-dead-letter-overview'],
    queryFn: getSecurityOperationAlertSlaDeadLetterOverview,
  });

  const operationAlertSlaDeadLetterAuditQuery = useQuery({
    queryKey: [
      'security-operation-alert-sla-dead-letter-audits',
      slaDeadLetterAuditKeyword,
      slaDeadLetterAuditAction,
      slaDeadLetterAuditStatus,
      slaDeadLetterAuditPage,
    ],
    queryFn: () =>
      listSecurityOperationAlertSlaDeadLetterAudits({
        page: slaDeadLetterAuditPage,
        page_size: slaDeadLetterAuditPageSize,
        keyword: slaDeadLetterAuditKeyword,
        action: slaDeadLetterAuditAction,
        disposition_status: slaDeadLetterAuditStatus,
      }),
  });

  const operationAlertSlaDeadLetterAuditArchivesQuery = useQuery({
    queryKey: ['security-operation-alert-sla-dead-letter-audit-archives'],
    queryFn: listSecurityOperationAlertSlaDeadLetterAuditArchives,
  });

  const operationAlertSlaDeadLetterAuditArchiveApprovalOverviewQuery = useQuery({
    queryKey: ['security-operation-alert-sla-dead-letter-audit-archive-approval-overview'],
    queryFn: getSecurityOperationAlertSlaDeadLetterAuditArchiveApprovalOverview,
  });

  const operationAlertSlaDeadLetterAuditArchiveApprovalsQuery = useQuery({
    queryKey: ['security-operation-alert-sla-dead-letter-audit-archive-approvals'],
    queryFn: listSecurityOperationAlertSlaDeadLetterAuditArchiveApprovals,
  });

  const policies = policiesQuery.data?.items ?? [];
  const overview = overviewQuery.data ?? null;
  const evaluations = evaluationsQuery.data?.items ?? [];
  const securityOverview = securityCenterQuery.data ?? null;
  const approvalWorkbenchOverview = approvalWorkbenchOverviewQuery.data ?? null;
  const approvalWorkbenchResult = approvalWorkbenchQuery.data ?? null;
  const approvalWorkbenchItems = approvalWorkbenchResult?.items ?? [];
  const approvalWorkbenchTotal = approvalWorkbenchResult?.total ?? 0;
  const approvalWorkbenchPageCount = Math.max(
    1,
    Math.ceil(approvalWorkbenchTotal / securityApprovalWorkbenchPageSize),
  );
  const securityEvents = securityEventsQuery.data?.items ?? [];
  const securityEventsTotal = securityEventsQuery.data?.total ?? 0;
  const securityEventsPageCount = Math.max(1, Math.ceil(securityEventsTotal / eventPageSize));
  const slaDeadLetterAuditTotal = operationAlertSlaDeadLetterAuditQuery.data?.total ?? 0;
  const slaDeadLetterAuditPageCount = Math.max(1, Math.ceil(slaDeadLetterAuditTotal / slaDeadLetterAuditPageSize));

  useEffect(() => {
    if (eventPage > securityEventsPageCount) {
      setEventPage(securityEventsPageCount);
    }
  }, [eventPage, securityEventsPageCount]);

  useEffect(() => {
    if (approvalWorkbenchPage > approvalWorkbenchPageCount) {
      setApprovalWorkbenchPage(approvalWorkbenchPageCount);
    }
  }, [approvalWorkbenchPage, approvalWorkbenchPageCount]);

  useEffect(() => {
    if (selectedApprovalWorkbenchId && !approvalWorkbenchItems.some((item) => item.id === selectedApprovalWorkbenchId)) {
      setSelectedApprovalWorkbenchId(approvalWorkbenchItems[0]?.id ?? null);
    } else if (!selectedApprovalWorkbenchId && approvalWorkbenchItems.length > 0) {
      setSelectedApprovalWorkbenchId(approvalWorkbenchItems[0]?.id ?? null);
    }
  }, [approvalWorkbenchItems, selectedApprovalWorkbenchId]);

  useEffect(() => {
    if (slaDeadLetterAuditPage > slaDeadLetterAuditPageCount) {
      setSlaDeadLetterAuditPage(slaDeadLetterAuditPageCount);
    }
  }, [slaDeadLetterAuditPage, slaDeadLetterAuditPageCount]);

  async function handleExportOperationAlertNotifications() {
    setOperationNotificationExportState('exporting');
    try {
      const blob = await exportSecurityOperationAlertNotifications(operationNotificationExportParams);
      downloadBlob(blob, `运营告警通知审计-${new Date().toISOString().slice(0, 10)}.csv`);
      setOperationNotificationExportState('success');
    } catch {
      setOperationNotificationExportState('error');
    }
  }

  async function handleExportSlaDeadLetterAudits() {
    setSlaDeadLetterAuditExportState('exporting');
    try {
      const blob = await exportSecurityOperationAlertSlaDeadLetterAudits(slaDeadLetterAuditExportParams);
      downloadBlob(blob, `SLA死信处置审计-${new Date().toISOString().slice(0, 10)}.csv`);
      setSlaDeadLetterAuditExportState('success');
    } catch {
      setSlaDeadLetterAuditExportState('error');
    }
  }

  async function handleExportNotificationTaskRecoveryAudits() {
    setOperationNotificationTaskRecoveryAuditExportState('exporting');
    try {
      const blob = await exportSecurityOperationAlertNotificationTaskRecoveryAudits(
        operationNotificationTaskRecoveryAuditExportParams,
      );
      downloadBlob(blob, `通知任务自愈闭环审计-${new Date().toISOString().slice(0, 10)}.csv`);
      setOperationNotificationTaskRecoveryAuditExportState('success');
    } catch {
      setOperationNotificationTaskRecoveryAuditExportState('error');
    }
  }

  const createOperationAlertNotificationArchiveMutation = useMutation({
    mutationFn: () => createSecurityOperationAlertNotificationArchive(operationNotificationExportParams),
    onSuccess: async (result) => {
      setOperationNotificationArchiveError(null);
      setOperationNotificationArchiveMessage(`已生成归档 ${result.item.file_name}。`);
      await operationAlertNotificationArchivesQuery.refetch();
    },
    onError: (error: Error) => {
      setOperationNotificationArchiveMessage(null);
      setOperationNotificationArchiveError(error.message);
    },
  });

  const downloadOperationAlertNotificationArchiveMutation = useMutation({
    mutationFn: (archive: SecurityOperationAlertNotificationArchiveItem) =>
      getSecurityOperationAlertNotificationArchiveDownloadUrl(archive.id),
    onSuccess: (result) => {
      setOperationNotificationArchiveError(null);
      window.open(result.url, '_blank', 'noopener,noreferrer');
    },
    onError: (error: Error) => {
      setOperationNotificationArchiveMessage(null);
      setOperationNotificationArchiveError(error.message);
    },
  });

  const deleteOperationAlertNotificationArchiveMutation = useMutation({
    mutationFn: (archive: SecurityOperationAlertNotificationArchiveItem) =>
      deleteSecurityOperationAlertNotificationArchive(archive.id),
    onSuccess: async (result) => {
      setOperationNotificationArchiveError(null);
      setOperationNotificationArchiveMessage(`归档删除已提交审批，审批 ID：${result.approval_id}。`);
      await Promise.all([
        operationAlertNotificationArchiveApprovalOverviewQuery.refetch(),
        operationAlertNotificationArchiveApprovalsQuery.refetch(),
      ]);
    },
    onError: (error: Error) => {
      setOperationNotificationArchiveMessage(null);
      setOperationNotificationArchiveError(error.message);
    },
  });

  const approveOperationAlertNotificationArchiveApprovalMutation = useMutation({
    mutationFn: (approvalId: string) =>
      approveSecurityOperationAlertNotificationArchiveApproval(approvalId, {
        decision_note: operationNotificationArchiveApprovalNote.trim() || null,
      }),
    onSuccess: async () => {
      setOperationNotificationArchiveError(null);
      setOperationNotificationArchiveApprovalNote('');
      setOperationNotificationArchiveMessage('归档删除审批已通过，文件已从对象存储删除。');
      await Promise.all([
        operationAlertNotificationArchiveApprovalOverviewQuery.refetch(),
        operationAlertNotificationArchiveApprovalsQuery.refetch(),
        operationAlertNotificationArchivesQuery.refetch(),
      ]);
    },
    onError: (error: Error) => {
      setOperationNotificationArchiveMessage(null);
      setOperationNotificationArchiveError(error.message);
    },
  });

  const rejectOperationAlertNotificationArchiveApprovalMutation = useMutation({
    mutationFn: (approvalId: string) =>
      rejectSecurityOperationAlertNotificationArchiveApproval(approvalId, {
        decision_note: operationNotificationArchiveApprovalNote.trim() || null,
      }),
    onSuccess: async () => {
      setOperationNotificationArchiveError(null);
      setOperationNotificationArchiveApprovalNote('');
      setOperationNotificationArchiveMessage('归档删除申请已拒绝。');
      await Promise.all([
        operationAlertNotificationArchiveApprovalOverviewQuery.refetch(),
        operationAlertNotificationArchiveApprovalsQuery.refetch(),
      ]);
    },
    onError: (error: Error) => {
      setOperationNotificationArchiveMessage(null);
      setOperationNotificationArchiveError(error.message);
    },
  });

  const createNotificationTaskRecoveryAuditArchiveMutation = useMutation({
    mutationFn: () =>
      createSecurityOperationAlertNotificationTaskRecoveryAuditArchive(
        operationNotificationTaskRecoveryAuditExportParams,
      ),
    onSuccess: async (result) => {
      setOperationNotificationTaskRecoveryAuditArchiveError(null);
      setOperationNotificationTaskRecoveryAuditArchiveMessage(`已生成归档 ${result.item.file_name}。`);
      await operationAlertNotificationTaskRecoveryAuditArchivesQuery.refetch();
    },
    onError: (error: Error) => {
      setOperationNotificationTaskRecoveryAuditArchiveMessage(null);
      setOperationNotificationTaskRecoveryAuditArchiveError(error.message);
    },
  });

  const downloadNotificationTaskRecoveryAuditArchiveMutation = useMutation({
    mutationFn: (archive: SecurityOperationAlertNotificationTaskRecoveryAuditArchiveItem) =>
      getSecurityOperationAlertNotificationTaskRecoveryAuditArchiveDownloadUrl(archive.id),
    onSuccess: (result) => {
      setOperationNotificationTaskRecoveryAuditArchiveError(null);
      window.open(result.url, '_blank', 'noopener,noreferrer');
    },
    onError: (error: Error) => {
      setOperationNotificationTaskRecoveryAuditArchiveMessage(null);
      setOperationNotificationTaskRecoveryAuditArchiveError(error.message);
    },
  });

  const deleteNotificationTaskRecoveryAuditArchiveMutation = useMutation({
    mutationFn: (archive: SecurityOperationAlertNotificationTaskRecoveryAuditArchiveItem) =>
      deleteSecurityOperationAlertNotificationTaskRecoveryAuditArchive(archive.id),
    onSuccess: async (result) => {
      setOperationNotificationTaskRecoveryAuditArchiveError(null);
      setOperationNotificationTaskRecoveryAuditArchiveMessage(`归档删除已提交审批，审批 ID：${result.approval_id}。`);
      await Promise.all([
        operationAlertNotificationTaskRecoveryAuditArchiveApprovalOverviewQuery.refetch(),
        operationAlertNotificationTaskRecoveryAuditArchiveApprovalsQuery.refetch(),
      ]);
    },
    onError: (error: Error) => {
      setOperationNotificationTaskRecoveryAuditArchiveMessage(null);
      setOperationNotificationTaskRecoveryAuditArchiveError(error.message);
    },
  });

  const approveNotificationTaskRecoveryAuditArchiveApprovalMutation = useMutation({
    mutationFn: (approvalId: string) =>
      approveSecurityOperationAlertNotificationTaskRecoveryAuditArchiveApproval(approvalId, {
        decision_note: operationNotificationTaskRecoveryAuditArchiveApprovalNote.trim() || null,
      }),
    onSuccess: async () => {
      setOperationNotificationTaskRecoveryAuditArchiveError(null);
      setOperationNotificationTaskRecoveryAuditArchiveApprovalNote('');
      setOperationNotificationTaskRecoveryAuditArchiveMessage('归档删除审批已通过，文件已从对象存储删除。');
      await Promise.all([
        operationAlertNotificationTaskRecoveryAuditArchiveApprovalOverviewQuery.refetch(),
        operationAlertNotificationTaskRecoveryAuditArchiveApprovalsQuery.refetch(),
        operationAlertNotificationTaskRecoveryAuditArchivesQuery.refetch(),
      ]);
    },
    onError: (error: Error) => {
      setOperationNotificationTaskRecoveryAuditArchiveMessage(null);
      setOperationNotificationTaskRecoveryAuditArchiveError(error.message);
    },
  });

  const rejectNotificationTaskRecoveryAuditArchiveApprovalMutation = useMutation({
    mutationFn: (approvalId: string) =>
      rejectSecurityOperationAlertNotificationTaskRecoveryAuditArchiveApproval(approvalId, {
        decision_note: operationNotificationTaskRecoveryAuditArchiveApprovalNote.trim() || null,
      }),
    onSuccess: async () => {
      setOperationNotificationTaskRecoveryAuditArchiveError(null);
      setOperationNotificationTaskRecoveryAuditArchiveApprovalNote('');
      setOperationNotificationTaskRecoveryAuditArchiveMessage('归档删除申请已拒绝。');
      await Promise.all([
        operationAlertNotificationTaskRecoveryAuditArchiveApprovalOverviewQuery.refetch(),
        operationAlertNotificationTaskRecoveryAuditArchiveApprovalsQuery.refetch(),
      ]);
    },
    onError: (error: Error) => {
      setOperationNotificationTaskRecoveryAuditArchiveMessage(null);
      setOperationNotificationTaskRecoveryAuditArchiveError(error.message);
    },
  });

  const createSlaDeadLetterAuditArchiveMutation = useMutation({
    mutationFn: () => createSecurityOperationAlertSlaDeadLetterAuditArchive(slaDeadLetterAuditExportParams),
    onSuccess: async (result) => {
      setSlaDeadLetterAuditArchiveError(null);
      setSlaDeadLetterAuditArchiveMessage(`已生成归档 ${result.item.file_name}。`);
      await operationAlertSlaDeadLetterAuditArchivesQuery.refetch();
    },
    onError: (error: Error) => {
      setSlaDeadLetterAuditArchiveMessage(null);
      setSlaDeadLetterAuditArchiveError(error.message);
    },
  });

  const downloadSlaDeadLetterAuditArchiveMutation = useMutation({
    mutationFn: (archive: SecurityOperationAlertSlaDeadLetterAuditArchiveItem) =>
      getSecurityOperationAlertSlaDeadLetterAuditArchiveDownloadUrl(archive.id),
    onSuccess: (result) => {
      setSlaDeadLetterAuditArchiveError(null);
      window.open(result.url, '_blank', 'noopener,noreferrer');
    },
    onError: (error: Error) => {
      setSlaDeadLetterAuditArchiveMessage(null);
      setSlaDeadLetterAuditArchiveError(error.message);
    },
  });

  const deleteSlaDeadLetterAuditArchiveMutation = useMutation({
    mutationFn: (archive: SecurityOperationAlertSlaDeadLetterAuditArchiveItem) =>
      deleteSecurityOperationAlertSlaDeadLetterAuditArchive(archive.id),
    onSuccess: async (result) => {
      setSlaDeadLetterAuditArchiveError(null);
      setSlaDeadLetterAuditArchiveMessage(`归档删除已提交审批，审批 ID：${result.approval_id}。`);
      await Promise.all([
        operationAlertSlaDeadLetterAuditArchiveApprovalOverviewQuery.refetch(),
        operationAlertSlaDeadLetterAuditArchiveApprovalsQuery.refetch(),
      ]);
    },
    onError: (error: Error) => {
      setSlaDeadLetterAuditArchiveMessage(null);
      setSlaDeadLetterAuditArchiveError(error.message);
    },
  });

  const approveSlaDeadLetterAuditArchiveApprovalMutation = useMutation({
    mutationFn: (approvalId: string) =>
      approveSecurityOperationAlertSlaDeadLetterAuditArchiveApproval(approvalId, {
        decision_note: slaDeadLetterAuditArchiveApprovalNote.trim() || null,
      }),
    onSuccess: async () => {
      setSlaDeadLetterAuditArchiveError(null);
      setSlaDeadLetterAuditArchiveApprovalNote('');
      setSlaDeadLetterAuditArchiveMessage('归档删除审批已通过，文件已从对象存储删除。');
      await Promise.all([
        operationAlertSlaDeadLetterAuditArchiveApprovalOverviewQuery.refetch(),
        operationAlertSlaDeadLetterAuditArchiveApprovalsQuery.refetch(),
        operationAlertSlaDeadLetterAuditArchivesQuery.refetch(),
      ]);
    },
    onError: (error: Error) => {
      setSlaDeadLetterAuditArchiveMessage(null);
      setSlaDeadLetterAuditArchiveError(error.message);
    },
  });

  const rejectSlaDeadLetterAuditArchiveApprovalMutation = useMutation({
    mutationFn: (approvalId: string) =>
      rejectSecurityOperationAlertSlaDeadLetterAuditArchiveApproval(approvalId, {
        decision_note: slaDeadLetterAuditArchiveApprovalNote.trim() || null,
      }),
    onSuccess: async () => {
      setSlaDeadLetterAuditArchiveError(null);
      setSlaDeadLetterAuditArchiveApprovalNote('');
      setSlaDeadLetterAuditArchiveMessage('归档删除申请已拒绝。');
      await Promise.all([
        operationAlertSlaDeadLetterAuditArchiveApprovalOverviewQuery.refetch(),
        operationAlertSlaDeadLetterAuditArchiveApprovalsQuery.refetch(),
      ]);
    },
    onError: (error: Error) => {
      setSlaDeadLetterAuditArchiveMessage(null);
      setSlaDeadLetterAuditArchiveError(error.message);
    },
  });

  const createMutation = useMutation({
    mutationFn: createSecurityPolicy,
    onSuccess: async (policy) => {
      await refreshAfterPolicyChange(policy);
      closeForm();
    },
    onError: (error: ApiClientError) => setFormError(error.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, values }: { id: string; values: UpdateSecurityPolicyInput }) =>
      updateSecurityPolicy(id, values),
    onSuccess: async (policy) => {
      await refreshAfterPolicyChange(policy);
      closeForm();
    },
    onError: (error: ApiClientError) => setFormError(error.message),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, nextStatus }: { id: string; nextStatus: 'ACTIVE' | 'DISABLED' }) =>
      nextStatus === 'ACTIVE' ? enableSecurityPolicy(id) : disableSecurityPolicy(id),
    onSuccess: async (policy) => {
      await refreshAfterPolicyChange(policy);
      setActionError(null);
    },
    onError: (error: ApiClientError) => setActionError(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteSecurityPolicy,
    onSuccess: async () => {
      setDeleteTarget(null);
      setActionError(null);
      await invalidateSecurityQueries(queryClient);
    },
    onError: (error: ApiClientError) => setActionError(error.message),
  });

  const notifyOperationAlertMutation = useMutation({
    mutationFn: (alertId: string) =>
      notifySecurityOperationAlert(alertId, {
        channels: ['IN_APP', 'WEBHOOK'],
        note: '安全中心审批与归档运营告警手动通知',
      }),
    onSuccess: async (result) => {
      setOperationAlertNotificationResults((current) => ({
        ...current,
        [result.alert_id]: result,
      }));
      setActionError(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['security-center-overview'] }),
        queryClient.invalidateQueries({ queryKey: ['security-operation-alert-notifications'] }),
      ]);
    },
    onError: (error: ApiClientError) => setActionError(error.message),
  });

  const retryOperationNotificationMutation = useMutation({
    mutationFn: retrySecurityOperationAlertNotification,
    onSuccess: async (result) => {
      setOperationAlertNotificationResults((current) => ({
        ...current,
        [result.alert_id]: result,
      }));
      setActionError(null);
      await queryClient.invalidateQueries({ queryKey: ['security-operation-alert-notifications'] });
    },
    onError: (error: ApiClientError) => setActionError(error.message),
  });

  const runOperationNotificationAutoRetryMutation = useMutation({
    mutationFn: runSecurityOperationAlertNotificationAutoRetry,
    onSuccess: async () => {
      setActionError(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['security-center-overview'] }),
        operationAlertNotificationTaskQuery.refetch(),
        operationAlertNotificationsQuery.refetch(),
      ]);
    },
    onError: (error: ApiClientError) => setActionError(error.message),
  });

  const runOperationNotificationAutoNotifyMutation = useMutation({
    mutationFn: runSecurityOperationAlertNotificationAutoNotify,
    onSuccess: async () => {
      setActionError(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['security-center-overview'] }),
        operationAlertNotificationTaskQuery.refetch(),
        operationAlertNotificationsQuery.refetch(),
      ]);
    },
    onError: (error: ApiClientError) => setActionError(error.message),
  });

  const runOperationAlertSlaEscalationMutation = useMutation({
    mutationFn: runSecurityOperationAlertSlaEscalation,
    onSuccess: async () => {
      setActionError(null);
      await Promise.all([
        operationAlertSlaQuery.refetch(),
        queryClient.invalidateQueries({ queryKey: ['security-center-overview'] }),
      ]);
    },
    onError: (error: ApiClientError) => setActionError(error.message),
  });

  const notifyOperationAlertSlaOverdueMutation = useMutation({
    mutationFn: notifySecurityOperationAlertSlaOverdue,
    onSuccess: async () => {
      setActionError(null);
      await Promise.all([
        operationAlertSlaNotificationQuery.refetch(),
        operationAlertSlaNotificationRetryQuery.refetch(),
        operationAlertSlaQuery.refetch(),
      ]);
    },
    onError: (error: ApiClientError) => setActionError(error.message),
  });

  const runOperationAlertSlaNotificationAutoRetryMutation = useMutation({
    mutationFn: runSecurityOperationAlertSlaNotificationAutoRetry,
    onSuccess: async () => {
      setActionError(null);
      await Promise.all([
        operationAlertSlaNotificationQuery.refetch(),
        operationAlertSlaNotificationRetryQuery.refetch(),
      ]);
    },
    onError: (error: ApiClientError) => setActionError(error.message),
  });

  const retryOperationAlertSlaNotificationMutation = useMutation({
    mutationFn: retrySecurityOperationAlertSlaNotification,
    onSuccess: async () => {
      setActionError(null);
      await Promise.all([
        operationAlertSlaNotificationQuery.refetch(),
        operationAlertSlaNotificationRetryQuery.refetch(),
        operationAlertSlaDeadLetterQuery.refetch(),
        operationAlertSlaDeadLetterAuditQuery.refetch(),
      ]);
    },
    onError: (error: ApiClientError) => setActionError(error.message),
  });

  const handleOperationAlertSlaDeadLetterMutation = useMutation({
    mutationFn: ({
      action,
      notificationEventId,
      note,
    }: {
      action: SecurityOperationAlertSlaDeadLetterAction;
      notificationEventId: string;
      note: string | null;
    }) => handleSecurityOperationAlertSlaDeadLetterAction(notificationEventId, { action, note }),
    onSuccess: async () => {
      setActionError(null);
      setSlaDeadLetterNote('');
      await Promise.all([
        operationAlertSlaNotificationQuery.refetch(),
        operationAlertSlaNotificationRetryQuery.refetch(),
        operationAlertSlaDeadLetterQuery.refetch(),
      ]);
    },
    onError: (error: ApiClientError) => setActionError(error.message),
  });

  const reviewApprovalWorkbenchMutation = useMutation({
    mutationFn: ({
      approvalId,
      decision,
    }: {
      approvalId: string;
      decision: 'APPROVE' | 'REJECT';
    }) =>
      reviewSecurityApprovalWorkbenchItem(approvalId, {
        decision,
        decision_note: approvalWorkbenchNote.trim() || null,
      }),
    onSuccess: async (detail) => {
      setApprovalWorkbenchError(null);
      setApprovalWorkbenchNote('');
      setApprovalWorkbenchMessage(
        detail.status === 'REJECTED' ? '审批申请已拒绝。' : '审批申请已批准并同步更新来源记录。',
      );
      queryClient.setQueryData(['security-approval-workbench-detail', detail.id], detail);
      await invalidateSecurityQueries(queryClient);
    },
    onError: (error: ApiClientError) => {
      setApprovalWorkbenchMessage(null);
      setApprovalWorkbenchError(error.message);
    },
  });

  const updateOperationAlertMutation = useMutation({
    mutationFn: ({ action, alertId }: { action: SecurityOperationAlertAction; alertId: string }) =>
      updateSecurityOperationAlert(alertId, {
        action,
        note: `安全中心手动${securityOperationActionVerb(action)}`,
      }),
    onSuccess: async (result) => {
      setOperationAlertActionResults((current) => ({
        ...current,
        [result.alert_id]: result,
      }));
      setActionError(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['security-center-overview'] }),
        queryClient.invalidateQueries({ queryKey: ['security-operation-alert-notification-task-recovery-audits'] }),
      ]);
    },
    onError: (error: ApiClientError) => setActionError(error.message),
  });

  const updateNotificationTaskRecoverySuggestionMutation = useMutation({
    mutationFn: ({
      action,
      suggestionId,
    }: {
      action: SecurityOperationAlertNotificationTaskRecoveryAction;
      suggestionId: string;
    }) =>
      updateSecurityOperationAlertNotificationTaskRecoverySuggestion(suggestionId, {
        action,
        note: `安全中心手动${notificationTaskRecoveryActionVerb(action)}`,
      }),
    onSuccess: async (result) => {
      setOperationAlertNotificationTaskRecoveryActionResults((current) => ({
        ...current,
        [result.suggestion_id]: result,
      }));
      setActionError(null);
      await queryClient.invalidateQueries({ queryKey: ['security-center-overview'] });
    },
    onError: (error: ApiClientError) => setActionError(error.message),
  });

  const simulateMutation = useMutation({
    mutationFn: simulateSecurityPolicy,
    onSuccess: async (result) => {
      setSimulateResult(result);
      setSimulateError(null);
      await queryClient.invalidateQueries({ queryKey: ['security-policy-evaluations'] });
      await queryClient.invalidateQueries({ queryKey: ['security-policy-overview'] });
      await queryClient.invalidateQueries({ queryKey: ['security-center-overview'] });
      await queryClient.invalidateQueries({ queryKey: ['security-policies'] });
    },
    onError: (error: ApiClientError) => setSimulateError(error.message),
  });

  async function refreshAfterPolicyChange(policy: SecurityPolicyDetail) {
    queryClient.setQueryData(['security-policy', policy.id], policy);
    await invalidateSecurityQueries(queryClient);
  }

  function clearFilters() {
    setKeyword('');
    setStatus('');
    setEffect('');
    setResourceType('');
  }

  function openCreateForm() {
    setFormError(null);
    setEditingPolicy(null);
    setFormMode('create');
  }

  async function openEditForm(policy: SecurityPolicyListItem | SecurityPolicyDetail) {
    setFormError(null);
    const detail =
      'conditions' in policy
        ? policy
        : await queryClient.fetchQuery({
            queryKey: ['security-policy', policy.id],
            queryFn: () => getSecurityPolicy(policy.id),
          });

    setEditingPolicy(detail);
    setFormMode('edit');
  }

  function closeForm() {
    setFormError(null);
    setEditingPolicy(null);
    setFormMode(null);
  }

  function submitForm(values: PolicyFormValues) {
    setFormError(null);
    const payload = toPolicyPayload(values);
    if (!payload.ok) {
      setFormError(payload.message);
      return;
    }

    if (formMode === 'create') {
      createMutation.mutate(payload.value as CreateSecurityPolicyInput);
      return;
    }

    if (editingPolicy) {
      updateMutation.mutate({ id: editingPolicy.id, values: payload.value });
    }
  }

  function runSimulation() {
    const subject = parseJsonObjectText(subjectText, '主体属性');
    if (!subject.ok) {
      setSimulateError(subject.message);
      return;
    }

    const resource = parseJsonObjectText(resourceText, '资源属性');
    if (!resource.ok) {
      setSimulateError(resource.message);
      return;
    }

    const context = parseJsonObjectText(contextText, '上下文属性', { allowEmpty: true });
    if (!context.ok) {
      setSimulateError(context.message);
      return;
    }

    simulateMutation.mutate({
      action: simulateAction,
      subject: subject.value ?? {},
      resource: resource.value ?? {},
      context: context.value,
    });
  }

  const metrics = [
    {
      label: '安全评分',
      value: `${securityOverview?.posture.score ?? 100}`,
      helper: securityOverview ? securityRiskLevelLabel(securityOverview.posture.level) : '正在计算',
    },
    {
      label: '待审批',
      value: `${securityOverview?.metrics.pending_approvals ?? 0}`,
      helper: `${securityOverview?.metrics.runtime_pending_approvals ?? 0} 个运行时请求`,
    },
    {
      label: '拒绝规则',
      value: `${(securityOverview?.metrics.deny_policies ?? overview?.deny ?? 0) + (securityOverview?.metrics.resource_acl_deny ?? 0)}`,
      helper: '策略与资源授权',
    },
    {
      label: '安全事件',
      value: `${securityOverview?.metrics.security_events_24h ?? 0}`,
      helper: `${securityOverview?.metrics.failed_monitor_events_24h ?? 0} 个运行异常`,
    },
    {
      label: '策略拒绝',
      value: `${securityOverview?.metrics.security_policy_denials_24h ?? 0}`,
      helper: '最近 24 小时',
    },
    {
      label: '列表过滤',
      value: `${securityOverview?.metrics.list_data_scope_filters ?? 0}`,
      helper: 'DataScope 生效范围',
    },
    {
      label: 'ACL 条件',
      value: `${securityOverview?.metrics.resource_acl_condition_checks ?? 0}`,
      helper: '条件化授权规则',
    },
  ];

  return (
    <main className="relative mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:px-6">
      <SecurityPolicyBackground />

      <motion.section
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col justify-between gap-4 md:flex-row md:items-start"
        initial={{ opacity: 0, y: 10 }}
        transition={{ duration: 0.32, ease: 'easeOut' }}
      >
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <StatusBadge tone="ready">M38</StatusBadge>
            <StatusBadge tone="healthy">M40 权限闭环</StatusBadge>
            <StatusBadge tone="healthy">ABAC</StatusBadge>
            <StatusBadge tone="ready">RBAC + DataScope + ACL</StatusBadge>
          </div>
          <h1 className="text-2xl font-semibold">安全中心</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            统一查看安全态势、列表数据范围、资源授权条件、安全策略拒绝、高危审批、审计日志和运行监控。
          </p>
        </div>
        <Button className="w-full md:w-auto" disabled={!canWrite} onClick={openCreateForm}>
          <Plus className="size-4" />
          新建策略
        </Button>
      </motion.section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <MetricCard helper={metric.helper} key={metric.label} label={metric.label} value={metric.value} />
        ))}
      </section>

      <SecurityCenterOverviewPanel
        loading={securityCenterQuery.isLoading}
        overview={securityOverview}
        onOpenEventDetail={setSelectedEventId}
        policyTotal={overview?.total ?? policiesQuery.data?.total ?? 0}
      />

      <ApprovalArchiveOperationsCard
        actionResults={operationAlertActionResults}
        loading={securityCenterQuery.isLoading}
        notificationResults={operationAlertNotificationResults}
        notificationTaskRecoveryActionResults={operationAlertNotificationTaskRecoveryActionResults}
        notificationTaskRecoveryPendingAction={updateNotificationTaskRecoverySuggestionMutation.variables?.action ?? null}
        notificationTaskRecoveryPendingSuggestionId={
          updateNotificationTaskRecoverySuggestionMutation.variables?.suggestionId ?? null
        }
        notificationTaskRecoveryUpdating={updateNotificationTaskRecoverySuggestionMutation.isPending}
        onAction={(alertId, action) => updateOperationAlertMutation.mutate({ action, alertId })}
        onNotificationTaskRecoveryAction={(suggestionId, action) =>
          updateNotificationTaskRecoverySuggestionMutation.mutate({ action, suggestionId })
        }
        notifyingAlertId={notifyOperationAlertMutation.variables ?? null}
        notifying={notifyOperationAlertMutation.isPending}
        onNotify={(alertId) => notifyOperationAlertMutation.mutate(alertId)}
        overview={securityOverview}
        pendingAction={updateOperationAlertMutation.variables?.action ?? null}
        pendingActionAlertId={updateOperationAlertMutation.variables?.alertId ?? null}
        notificationAudit={operationAlertNotificationsQuery.data ?? null}
        notificationAuditLoading={operationAlertNotificationsQuery.isLoading}
        notificationArchiveError={operationNotificationArchiveError}
        notificationArchiveLoading={operationAlertNotificationArchivesQuery.isLoading}
        notificationArchiveMessage={operationNotificationArchiveMessage}
        notificationArchiveApprovalNote={operationNotificationArchiveApprovalNote}
        notificationArchiveApprovalOverview={operationAlertNotificationArchiveApprovalOverviewQuery.data ?? null}
        notificationArchiveApprovals={operationAlertNotificationArchiveApprovalsQuery.data ?? []}
        notificationArchiveApprovalsLoading={
          operationAlertNotificationArchiveApprovalOverviewQuery.isLoading ||
          operationAlertNotificationArchiveApprovalsQuery.isLoading
        }
        notificationArchives={operationAlertNotificationArchivesQuery.data?.items ?? []}
        notificationArchiveSummary={operationAlertNotificationArchivesQuery.data?.summary ?? null}
        notificationCategory={operationNotificationCategory}
        notificationExportState={operationNotificationExportState}
        notificationKeyword={operationNotificationKeyword}
        notificationStatus={operationNotificationStatus}
        onNotificationArchiveCreate={() => createOperationAlertNotificationArchiveMutation.mutate()}
        onNotificationArchiveApprove={(approvalId) => approveOperationAlertNotificationArchiveApprovalMutation.mutate(approvalId)}
        onNotificationArchiveDelete={(archive) => deleteOperationAlertNotificationArchiveMutation.mutate(archive)}
        onNotificationArchiveDownload={(archive) => downloadOperationAlertNotificationArchiveMutation.mutate(archive)}
        onNotificationArchiveNoteChange={setOperationNotificationArchiveApprovalNote}
        onNotificationArchiveReject={(approvalId) => rejectOperationAlertNotificationArchiveApprovalMutation.mutate(approvalId)}
        onNotificationArchiveRefresh={() => void operationAlertNotificationArchivesQuery.refetch()}
        onNotificationArchiveApprovalRefresh={() => {
          void operationAlertNotificationArchiveApprovalOverviewQuery.refetch();
          void operationAlertNotificationArchiveApprovalsQuery.refetch();
        }}
        onNotificationCategoryChange={setOperationNotificationCategory}
        onNotificationExport={() => void handleExportOperationAlertNotifications()}
        onNotificationKeywordChange={setOperationNotificationKeyword}
        onNotificationStatusChange={setOperationNotificationStatus}
        onRetryNotification={(notificationEventId) => retryOperationNotificationMutation.mutate(notificationEventId)}
        operationNotificationArchiving={createOperationAlertNotificationArchiveMutation.isPending}
        operationNotificationArchiveApproving={approveOperationAlertNotificationArchiveApprovalMutation.isPending}
        operationNotificationArchiveDeleting={deleteOperationAlertNotificationArchiveMutation.isPending}
        operationNotificationArchiveRejecting={rejectOperationAlertNotificationArchiveApprovalMutation.isPending}
        operationNotificationDownloading={downloadOperationAlertNotificationArchiveMutation.isPending}
        retryingNotificationEventId={retryOperationNotificationMutation.variables ?? null}
        retryingNotification={retryOperationNotificationMutation.isPending}
        updatingAction={updateOperationAlertMutation.isPending}
        taskLoading={operationAlertNotificationTaskQuery.isLoading}
        taskOverview={operationAlertNotificationTaskQuery.data ?? null}
        taskAutoNotifyRunning={runOperationNotificationAutoNotifyMutation.isPending}
        taskAutoRetryRunning={runOperationNotificationAutoRetryMutation.isPending}
        onRefreshTask={() => void operationAlertNotificationTaskQuery.refetch()}
        onRunAutoNotify={() => runOperationNotificationAutoNotifyMutation.mutate()}
        onRunAutoRetry={() => runOperationNotificationAutoRetryMutation.mutate()}
        taskRunHistory={operationAlertNotificationTaskRunsQuery.data ?? null}
        taskRunHistoryLoading={operationAlertNotificationTaskRunsQuery.isLoading}
        taskRunHistoryKeyword={operationNotificationTaskRunKeyword}
        taskRunHistoryStatus={operationNotificationTaskRunStatus}
        taskRunHistoryTask={operationNotificationTaskRunTask}
        taskRecoveryAudit={operationAlertNotificationTaskRecoveryAuditsQuery.data ?? null}
        taskRecoveryAuditAction={operationNotificationTaskRecoveryAuditAction}
        taskRecoveryAuditArchiveError={operationNotificationTaskRecoveryAuditArchiveError}
        taskRecoveryAuditArchiveLoading={operationAlertNotificationTaskRecoveryAuditArchivesQuery.isLoading}
        taskRecoveryAuditArchiveMessage={operationNotificationTaskRecoveryAuditArchiveMessage}
        taskRecoveryAuditArchives={operationAlertNotificationTaskRecoveryAuditArchivesQuery.data?.items ?? []}
        taskRecoveryAuditArchiveSummary={operationAlertNotificationTaskRecoveryAuditArchivesQuery.data?.summary ?? null}
        taskRecoveryAuditCreatingArchive={createNotificationTaskRecoveryAuditArchiveMutation.isPending}
        taskRecoveryAuditDeletingArchive={deleteNotificationTaskRecoveryAuditArchiveMutation.isPending}
        taskRecoveryAuditDownloadingArchive={downloadNotificationTaskRecoveryAuditArchiveMutation.isPending}
        taskRecoveryAuditArchiveApproving={approveNotificationTaskRecoveryAuditArchiveApprovalMutation.isPending}
        taskRecoveryAuditArchiveRejecting={rejectNotificationTaskRecoveryAuditArchiveApprovalMutation.isPending}
        taskRecoveryAuditArchiveApprovalNote={operationNotificationTaskRecoveryAuditArchiveApprovalNote}
        taskRecoveryAuditArchiveApprovalOverview={operationAlertNotificationTaskRecoveryAuditArchiveApprovalOverviewQuery.data ?? null}
        taskRecoveryAuditArchiveApprovals={operationAlertNotificationTaskRecoveryAuditArchiveApprovalsQuery.data ?? []}
        taskRecoveryAuditArchiveApprovalsLoading={
          operationAlertNotificationTaskRecoveryAuditArchiveApprovalOverviewQuery.isLoading ||
          operationAlertNotificationTaskRecoveryAuditArchiveApprovalsQuery.isLoading
        }
        taskRecoveryAuditExportState={operationNotificationTaskRecoveryAuditExportState}
        taskRecoveryAuditKeyword={operationNotificationTaskRecoveryAuditKeyword}
        taskRecoveryAuditLoading={operationAlertNotificationTaskRecoveryAuditsQuery.isLoading}
        taskRecoveryAuditFailureSource={operationNotificationTaskRecoveryAuditFailureSource}
        taskRecoveryAuditReason={operationNotificationTaskRecoveryAuditReason}
        taskRecoveryAuditStatus={operationNotificationTaskRecoveryAuditStatus}
        onTaskRecoveryAuditActionChange={setOperationNotificationTaskRecoveryAuditAction}
        onTaskRecoveryAuditArchiveApprove={(approvalId) => approveNotificationTaskRecoveryAuditArchiveApprovalMutation.mutate(approvalId)}
        onTaskRecoveryAuditArchiveCreate={() => createNotificationTaskRecoveryAuditArchiveMutation.mutate()}
        onTaskRecoveryAuditArchiveDelete={(archive) => deleteNotificationTaskRecoveryAuditArchiveMutation.mutate(archive)}
        onTaskRecoveryAuditArchiveDownload={(archive) => downloadNotificationTaskRecoveryAuditArchiveMutation.mutate(archive)}
        onTaskRecoveryAuditArchiveNoteChange={setOperationNotificationTaskRecoveryAuditArchiveApprovalNote}
        onTaskRecoveryAuditArchiveReject={(approvalId) => rejectNotificationTaskRecoveryAuditArchiveApprovalMutation.mutate(approvalId)}
        onTaskRecoveryAuditArchiveRefresh={() => void operationAlertNotificationTaskRecoveryAuditArchivesQuery.refetch()}
        onTaskRecoveryAuditArchiveApprovalRefresh={() => {
          void operationAlertNotificationTaskRecoveryAuditArchiveApprovalOverviewQuery.refetch();
          void operationAlertNotificationTaskRecoveryAuditArchiveApprovalsQuery.refetch();
        }}
        onTaskRecoveryAuditExport={() => void handleExportNotificationTaskRecoveryAudits()}
        onTaskRecoveryAuditFailureSourceChange={setOperationNotificationTaskRecoveryAuditFailureSource}
        onTaskRecoveryAuditKeywordChange={setOperationNotificationTaskRecoveryAuditKeyword}
        onTaskRecoveryAuditReasonChange={setOperationNotificationTaskRecoveryAuditReason}
        onTaskRecoveryAuditStatusChange={setOperationNotificationTaskRecoveryAuditStatus}
        onRefreshTaskRecoveryAudit={() => void operationAlertNotificationTaskRecoveryAuditsQuery.refetch()}
        onRefreshTaskRunHistory={() => void operationAlertNotificationTaskRunsQuery.refetch()}
        onTaskRunHistoryKeywordChange={setOperationNotificationTaskRunKeyword}
        onTaskRunHistoryStatusChange={setOperationNotificationTaskRunStatus}
        onTaskRunHistoryTaskChange={setOperationNotificationTaskRunTask}
        slaLoading={operationAlertSlaQuery.isLoading}
        slaOverview={operationAlertSlaQuery.data ?? null}
        slaRunning={runOperationAlertSlaEscalationMutation.isPending}
        onRefreshSla={() => void operationAlertSlaQuery.refetch()}
        onRunSlaEscalation={() => runOperationAlertSlaEscalationMutation.mutate()}
        slaNotificationLoading={operationAlertSlaNotificationQuery.isLoading}
        slaNotificationOverview={operationAlertSlaNotificationQuery.data ?? null}
        slaNotificationRunning={notifyOperationAlertSlaOverdueMutation.isPending}
        onRefreshSlaNotification={() => void operationAlertSlaNotificationQuery.refetch()}
        onNotifySlaOverdue={() => notifyOperationAlertSlaOverdueMutation.mutate()}
        slaNotificationRetryLoading={operationAlertSlaNotificationRetryQuery.isLoading}
        slaNotificationRetryOverview={operationAlertSlaNotificationRetryQuery.data ?? null}
        slaNotificationRetryRunning={runOperationAlertSlaNotificationAutoRetryMutation.isPending}
        onRefreshSlaNotificationRetry={() => void operationAlertSlaNotificationRetryQuery.refetch()}
        onRunSlaNotificationAutoRetry={() => runOperationAlertSlaNotificationAutoRetryMutation.mutate()}
        onRetrySlaNotification={(notificationEventId) => retryOperationAlertSlaNotificationMutation.mutate(notificationEventId)}
        retryingSlaNotification={retryOperationAlertSlaNotificationMutation.isPending}
        retryingSlaNotificationEventId={retryOperationAlertSlaNotificationMutation.variables ?? null}
        slaDeadLetterLoading={operationAlertSlaDeadLetterQuery.isLoading}
        slaDeadLetterNote={slaDeadLetterNote}
        slaDeadLetterOverview={operationAlertSlaDeadLetterQuery.data ?? null}
        slaDeadLetterPendingAction={handleOperationAlertSlaDeadLetterMutation.variables?.action ?? null}
        slaDeadLetterPendingEventId={handleOperationAlertSlaDeadLetterMutation.variables?.notificationEventId ?? null}
        slaDeadLetterRunning={handleOperationAlertSlaDeadLetterMutation.isPending}
        onSlaDeadLetterNoteChange={setSlaDeadLetterNote}
        onRefreshSlaDeadLetter={() => void operationAlertSlaDeadLetterQuery.refetch()}
        onHandleSlaDeadLetter={(notificationEventId, action) =>
          handleOperationAlertSlaDeadLetterMutation.mutate({
            action,
            notificationEventId,
            note: slaDeadLetterNote.trim() || null,
          })}
        slaDeadLetterAuditAction={slaDeadLetterAuditAction}
        slaDeadLetterAuditKeyword={slaDeadLetterAuditKeyword}
        slaDeadLetterAuditLoading={operationAlertSlaDeadLetterAuditQuery.isLoading}
        slaDeadLetterAuditPage={slaDeadLetterAuditPage}
        slaDeadLetterAuditPageCount={slaDeadLetterAuditPageCount}
        slaDeadLetterAuditResult={operationAlertSlaDeadLetterAuditQuery.data ?? null}
        slaDeadLetterAuditStatus={slaDeadLetterAuditStatus}
        slaDeadLetterAuditExportState={slaDeadLetterAuditExportState}
        slaDeadLetterAuditArchives={operationAlertSlaDeadLetterAuditArchivesQuery.data?.items ?? []}
        slaDeadLetterAuditArchiveError={slaDeadLetterAuditArchiveError}
        slaDeadLetterAuditArchiveLoading={operationAlertSlaDeadLetterAuditArchivesQuery.isLoading}
        slaDeadLetterAuditArchiveMessage={slaDeadLetterAuditArchiveMessage}
        slaDeadLetterAuditArchiveSummary={operationAlertSlaDeadLetterAuditArchivesQuery.data?.summary ?? null}
        slaDeadLetterAuditCreatingArchive={createSlaDeadLetterAuditArchiveMutation.isPending}
        slaDeadLetterAuditDownloadingArchive={downloadSlaDeadLetterAuditArchiveMutation.isPending}
        slaDeadLetterAuditDeletingArchive={deleteSlaDeadLetterAuditArchiveMutation.isPending}
        slaDeadLetterAuditArchiveApproving={approveSlaDeadLetterAuditArchiveApprovalMutation.isPending}
        slaDeadLetterAuditArchiveRejecting={rejectSlaDeadLetterAuditArchiveApprovalMutation.isPending}
        slaDeadLetterAuditArchiveApprovalNote={slaDeadLetterAuditArchiveApprovalNote}
        slaDeadLetterAuditArchiveApprovalOverview={operationAlertSlaDeadLetterAuditArchiveApprovalOverviewQuery.data ?? null}
        slaDeadLetterAuditArchiveApprovals={operationAlertSlaDeadLetterAuditArchiveApprovalsQuery.data ?? []}
        slaDeadLetterAuditArchiveApprovalsLoading={
          operationAlertSlaDeadLetterAuditArchiveApprovalOverviewQuery.isLoading ||
          operationAlertSlaDeadLetterAuditArchiveApprovalsQuery.isLoading
        }
        onSlaDeadLetterAuditActionChange={(value) => {
          setSlaDeadLetterAuditAction(value);
          setSlaDeadLetterAuditPage(1);
        }}
        onSlaDeadLetterAuditArchiveApprove={(approvalId) => approveSlaDeadLetterAuditArchiveApprovalMutation.mutate(approvalId)}
        onSlaDeadLetterAuditArchiveCreate={() => createSlaDeadLetterAuditArchiveMutation.mutate()}
        onSlaDeadLetterAuditArchiveDelete={(archive) => deleteSlaDeadLetterAuditArchiveMutation.mutate(archive)}
        onSlaDeadLetterAuditArchiveDownload={(archive) => downloadSlaDeadLetterAuditArchiveMutation.mutate(archive)}
        onSlaDeadLetterAuditArchiveNoteChange={setSlaDeadLetterAuditArchiveApprovalNote}
        onSlaDeadLetterAuditArchiveReject={(approvalId) => rejectSlaDeadLetterAuditArchiveApprovalMutation.mutate(approvalId)}
        onSlaDeadLetterAuditArchiveRefresh={() => void operationAlertSlaDeadLetterAuditArchivesQuery.refetch()}
        onSlaDeadLetterAuditArchiveApprovalRefresh={() => {
          void operationAlertSlaDeadLetterAuditArchiveApprovalOverviewQuery.refetch();
          void operationAlertSlaDeadLetterAuditArchiveApprovalsQuery.refetch();
        }}
        onSlaDeadLetterAuditExport={() => void handleExportSlaDeadLetterAudits()}
        onSlaDeadLetterAuditKeywordChange={(value) => {
          setSlaDeadLetterAuditKeyword(value);
          setSlaDeadLetterAuditPage(1);
        }}
        onSlaDeadLetterAuditStatusChange={(value) => {
          setSlaDeadLetterAuditStatus(value);
          setSlaDeadLetterAuditPage(1);
        }}
        onSlaDeadLetterAuditPageChange={setSlaDeadLetterAuditPage}
        onRefreshSlaDeadLetterAudit={() => void operationAlertSlaDeadLetterAuditQuery.refetch()}
      />

      <SecurityApprovalWorkbenchCard
        canHandleApprovals={canHandleApprovals}
        canViewApprovals={canViewApprovals}
        detail={selectedApprovalWorkbenchQuery.data ?? null}
        detailLoading={selectedApprovalWorkbenchQuery.isLoading || selectedApprovalWorkbenchQuery.isFetching}
        error={approvalWorkbenchError}
        keyword={approvalWorkbenchKeyword}
        loading={approvalWorkbenchQuery.isLoading}
        message={approvalWorkbenchMessage}
        note={approvalWorkbenchNote}
        onKeywordChange={(value) => {
          setApprovalWorkbenchPage(1);
          setApprovalWorkbenchKeyword(value);
        }}
        onNoteChange={setApprovalWorkbenchNote}
        onPageChange={setApprovalWorkbenchPage}
        onRefresh={() => {
          void approvalWorkbenchOverviewQuery.refetch();
          void approvalWorkbenchQuery.refetch();
          if (selectedApprovalWorkbenchId) {
            void selectedApprovalWorkbenchQuery.refetch();
          }
        }}
        onResetFilters={() => {
          setApprovalWorkbenchKeyword('');
          setApprovalWorkbenchType('');
          setApprovalWorkbenchStatus('PENDING');
          setApprovalWorkbenchRiskDomain('');
          setApprovalWorkbenchPage(1);
        }}
        onReview={(approvalId, decision) => reviewApprovalWorkbenchMutation.mutate({ approvalId, decision })}
        onRiskDomainChange={(value) => {
          setApprovalWorkbenchPage(1);
          setApprovalWorkbenchRiskDomain(value);
        }}
        onSelect={setSelectedApprovalWorkbenchId}
        onStatusChange={(value) => {
          setApprovalWorkbenchPage(1);
          setApprovalWorkbenchStatus(value);
        }}
        onTypeChange={(value) => {
          setApprovalWorkbenchPage(1);
          setApprovalWorkbenchType(value);
        }}
        overview={approvalWorkbenchOverview}
        page={approvalWorkbenchPage}
        pageCount={approvalWorkbenchPageCount}
        refreshing={approvalWorkbenchOverviewQuery.isFetching || approvalWorkbenchQuery.isFetching}
        reviewing={reviewApprovalWorkbenchMutation.isPending}
        riskDomain={approvalWorkbenchRiskDomain}
        selectedId={selectedApprovalWorkbenchId}
        status={approvalWorkbenchStatus}
        total={approvalWorkbenchTotal}
        type={approvalWorkbenchType}
        workbenchItems={approvalWorkbenchItems}
      />

      {actionError ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {actionError}
        </div>
      ) : null}

      <section className="grid min-w-0 gap-4 xl:grid-cols-[1.18fr_0.82fr]">
        <Card className="min-w-0">
          <div className="border-b p-4">
            <div className="grid gap-4">
              <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
                <div>
                  <h2 className="text-sm font-semibold">策略清单</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    按优先级匹配策略，同等优先级下拒绝规则优先，用于收紧企业级访问边界。
                  </p>
                </div>
                <div className="text-sm text-muted-foreground">
                  显示 {policies.length} / {policiesQuery.data?.total ?? 0}
                </div>
              </div>

              <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-[1fr_150px_150px_150px_auto]">
                <label className="flex h-9 items-center gap-2 rounded-md border bg-background/70 px-3 text-sm">
                  <Search className="size-4 text-muted-foreground" />
                  <input
                    className="min-w-0 flex-1 bg-transparent outline-none"
                    onChange={(event) => setKeyword(event.target.value)}
                    placeholder="搜索名称、编码、动作"
                    value={keyword}
                  />
                </label>
                <select className="h-9 rounded-md border bg-background/80 px-3 text-sm" onChange={(event) => setStatus(event.target.value)} value={status}>
                  <option value="">全部状态</option>
                  {policyStatuses.map((item) => (
                    <option key={item} value={item}>
                      {securityPolicyStatusLabel(item)}
                    </option>
                  ))}
                </select>
                <select className="h-9 rounded-md border bg-background/80 px-3 text-sm" onChange={(event) => setEffect(event.target.value)} value={effect}>
                  <option value="">全部效果</option>
                  {policyEffects.map((item) => (
                    <option key={item} value={item}>
                      {securityPolicyEffectLabel(item)}
                    </option>
                  ))}
                </select>
                <Input onChange={(event) => setResourceType(event.target.value)} placeholder="资源类型" value={resourceType} />
                <Button onClick={clearFilters} type="button" variant="outline">
                  清空
                </Button>
              </div>
            </div>
          </div>

          {policiesQuery.isError ? (
            <div className="p-6 text-sm text-destructive">策略加载失败。</div>
          ) : policiesQuery.isLoading ? (
            <div className="p-6 text-sm text-muted-foreground">正在加载安全策略...</div>
          ) : policies.length === 0 ? (
            <EmptyState
              action={
                <Button disabled={!canWrite} onClick={openCreateForm}>
                  <Plus className="size-4" />
                  新建策略
                </Button>
              }
              description="创建第一条 ABAC 策略，建议先用模拟面板验证条件路径和命中结果。"
              title="暂无安全策略"
            />
          ) : (
            <PolicyTable
              canWrite={canWrite}
              onDelete={setDeleteTarget}
              onEdit={(policy) => void openEditForm(policy)}
              onToggle={(policy) =>
                statusMutation.mutate({
                  id: policy.id,
                  nextStatus: policy.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE',
                })
              }
              policies={policies}
              pending={statusMutation.isPending}
            />
          )}
        </Card>

        <SimulationPanel
          action={simulateAction}
          canWrite={canWrite}
          contextText={contextText}
          error={simulateError}
          onActionChange={setSimulateAction}
          onContextChange={setContextText}
          onResourceChange={setResourceText}
          onRun={runSimulation}
          onSubjectChange={setSubjectText}
          pending={simulateMutation.isPending}
          resourceText={resourceText}
          result={simulateResult}
          subjectText={subjectText}
        />
      </section>

      <EvaluationLogCard evaluations={evaluations} loading={evaluationsQuery.isLoading} />

      <SecurityEventCenterCard
        events={securityEvents}
        keyword={eventKeyword}
        loading={securityEventsQuery.isLoading}
        onKeywordChange={(value) => {
          setEventPage(1);
          setEventKeyword(value);
        }}
        onOpenDetail={setSelectedEventId}
        onPageChange={setEventPage}
        onSourceChange={(value) => {
          setEventPage(1);
          setEventSource(value);
        }}
        onTraceOnlyChange={(value) => {
          setEventPage(1);
          setEventTraceOnly(value);
        }}
        onWindowChange={(value) => {
          setEventPage(1);
          setEventWindow(value);
        }}
        page={eventPage}
        pageCount={securityEventsPageCount}
        source={eventSource}
        total={securityEventsTotal}
        traceOnly={eventTraceOnly}
        window={eventWindow}
      />

      {formMode ? (
        <PolicyFormDialog
          error={formError}
          isPending={createMutation.isPending || updateMutation.isPending}
          mode={formMode}
          onClose={closeForm}
          onSubmit={submitForm}
          policy={editingPolicy}
        />
      ) : null}

      {deleteTarget ? (
        <ConfirmDialog
          body={`这会软删除策略 ${deleteTarget.name}，已有评估日志会保留。`}
          pending={deleteMutation.isPending}
          title="删除安全策略？"
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
        />
      ) : null}

      {selectedEventId ? (
        <SecurityEventDetailDrawer
          event={selectedEventQuery.data ?? null}
          error={selectedEventQuery.isError}
          loading={selectedEventQuery.isLoading}
          onClose={() => setSelectedEventId(null)}
        />
      ) : null}
    </main>
  );
}

function SecurityApprovalWorkbenchCard({
  canHandleApprovals,
  canViewApprovals,
  detail,
  detailLoading,
  error,
  keyword,
  loading,
  message,
  note,
  onKeywordChange,
  onNoteChange,
  onPageChange,
  onRefresh,
  onResetFilters,
  onReview,
  onRiskDomainChange,
  onSelect,
  onStatusChange,
  onTypeChange,
  overview,
  page,
  pageCount,
  refreshing,
  reviewing,
  riskDomain,
  selectedId,
  status,
  total,
  type,
  workbenchItems,
}: {
  canHandleApprovals: boolean;
  canViewApprovals: boolean;
  detail: SecurityApprovalWorkbenchDetail | null;
  detailLoading: boolean;
  error: string | null;
  keyword: string;
  loading: boolean;
  message: string | null;
  note: string;
  onKeywordChange: (value: string) => void;
  onNoteChange: (value: string) => void;
  onPageChange: (value: number) => void;
  onRefresh: () => void;
  onResetFilters: () => void;
  onReview: (approvalId: string, decision: 'APPROVE' | 'REJECT') => void;
  onRiskDomainChange: (value: SecurityApprovalWorkbenchRiskDomain | '') => void;
  onSelect: (approvalId: string) => void;
  onStatusChange: (value: SecurityApprovalWorkbenchStatus | '') => void;
  onTypeChange: (value: SecurityApprovalWorkbenchType | '') => void;
  overview: SecurityApprovalWorkbenchOverview | null;
  page: number;
  pageCount: number;
  refreshing: boolean;
  reviewing: boolean;
  riskDomain: SecurityApprovalWorkbenchRiskDomain | '';
  selectedId: string | null;
  status: SecurityApprovalWorkbenchStatus | '';
  total: number;
  type: SecurityApprovalWorkbenchType | '';
  workbenchItems: SecurityApprovalWorkbenchItem[];
}) {
  const hasFilters = Boolean(keyword || type || riskDomain || status !== 'PENDING');
  const current = detail ?? workbenchItems.find((item) => item.id === selectedId) ?? null;

  return (
    <Card className="min-w-0 overflow-hidden border-blue-100 bg-background/95 shadow-sm">
      <div className="border-b p-5">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge tone="ready">M117</StatusBadge>
              <StatusBadge tone={(overview?.summary.pending_count ?? 0) > 0 ? 'degraded' : 'healthy'}>
                {overview?.summary.pending_count ?? 0} 个待审批
              </StatusBadge>
              <StatusBadge tone={(overview?.summary.high_risk_pending_count ?? 0) > 0 ? 'unavailable' : 'planned'}>
                {overview?.summary.high_risk_pending_count ?? 0} 个高风险
              </StatusBadge>
            </div>
            <h2 className="mt-3 text-sm font-semibold">安全细分审批工作台</h2>
            <p className="mt-1 max-w-4xl text-sm leading-6 text-muted-foreground">
              汇总工具调用、通知策略、团队运行报告、审批审计归档、SLA 死信审计归档和通知任务自愈归档删除审批，统一筛选、查看时间线和处理待办。
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button disabled={!canViewApprovals || refreshing} onClick={onRefresh} type="button" variant="outline">
              <RefreshCw className={`size-4 ${refreshing ? 'animate-spin' : ''}`} />
              刷新
            </Button>
            <Button asChild type="button" variant="outline">
              <Link href="/approvals">
                <ClipboardCheck className="size-4" />
                工具审批中心
              </Link>
            </Button>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard helper="全部审批来源" label="审批总数" value={`${overview?.summary.total_count ?? 0}`} />
          <MetricCard helper="等待安全管理员处理" label="待处理" value={`${overview?.summary.pending_count ?? 0}`} />
          <MetricCard helper="高风险工具或删除类操作" label="高风险待审" value={`${overview?.summary.high_risk_pending_count ?? 0}`} />
          <MetricCard
            helper={overview?.summary.oldest_pending_at ? `最早 ${formatDateTime(overview.summary.oldest_pending_at)}` : '无积压'}
            label="归档删除待审"
            value={`${overview?.summary.archive_delete_pending_count ?? 0}`}
          />
        </div>

        <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-[1fr_210px_150px_150px_auto]">
          <label className="flex h-9 items-center gap-2 rounded-md border bg-background/70 px-3 text-sm">
            <Search className="size-4 shrink-0 text-muted-foreground" />
            <input
              className="min-w-0 flex-1 bg-transparent outline-none"
              onChange={(event) => onKeywordChange(event.target.value)}
              placeholder="搜索审批 ID、目标、申请人、request_id、trace_id"
              value={keyword}
            />
          </label>
          <select
            className="h-9 rounded-md border bg-background/80 px-3 text-sm"
            onChange={(event) => onTypeChange(event.target.value as SecurityApprovalWorkbenchType | '')}
            value={type}
          >
            <option value="">全部类型</option>
            {approvalWorkbenchTypes.map((item) => (
              <option key={item.value} value={item.value}>{item.label}</option>
            ))}
          </select>
          <select
            className="h-9 rounded-md border bg-background/80 px-3 text-sm"
            onChange={(event) => onStatusChange(event.target.value as SecurityApprovalWorkbenchStatus | '')}
            value={status}
          >
            <option value="">全部状态</option>
            {approvalWorkbenchStatuses.map((item) => (
              <option key={item.value} value={item.value}>{item.label}</option>
            ))}
          </select>
          <select
            className="h-9 rounded-md border bg-background/80 px-3 text-sm"
            onChange={(event) => onRiskDomainChange(event.target.value as SecurityApprovalWorkbenchRiskDomain | '')}
            value={riskDomain}
          >
            <option value="">全部风险域</option>
            {approvalWorkbenchRiskDomains.map((item) => (
              <option key={item.value} value={item.value}>{item.label}</option>
            ))}
          </select>
          <Button disabled={!hasFilters} onClick={onResetFilters} type="button" variant="outline">
            清空筛选
          </Button>
        </div>
      </div>

      {!canViewApprovals ? (
        <EmptyState
          className="m-5 rounded-md border bg-muted/15 p-6"
          description="当前账号没有安全审批查看权限。需要 security:approval:view 或租户管理员角色。"
          title="无权查看安全审批工作台"
        />
      ) : null}

      {canViewApprovals && message ? (
        <div className="mx-5 mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {message}
        </div>
      ) : canViewApprovals && error ? (
        <div className="mx-5 mt-4 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      {!canViewApprovals ? null : loading ? (
        <div className="p-6 text-sm text-muted-foreground">正在加载安全审批工作台...</div>
      ) : workbenchItems.length === 0 ? (
        <EmptyState
          className="m-5 rounded-md border bg-muted/15 p-6"
          description="当前筛选条件下没有审批记录。可以切换到全部状态或清空关键词后重试。"
          title="暂无安全审批记录"
        />
      ) : (
        <div className="grid gap-0 xl:grid-cols-[0.92fr_1.08fr]">
          <div className="border-r">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    {['状态', '审批对象', '风险', '申请人', '申请时间', '操作'].map((column) => (
                      <th className="px-4 py-3 font-medium text-muted-foreground" key={column}>{column}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {workbenchItems.map((item, index) => (
                    <SecurityApprovalWorkbenchRow
                      active={item.id === selectedId}
                      item={item}
                      key={item.id}
                      onSelect={onSelect}
                      rowIndex={index}
                    />
                  ))}
                </tbody>
              </table>
            </div>
            <div className="border-t p-4">
              <PaginationBar onPageChange={onPageChange} page={page} pageCount={pageCount} total={total} />
            </div>
          </div>

          <SecurityApprovalWorkbenchDetailPanel
            canHandleApprovals={canHandleApprovals}
            detail={detail}
            fallback={current}
            loading={detailLoading}
            note={note}
            onNoteChange={onNoteChange}
            onReview={onReview}
            reviewing={reviewing}
          />
        </div>
      )}
    </Card>
  );
}

function SecurityApprovalWorkbenchRow({
  active,
  item,
  onSelect,
  rowIndex,
}: {
  active: boolean;
  item: SecurityApprovalWorkbenchItem;
  onSelect: (approvalId: string) => void;
  rowIndex: number;
}) {
  return (
    <motion.tr
      animate={{ opacity: 1, y: 0 }}
      className={`border-b transition-colors last:border-0 hover:bg-muted/25 ${active ? 'bg-blue-50/55' : ''}`}
      initial={{ opacity: 0, y: 6 }}
      transition={{ delay: rowIndex * 0.018, duration: 0.18 }}
    >
      <td className="px-4 py-3">
        <StatusBadge tone={archiveApprovalStatusTone(item.status)}>{archiveApprovalStatusLabel(item.status)}</StatusBadge>
        <div className="mt-1 font-mono text-xs text-muted-foreground">{shortId(item.id)}</div>
      </td>
      <td className="px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium">{item.target_label}</span>
          <StatusBadge tone="planned">{securityApprovalWorkbenchTypeLabel(item.type)}</StatusBadge>
        </div>
        <div className="mt-1 max-w-sm truncate text-xs text-muted-foreground">{item.title}</div>
        <div className="mt-1 max-w-sm truncate text-xs text-muted-foreground">{item.description}</div>
      </td>
      <td className="px-4 py-3">
        <StatusBadge tone={securityApprovalWorkbenchRiskTone(item.risk_level)}>
          {securityApprovalWorkbenchRiskLevelLabel(item.risk_level)}
        </StatusBadge>
        <div className="mt-1 text-xs text-muted-foreground">{securityApprovalWorkbenchRiskDomainLabel(item.risk_domain)}</div>
      </td>
      <td className="px-4 py-3 text-muted-foreground">
        {item.requester?.name ?? '系统'}
        <div className="mt-1 max-w-36 truncate text-xs">{item.requester?.email ?? '-'}</div>
      </td>
      <td className="px-4 py-3 text-muted-foreground">{formatDateTime(item.requested_at)}</td>
      <td className="px-4 py-3">
        <Button onClick={() => onSelect(item.id)} size="sm" type="button" variant="outline">
          <Eye className="size-4" />
          {active ? '当前详情' : '查看'}
        </Button>
      </td>
    </motion.tr>
  );
}

function SecurityApprovalWorkbenchDetailPanel({
  canHandleApprovals,
  detail,
  fallback,
  loading,
  note,
  onNoteChange,
  onReview,
  reviewing,
}: {
  canHandleApprovals: boolean;
  detail: SecurityApprovalWorkbenchDetail | null;
  fallback: SecurityApprovalWorkbenchItem | null;
  loading: boolean;
  note: string;
  onNoteChange: (value: string) => void;
  onReview: (approvalId: string, decision: 'APPROVE' | 'REJECT') => void;
  reviewing: boolean;
}) {
  const current = detail ?? fallback;

  if (loading && !current) {
    return <div className="p-6 text-sm text-muted-foreground">正在加载审批详情...</div>;
  }

  if (!current) {
    return (
      <EmptyState
        className="m-5 rounded-md border bg-muted/15 p-6"
        description="从左侧审批队列选择一条记录后，可以查看审批原因、请求链路和审计时间线。"
        title="请选择审批记录"
      />
    );
  }

  const pending = current.status === 'PENDING';
  const timeline = detail?.timeline ?? [];
  const metadata = detail?.metadata ?? {};

  return (
    <div className="grid content-start gap-5 p-5">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge tone={archiveApprovalStatusTone(current.status)}>{archiveApprovalStatusLabel(current.status)}</StatusBadge>
          <StatusBadge tone={securityApprovalWorkbenchRiskTone(current.risk_level)}>
            {securityApprovalWorkbenchRiskLevelLabel(current.risk_level)}
          </StatusBadge>
          <StatusBadge tone="planned">{securityApprovalWorkbenchRiskDomainLabel(current.risk_domain)}</StatusBadge>
        </div>
        <h3 className="mt-3 text-base font-semibold">{current.title}</h3>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{current.description}</p>
      </div>

      <div className="grid gap-3 rounded-md border bg-muted/10 p-4 text-sm md:grid-cols-2">
        <SummaryTile label="来源模块" value={current.source_module} />
        <SummaryTile label="审批类型" value={securityApprovalWorkbenchTypeLabel(current.type)} />
        <SummaryTile label="审批对象" value={current.target_label} />
        <SummaryTile label="申请人" value={current.requester?.name ?? '系统'} />
        <SummaryTile label="申请时间" value={formatDateTime(current.requested_at)} />
        <SummaryTile label="审批时间" value={formatDateTime(current.reviewed_at)} />
      </div>

      <div className="rounded-md border bg-background/75 p-4">
        <h4 className="text-sm font-semibold">审批原因与链路</h4>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{current.reason ?? '未填写审批原因。'}</p>
        <div className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
          <span className="truncate">审批 ID：{current.id}</span>
          <span className="truncate">来源 ID：{current.source_id}</span>
          <span className="truncate">request_id：{current.request_id ?? '-'}</span>
          <span className="truncate">trace_id：{current.trace_id ?? '-'}</span>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {current.request_id ? (
            <Button asChild size="sm" type="button" variant="outline">
              <Link href={`/audit?keyword=${encodeURIComponent(current.request_id)}`}>审计中心</Link>
            </Button>
          ) : null}
          {current.trace_id ? (
            <Button asChild size="sm" type="button" variant="outline">
              <Link href={`/monitor?keyword=${encodeURIComponent(current.trace_id)}`}>查看 Trace</Link>
            </Button>
          ) : null}
        </div>
      </div>

      {Object.keys(metadata).length > 0 ? (
        <div className="rounded-md border bg-background/75 p-4">
          <h4 className="text-sm font-semibold">来源扩展信息</h4>
          <div className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
            {Object.entries(metadata).slice(0, 12).map(([key, value]) => (
              <div className="min-w-0 rounded-md border bg-muted/10 px-3 py-2" key={key}>
                <div className="font-medium text-foreground">{securityApprovalMetadataLabel(key)}</div>
                <div className="mt-1 truncate">{formatSecurityApprovalMetadataValue(value)}</div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="rounded-md border bg-background/75 p-4">
        <h4 className="text-sm font-semibold">审批时间线</h4>
        {timeline.length === 0 ? (
          <div className="mt-3 text-sm text-muted-foreground">详情加载后会展示申请、审批和生效事件。</div>
        ) : (
          <div className="mt-4 grid gap-3">
            {timeline.map((item) => (
              <SecurityApprovalTimelineItem item={item} key={item.id} />
            ))}
          </div>
        )}
      </div>

      <div className="rounded-md border bg-muted/10 p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h4 className="text-sm font-semibold">审批处理</h4>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              {canHandleApprovals ? '通过或拒绝会回写到原审批来源，并保留审计事件。' : '当前账号没有处理审批权限，只能查看审批详情。'}
            </p>
          </div>
          <StatusBadge tone={pending ? 'degraded' : 'planned'}>{pending ? '可处理' : '已结束'}</StatusBadge>
        </div>
        <textarea
          className="mt-3 min-h-20 w-full resize-y rounded-md border bg-background px-3 py-2 text-sm outline-none transition focus:border-ring"
          disabled={!canHandleApprovals || !pending || reviewing}
          onChange={(event) => onNoteChange(event.target.value)}
          placeholder="填写审批意见，拒绝高风险操作时建议说明原因。"
          value={note}
        />
        <div className="mt-3 flex flex-wrap justify-end gap-2">
          <Button
            disabled={!canHandleApprovals || !pending || reviewing}
            onClick={() => onReview(current.id, 'REJECT')}
            type="button"
            variant="outline"
          >
            {reviewing ? '处理中' : '拒绝'}
          </Button>
          <Button
            disabled={!canHandleApprovals || !pending || reviewing}
            onClick={() => onReview(current.id, 'APPROVE')}
            type="button"
          >
            {reviewing ? '处理中' : '通过'}
          </Button>
        </div>
      </div>
    </div>
  );
}

function SecurityApprovalTimelineItem({ item }: { item: SecurityApprovalWorkbenchTimelineItem }) {
  return (
    <div className="rounded-md border bg-muted/10 p-3">
      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge tone={archiveApprovalEventTone(item.type)}>{archiveApprovalEventLabel(item.type)}</StatusBadge>
            <StatusBadge tone={archiveApprovalEventStatusTone(item.status)}>{item.status}</StatusBadge>
          </div>
          <div className="mt-2 text-sm font-medium">{item.title}</div>
          <div className="mt-1 text-xs text-muted-foreground">{item.actor?.name ?? '系统'} · {formatDateTime(item.occurred_at)}</div>
        </div>
        <div className="text-xs text-muted-foreground">{item.request_id ? shortId(item.request_id) : '无 request_id'}</div>
      </div>
      {item.note ? <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.note}</p> : null}
      {item.trace_id ? <div className="mt-2 truncate text-xs text-muted-foreground">Trace：{item.trace_id}</div> : null}
    </div>
  );
}

function PolicyTable({
  canWrite,
  onDelete,
  onEdit,
  onToggle,
  pending,
  policies,
}: {
  canWrite: boolean;
  onDelete: (policy: SecurityPolicyListItem) => void;
  onEdit: (policy: SecurityPolicyListItem) => void;
  onToggle: (policy: SecurityPolicyListItem) => void;
  pending: boolean;
  policies: SecurityPolicyListItem[];
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1080px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b bg-muted/40">
            {['策略', '效果', '资源', '动作', '优先级', '状态', '条件', '评估', '更新时间', '操作'].map((column) => (
              <th className="px-4 py-3 font-medium text-muted-foreground" key={column}>
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {policies.map((policy, index) => (
            <motion.tr
              animate={{ opacity: 1, y: 0 }}
              className="border-b transition-colors last:border-0 hover:bg-muted/25"
              initial={{ opacity: 0, y: 8 }}
              key={policy.id}
              transition={{ delay: index * 0.025, duration: 0.22 }}
            >
              <td className="px-4 py-3">
                <div className="grid max-w-sm gap-1">
                  <span className="font-medium">{policy.name}</span>
                  <span className="text-xs text-muted-foreground">{policy.code}</span>
                  <span className="line-clamp-1 text-xs text-muted-foreground">
                    {policy.description ?? '暂无描述'}
                  </span>
                </div>
              </td>
              <td className="px-4 py-3">
                <StatusBadge tone={securityPolicyEffectTone(policy.effect)}>
                  {securityPolicyEffectLabel(policy.effect)}
                </StatusBadge>
              </td>
              <td className="px-4 py-3 text-muted-foreground">{policy.resource_type}</td>
              <td className="px-4 py-3 text-muted-foreground">{policy.action}</td>
              <td className="px-4 py-3 text-muted-foreground">{policy.priority}</td>
              <td className="px-4 py-3">
                <StatusBadge tone={securityPolicyStatusTone(policy.status)}>
                  {securityPolicyStatusLabel(policy.status)}
                </StatusBadge>
              </td>
              <td className="px-4 py-3 text-muted-foreground">{policy.condition_count}</td>
              <td className="px-4 py-3 text-muted-foreground">
                {policy.evaluation_count}
                <div className="text-xs">{formatDateTime(policy.last_evaluated_at)}</div>
              </td>
              <td className="px-4 py-3 text-muted-foreground">{formatDateTime(policy.updated_at)}</td>
              <td className="px-4 py-3">
                <div className="flex gap-2">
                  <Button disabled={!canWrite} onClick={() => onEdit(policy)} size="sm" title="编辑" variant="outline">
                    <Edit className="size-4" />
                  </Button>
                  <Button disabled={!canWrite || pending} onClick={() => onToggle(policy)} size="sm" title={policy.status === 'ACTIVE' ? '停用' : '启用'} variant="outline">
                    <Power className="size-4" />
                  </Button>
                  <Button disabled={!canWrite} onClick={() => onDelete(policy)} size="sm" title="删除" variant="outline">
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SimulationPanel({
  action,
  canWrite,
  contextText,
  error,
  onActionChange,
  onContextChange,
  onResourceChange,
  onRun,
  onSubjectChange,
  pending,
  resourceText,
  result,
  subjectText,
}: {
  action: string;
  canWrite: boolean;
  contextText: string;
  error: string | null;
  onActionChange: (value: string) => void;
  onContextChange: (value: string) => void;
  onResourceChange: (value: string) => void;
  onRun: () => void;
  onSubjectChange: (value: string) => void;
  pending: boolean;
  resourceText: string;
  result: SimulateSecurityPolicyResult | null;
  subjectText: string;
}) {
  return (
    <Card className="grid min-w-0 gap-5 p-5">
      <div>
        <div className="flex items-center gap-2 text-sm font-semibold">
          <ShieldCheck className="size-4" />
          策略模拟
        </div>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          输入主体、资源和上下文属性，验证当前生效策略的命中结果。
        </p>
      </div>

      <div className="grid gap-3">
        <label className="grid gap-1 text-sm">
          <span className="font-medium">动作</span>
          <Input onChange={(event) => onActionChange(event.target.value)} value={action} />
        </label>
        <JsonTextArea label="主体属性" onChange={onSubjectChange} value={subjectText} />
        <JsonTextArea label="资源属性" onChange={onResourceChange} value={resourceText} />
        <JsonTextArea label="上下文属性" onChange={onContextChange} value={contextText} />
      </div>

      {error ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <Button disabled={!canWrite || pending} onClick={onRun} type="button">
        <Play className="size-4" />
        运行模拟
      </Button>

      {result ? (
        <div className="rounded-md border bg-muted/25 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold">模拟结果</h3>
            <StatusBadge tone={securityPolicyDecisionTone(result.decision)}>
              {securityPolicyDecisionLabel(result.decision)}
            </StatusBadge>
          </div>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">{result.reason}</p>
          <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
            <SummaryTile label="检查策略" value={`${result.checked_count}`} />
            <SummaryTile label="命中策略" value={result.matched_policy?.name ?? '无'} />
          </div>
          <div className="mt-3 text-xs text-muted-foreground">
            请求 {result.evaluation.request_id} · {formatDateTime(result.evaluation.created_at)}
          </div>
        </div>
      ) : null}
    </Card>
  );
}

function EvaluationLogCard({
  evaluations,
  loading,
}: {
  evaluations: SecurityPolicyEvaluationItem[];
  loading: boolean;
}) {
  return (
    <Card className="min-w-0 overflow-hidden">
      <div className="border-b p-4">
        <h2 className="text-sm font-semibold">评估日志</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          记录模拟器和后续运行时策略检查结果，保留请求 ID 与 trace ID 便于审计追踪。
        </p>
      </div>
      {loading ? (
        <div className="p-6 text-sm text-muted-foreground">正在加载评估日志...</div>
      ) : evaluations.length === 0 ? (
        <EmptyState description="运行一次策略模拟后，会在这里生成第一条评估日志。" title="暂无评估日志" />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                {['时间', '决策', '动作', '命中策略', '原因', '请求 ID', 'Trace ID'].map((column) => (
                  <th className="px-4 py-3 font-medium text-muted-foreground" key={column}>
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {evaluations.map((item) => (
                <tr className="border-b last:border-0" key={item.id}>
                  <td className="px-4 py-3 text-muted-foreground">{formatDateTime(item.created_at)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge tone={securityPolicyDecisionTone(item.decision)}>
                      {securityPolicyDecisionLabel(item.decision)}
                    </StatusBadge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{item.action}</td>
                  <td className="px-4 py-3">
                    <div className="max-w-48 truncate">{item.matched_policy_name ?? '未命中'}</div>
                    <div className="text-xs text-muted-foreground">{item.matched_policy_code ?? '-'}</div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    <div className="max-w-md truncate">{item.reason}</div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{item.request_id}</td>
                  <td className="px-4 py-3 text-muted-foreground">{item.trace_id ?? '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

function SecurityEventCenterCard({
  events,
  keyword,
  loading,
  onKeywordChange,
  onOpenDetail,
  onPageChange,
  onSourceChange,
  onTraceOnlyChange,
  onWindowChange,
  page,
  pageCount,
  source,
  total,
  traceOnly,
  window,
}: {
  events: SecurityCenterEventListItem[];
  keyword: string;
  loading: boolean;
  onKeywordChange: (value: string) => void;
  onOpenDetail: (eventId: string) => void;
  onPageChange: (value: number) => void;
  onSourceChange: (value: string) => void;
  onTraceOnlyChange: (value: boolean) => void;
  onWindowChange: (value: SecurityCenterEventWindow) => void;
  page: number;
  pageCount: number;
  source: string;
  total: number;
  traceOnly: boolean;
  window: SecurityCenterEventWindow;
}) {
  return (
    <Card className="min-w-0 overflow-hidden">
      <div className="border-b p-4">
        <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge tone="ready">M54</StatusBadge>
              <StatusBadge tone="degraded">安全事件</StatusBadge>
            </div>
            <h2 className="mt-2 text-sm font-semibold">安全事件详情中心</h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              汇总 DataScope、Resource ACL、SecurityPolicyGuard 和操作拒绝事件，支持筛选、审计和 trace 跳转。
            </p>
          </div>
          <div className="text-sm text-muted-foreground">
            显示 {events.length} / {total}
          </div>
        </div>

        <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-[1fr_150px_150px_150px]">
          <label className="flex h-9 items-center gap-2 rounded-md border bg-background/70 px-3 text-sm">
            <Search className="size-4 text-muted-foreground" />
            <input
              className="min-w-0 flex-1 bg-transparent outline-none"
              onChange={(event) => {
                onPageChange(1);
                onKeywordChange(event.target.value);
              }}
              placeholder="搜索原因、资源、请求 ID、Trace ID"
              value={keyword}
            />
          </label>
          <select
            className="h-9 rounded-md border bg-background/80 px-3 text-sm"
            onChange={(event) => {
              onPageChange(1);
              onSourceChange(event.target.value);
            }}
            value={source}
          >
            <option value="">全部来源</option>
            {eventSources.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
          <select
            className="h-9 rounded-md border bg-background/80 px-3 text-sm"
            onChange={(event) => {
              onPageChange(1);
              onWindowChange(event.target.value as SecurityCenterEventWindow);
            }}
            value={window}
          >
            {eventWindows.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
          <label className="flex h-9 items-center gap-2 rounded-md border bg-background/70 px-3 text-sm">
            <input
              checked={traceOnly}
              className="size-4"
              onChange={(event) => {
                onPageChange(1);
                onTraceOnlyChange(event.target.checked);
              }}
              type="checkbox"
            />
            只看可追踪
          </label>
        </div>
      </div>

      {loading ? (
        <div className="p-6 text-sm text-muted-foreground">正在加载安全事件...</div>
      ) : events.length === 0 ? (
        <EmptyState
          description="当前筛选条件下没有安全拒绝事件。可以放宽时间窗口或清空关键词后重试。"
          title="暂无安全事件"
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1180px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                {['时间', '来源', '风险', '原因', '资源', '动作', '请求', 'Trace', '操作'].map((column) => (
                  <th className="px-4 py-3 font-medium text-muted-foreground" key={column}>
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {events.map((event, index) => (
                <motion.tr
                  animate={{ opacity: 1, y: 0 }}
                  className="border-b transition-colors last:border-0 hover:bg-muted/25"
                  initial={{ opacity: 0, y: 8 }}
                  key={event.id}
                  transition={{ delay: index * 0.018, duration: 0.2 }}
                >
                  <td className="px-4 py-3 text-muted-foreground">{formatDateTime(event.occurred_at)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge tone="degraded">{securityDenialSourceLabel(event.source)}</StatusBadge>
                    <div className="mt-1 text-xs text-muted-foreground">{event.status_code}</div>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge tone={securityRiskTone(event.severity)}>
                      {securityRiskLevelLabel(event.severity)}
                    </StatusBadge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="max-w-sm truncate font-medium">{event.title}</div>
                    <div className="max-w-sm truncate text-xs text-muted-foreground">{event.reason}</div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    <div className="max-w-44 truncate">{event.resource_type ?? '未知资源'}</div>
                    <div className="max-w-44 truncate text-xs">{event.resource_id ?? '未记录'}</div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    <div className="max-w-40 truncate">{event.action ?? '-'}</div>
                    <div className="max-w-40 truncate text-xs">{event.method} {event.path}</div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    <div className="max-w-44 truncate">{event.request_id}</div>
                    <div className="max-w-44 truncate text-xs">{event.matched_code ?? '无匹配编码'}</div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    <div className="max-w-44 truncate">{event.trace_id ?? '-'}</div>
                    <div className="text-xs">{event.has_trace ? '可追踪' : '无 Trace'}</div>
                  </td>
                  <td className="px-4 py-3">
                    <Button onClick={() => onOpenDetail(event.id)} size="sm" variant="outline">
                      <Eye className="size-4" />
                      详情
                    </Button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {total > 0 ? (
        <div className="border-t p-4">
          <PaginationBar onPageChange={onPageChange} page={page} pageCount={pageCount} total={total} />
        </div>
      ) : null}
    </Card>
  );
}

function SecurityEventDetailDrawer({
  event,
  loading,
  error,
  onClose,
}: {
  event: SecurityCenterEventDetail | null;
  loading: boolean;
  error: boolean;
  onClose: () => void;
}) {
  const [copyMessage, setCopyMessage] = useState<string | null>(null);

  async function copyValue(label: string, value: string | null) {
    if (!value) return;

    try {
      await navigator.clipboard.writeText(value);
      setCopyMessage(`${label}已复制。`);
    } catch {
      setCopyMessage(`${label}复制失败。`);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/35 backdrop-blur-sm">
      <Card className="h-full w-full max-w-3xl overflow-y-auto rounded-none border-y-0 border-r-0 p-5 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge tone="ready">事件详情</StatusBadge>
              {event ? <StatusBadge tone={securityRiskTone(event.severity)}>{securityRiskLevelLabel(event.severity)}</StatusBadge> : null}
            </div>
            <h2 className="mt-2 text-base font-semibold">安全拒绝事件</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              查看 Guard 来源、主体属性、资源属性、上下文和链路追踪信息。
            </p>
          </div>
          <Button onClick={onClose} type="button" variant="outline">
            关闭
          </Button>
        </div>

        {loading ? (
          <div className="mt-6 text-sm text-muted-foreground">正在加载事件详情...</div>
        ) : error ? (
          <div className="mt-6 rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
            事件详情加载失败，请重试。
          </div>
        ) : !event ? (
          <EmptyState description="事件可能已被清理，或当前用户无权查看。" title="事件不存在" />
        ) : (
          <div className="mt-5 grid gap-4">
            <div className="rounded-lg border bg-muted/25 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge tone="degraded">{securityDenialSourceLabel(event.source)}</StatusBadge>
                <StatusBadge tone={event.has_trace ? 'healthy' : 'planned'}>
                  {event.has_trace ? '可追踪' : '无 Trace'}
                </StatusBadge>
                <span className="text-xs text-muted-foreground">{formatDateTime(event.occurred_at)}</span>
              </div>
              <h3 className="mt-3 text-sm font-semibold">{event.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{event.reason}</p>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <SummaryTile label="请求 ID" value={event.request_id} />
              <SummaryTile label="Trace ID" value={event.trace_id ?? '未记录'} />
              <SummaryTile label="资源" value={`${event.resource_type ?? '未知'} / ${event.resource_id ?? '未记录'}`} />
              <SummaryTile label="动作" value={event.action ?? '未记录'} />
              <SummaryTile label="路径" value={`${event.method} ${event.path}`} />
              <SummaryTile label="状态码" value={`${event.status_code}`} />
            </div>

            <div className="flex flex-wrap gap-2">
              <Button onClick={() => void copyValue('请求 ID', event.request_id)} size="sm" type="button" variant="outline">
                <Copy className="size-4" />
                复制请求 ID
              </Button>
              <Button
                disabled={!event.trace_id}
                onClick={() => void copyValue('Trace ID', event.trace_id)}
                size="sm"
                type="button"
                variant="outline"
              >
                <Copy className="size-4" />
                复制 Trace ID
              </Button>
            </div>

            {copyMessage ? <div className="text-xs text-muted-foreground">{copyMessage}</div> : null}

            {event.trace_id ? (
              <Button asChild className="w-full justify-center" type="button" variant="outline">
                <Link href={`/monitor?trace_id=${encodeURIComponent(event.trace_id)}`}>
                  <Activity className="size-4" />
                  跳转运行监控
                </Link>
              </Button>
            ) : (
              <Button className="w-full justify-center" disabled type="button" variant="outline">
                <Activity className="size-4" />
                当前事件没有 Trace ID
              </Button>
            )}

            <div className="grid gap-3">
              <JsonReadonlyPanel label="主体属性" value={event.subject} />
              <JsonReadonlyPanel label="资源属性" value={event.resource} />
              <JsonReadonlyPanel label="上下文" value={event.context} />
              <JsonReadonlyPanel label="请求摘要" value={event.request_summary} />
            </div>

            <div className="rounded-lg border bg-background/70 p-4">
              <h3 className="text-sm font-semibold">匹配与操作人</h3>
              <div className="mt-3 grid gap-2 text-sm text-muted-foreground">
                <span>匹配编码：{event.matched_code ?? event.matched_policy?.code ?? '无'}</span>
                <span>匹配策略：{event.matched_policy?.name ?? '无'}</span>
                <span>操作人：{event.operator ? `${event.operator.name} / ${event.operator.email}` : '系统或未知'}</span>
                <span>来源 IP：{event.ip ?? '未记录'}</span>
                <span>User-Agent：{event.user_agent ?? '未记录'}</span>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

function JsonReadonlyPanel({ label, value }: { label: string; value: unknown }) {
  return (
    <div className="rounded-lg border bg-background/70 p-4">
      <h3 className="text-sm font-semibold">{label}</h3>
      <pre className="mt-3 max-h-72 overflow-auto rounded-md bg-slate-950 p-3 font-mono text-xs leading-5 text-slate-100">
        {stringifyJson(value ?? {})}
      </pre>
    </div>
  );
}

interface PolicyFormValues {
  name: string;
  code: string;
  description: string;
  effect: SecurityPolicyEffect;
  resource_type: string;
  action: string;
  priority: string;
  conditions: string;
}

function PolicyFormDialog({
  error,
  isPending,
  mode,
  onClose,
  onSubmit,
  policy,
}: {
  error: string | null;
  isPending: boolean;
  mode: 'create' | 'edit';
  onClose: () => void;
  onSubmit: (values: PolicyFormValues) => void;
  policy: SecurityPolicyDetail | null;
}) {
  const [values, setValues] = useState<PolicyFormValues>({
    name: policy?.name ?? '',
    code: policy?.code ?? '',
    description: policy?.description ?? '',
    effect: policy?.effect ?? 'DENY',
    resource_type: policy?.resource_type ?? 'agent',
    action: policy?.action ?? 'read',
    priority: `${policy?.priority ?? 100}`,
    conditions: stringifyJson(policy?.conditions ?? defaultConditions),
  });

  function patchValue<Key extends keyof PolicyFormValues>(key: Key, value: PolicyFormValues[Key]) {
    setValues((current) => ({
      ...current,
      [key]: value,
    }));
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/35 px-4 py-6 backdrop-blur-sm">
      <Card className="max-h-[92vh] w-full max-w-2xl overflow-y-auto p-5 shadow-lg">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold">{mode === 'create' ? '新建安全策略' : '编辑安全策略'}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              条件路径支持 subject、resource、context，例如 subject.department_id。
            </p>
          </div>
          <Button onClick={onClose} type="button" variant="outline">
            关闭
          </Button>
        </div>

        <form
          className="mt-5 grid gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit(values);
          }}
        >
          <div className="grid gap-3 md:grid-cols-2">
            <label className="grid gap-1 text-sm">
              <span className="font-medium">名称</span>
              <Input onChange={(event) => patchValue('name', event.target.value)} required value={values.name} />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="font-medium">编码</span>
              <Input disabled={mode === 'edit'} onChange={(event) => patchValue('code', event.target.value)} required value={values.code} />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="font-medium">效果</span>
              <select className="h-10 rounded-md border bg-background/80 px-3 text-sm" onChange={(event) => patchValue('effect', event.target.value as SecurityPolicyEffect)} value={values.effect}>
                {policyEffects.map((item) => (
                  <option key={item} value={item}>
                    {securityPolicyEffectLabel(item)}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-sm">
              <span className="font-medium">优先级</span>
              <Input min={0} onChange={(event) => patchValue('priority', event.target.value)} required type="number" value={values.priority} />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="font-medium">资源类型</span>
              <Input onChange={(event) => patchValue('resource_type', event.target.value)} required value={values.resource_type} />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="font-medium">动作</span>
              <Input onChange={(event) => patchValue('action', event.target.value)} required value={values.action} />
            </label>
          </div>

          <label className="grid gap-1 text-sm">
            <span className="font-medium">描述</span>
            <textarea
              className="min-h-20 rounded-md border bg-background/80 px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onChange={(event) => patchValue('description', event.target.value)}
              value={values.description}
            />
          </label>

          <JsonTextArea label="条件 JSON" onChange={(value) => patchValue('conditions', value)} value={values.conditions} />

          {error ? (
            <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          ) : null}

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button onClick={onClose} type="button" variant="outline">
              取消
            </Button>
            <Button disabled={isPending} type="submit">
              {mode === 'create' ? '创建策略' : '保存策略'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

function JsonTextArea({
  label,
  onChange,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="font-medium">{label}</span>
      <textarea
        className="min-h-28 resize-y rounded-md border bg-slate-950 px-3 py-3 font-mono text-xs leading-5 text-slate-100 outline-none focus-visible:ring-2 focus-visible:ring-ring"
        onChange={(event) => onChange(event.target.value)}
        spellCheck={false}
        value={value}
      />
    </label>
  );
}

function ConfirmDialog({
  body,
  onCancel,
  onConfirm,
  pending,
  title,
}: {
  body: string;
  onCancel: () => void;
  onConfirm: () => void;
  pending: boolean;
  title: string;
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/35 px-4 backdrop-blur-sm">
      <Card className="w-full max-w-md p-5 shadow-lg">
        <h2 className="text-base font-semibold">{title}</h2>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">{body}</p>
        <div className="mt-5 flex justify-end gap-2">
          <Button onClick={onCancel} type="button" variant="outline">
            取消
          </Button>
          <Button disabled={pending} onClick={onConfirm} type="button" variant="destructive">
            确认删除
          </Button>
        </div>
      </Card>
    </div>
  );
}

function SummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-background/70 p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 truncate text-sm font-medium">{value}</div>
    </div>
  );
}

function toPolicyPayload(values: PolicyFormValues):
  | { ok: true; value: CreateSecurityPolicyInput | UpdateSecurityPolicyInput }
  | { ok: false; message: string } {
  const priority = Number(values.priority);
  if (!Number.isInteger(priority) || priority < 0) {
    return { ok: false, message: '优先级必须是非负整数。' };
  }

  const conditions = parseJsonObjectText(values.conditions, '条件 JSON', { allowEmpty: true });
  if (!conditions.ok) {
    return conditions;
  }

  return {
    ok: true,
    value: {
      name: values.name.trim(),
      code: values.code.trim(),
      description: values.description.trim() || null,
      effect: values.effect,
      resource_type: values.resource_type.trim(),
      action: values.action.trim(),
      priority,
      conditions: conditions.value,
    },
  };
}

async function invalidateSecurityQueries(queryClient: ReturnType<typeof useQueryClient>) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ['security-center-overview'] }),
    queryClient.invalidateQueries({ queryKey: ['security-approval-workbench-overview'] }),
    queryClient.invalidateQueries({ queryKey: ['security-approval-workbench'] }),
    queryClient.invalidateQueries({ queryKey: ['tool-approval-overview'] }),
    queryClient.invalidateQueries({ queryKey: ['tool-approvals'] }),
    queryClient.invalidateQueries({ queryKey: ['notification-policy-approval-overview'] }),
    queryClient.invalidateQueries({ queryKey: ['notification-policy-approvals'] }),
    queryClient.invalidateQueries({ queryKey: ['approval-audit-archive-approval-overview'] }),
    queryClient.invalidateQueries({ queryKey: ['approval-audit-archive-approvals'] }),
    queryClient.invalidateQueries({ queryKey: ['approval-audit-archives'] }),
    queryClient.invalidateQueries({ queryKey: ['approval-audit-events'] }),
    queryClient.invalidateQueries({ queryKey: ['approval-audit-overview'] }),
    queryClient.invalidateQueries({ queryKey: ['security-operation-alert-notification-archive-approval-overview'] }),
    queryClient.invalidateQueries({ queryKey: ['security-operation-alert-notification-archive-approvals'] }),
    queryClient.invalidateQueries({ queryKey: ['security-operation-alert-notification-archives'] }),
    queryClient.invalidateQueries({ queryKey: ['security-operation-alert-notification-task-recovery-audit-archive-approval-overview'] }),
    queryClient.invalidateQueries({ queryKey: ['security-operation-alert-notification-task-recovery-audit-archive-approvals'] }),
    queryClient.invalidateQueries({ queryKey: ['security-operation-alert-notification-task-recovery-audit-archives'] }),
    queryClient.invalidateQueries({ queryKey: ['security-operation-alert-sla-dead-letter-audit-archive-approval-overview'] }),
    queryClient.invalidateQueries({ queryKey: ['security-operation-alert-sla-dead-letter-audit-archive-approvals'] }),
    queryClient.invalidateQueries({ queryKey: ['security-operation-alert-sla-dead-letter-audit-archives'] }),
    queryClient.invalidateQueries({ queryKey: ['security-policy-overview'] }),
    queryClient.invalidateQueries({ queryKey: ['security-policies'] }),
    queryClient.invalidateQueries({ queryKey: ['security-policy-evaluations'] }),
  ]);
}

function SecurityCenterOverviewPanel({
  loading,
  overview,
  onOpenEventDetail,
  policyTotal,
}: {
  loading: boolean;
  overview: SecurityCenterOverview | null;
  onOpenEventDetail: (eventId: string) => void;
  policyTotal: number;
}) {
  if (loading && !overview) {
    return (
      <Card className="p-5">
        <div className="text-sm text-muted-foreground">正在汇总安全中心数据...</div>
      </Card>
    );
  }

  if (!overview) {
    return (
      <Card className="p-5">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <h2 className="text-sm font-semibold">安全态势暂不可用</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              聚合接口暂时无法返回数据，策略治理工作区仍可继续使用。
            </p>
          </div>
          <StatusBadge tone="degraded">总览异常</StatusBadge>
        </div>
      </Card>
    );
  }

  return (
    <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
      <Card className="min-w-0 overflow-hidden">
        <div className="border-b p-5">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge tone={securityRiskTone(overview.posture.level)}>
                  {securityRiskLevelLabel(overview.posture.level)}
                </StatusBadge>
                <StatusBadge tone="ready">评分 {overview.posture.score}</StatusBadge>
                <StatusBadge tone="planned">{policyTotal} 条策略</StatusBadge>
              </div>
              <h2 className="mt-3 text-lg font-semibold">安全态势总览</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                {overview.posture.summary}
              </p>
            </div>
            <div className="grid min-w-[180px] gap-1 rounded-md border bg-muted/25 p-3 text-sm">
              <span className="text-xs text-muted-foreground">最近生成</span>
              <span className="font-medium">{formatDateTime(overview.generated_at)}</span>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {overview.posture.guard_chain.map((item) => (
              <span className="rounded-md border bg-background/70 px-2.5 py-1 text-xs text-muted-foreground" key={item}>
                {item}
              </span>
            ))}
          </div>
        </div>

        <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-3">
          {overview.modules.map((module) => (
            <SecurityModuleCard key={module.key} module={module} />
          ))}
        </div>
      </Card>

      <Card className="min-w-0 overflow-hidden">
        <div className="border-b p-5">
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-4" />
            <h2 className="text-sm font-semibold">运行时拒绝与风险信号</h2>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            从 Guard 拦截、审批、审计、监控、数据权限和授权规则中聚合出的优先检查项。
          </p>
        </div>
        <div className="grid gap-3 p-4">
          <div className="grid gap-2">
            <div className="flex items-center justify-between gap-3">
              <div className="text-xs font-medium text-muted-foreground">最近拒绝事件</div>
              <StatusBadge tone={overview.recent.security_denials.length > 0 ? 'degraded' : 'healthy'}>
                {overview.recent.security_denials.length} 条
              </StatusBadge>
            </div>
            {overview.recent.security_denials.length > 0 ? (
              overview.recent.security_denials.slice(0, 4).map((item) => (
                <SecurityDenialCard denial={item} key={item.id} onOpenDetail={onOpenEventDetail} />
              ))
            ) : (
              <div className="rounded-lg border bg-background/70 p-3 text-sm text-muted-foreground">
                最近 24 小时暂无运行时拒绝事件。
              </div>
            )}
          </div>
          <div className="h-px bg-border" />
          {overview.risks.map((risk) => (
            <RiskSignalCard key={risk.id} risk={risk} />
          ))}
        </div>
      </Card>
    </section>
  );
}

function SecurityModuleCard({ module }: { module: SecurityCenterModuleSummary }) {
  const Icon = securityModuleIcons[module.key] ?? ShieldEllipsis;

  return (
    <Link
      className="group grid min-h-[180px] gap-4 rounded-lg border bg-background/70 p-4 transition-colors hover:bg-muted/25"
      href={module.href}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="grid size-9 place-items-center rounded-md border bg-background">
            <Icon className="size-4" />
          </span>
          <div>
            <h3 className="text-sm font-semibold">{module.title}</h3>
            <StatusBadge tone={module.status}>{moduleStatusLabel(module.status)}</StatusBadge>
          </div>
        </div>
        <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
      </div>
      <p className="text-sm leading-6 text-muted-foreground">{module.description}</p>
      <div className="grid gap-2 sm:grid-cols-2">
        <SummaryTile label={module.primary_metric.label} value={module.primary_metric.value} />
        <SummaryTile label={module.secondary_metric.label} value={module.secondary_metric.value} />
      </div>
      <div className="text-xs text-muted-foreground">{module.action_label} · {module.primary_metric.helper}</div>
    </Link>
  );
}

function ApprovalArchiveOperationsCard({
  actionResults,
  loading,
  notificationResults,
  notificationTaskRecoveryActionResults,
  notificationTaskRecoveryPendingAction,
  notificationTaskRecoveryPendingSuggestionId,
  notificationTaskRecoveryUpdating,
  notifying,
  notifyingAlertId,
  onAction,
  onNotificationTaskRecoveryAction,
  notificationAudit,
  notificationAuditLoading,
  notificationArchiveError,
  notificationArchiveLoading,
  notificationArchiveMessage,
  notificationArchiveApprovalNote,
  notificationArchiveApprovalOverview,
  notificationArchiveApprovals,
  notificationArchiveApprovalsLoading,
  notificationArchives,
  notificationArchiveSummary,
  notificationCategory,
  notificationExportState,
  notificationKeyword,
  notificationStatus,
  onNotificationArchiveApprove,
  onNotificationArchiveCreate,
  onNotificationArchiveDelete,
  onNotificationArchiveDownload,
  onNotificationArchiveNoteChange,
  onNotificationArchiveReject,
  onNotificationArchiveRefresh,
  onNotificationArchiveApprovalRefresh,
  onNotificationCategoryChange,
  onNotificationExport,
  onNotificationKeywordChange,
  onNotificationStatusChange,
  onNotify,
  onRetryNotification,
  operationNotificationArchiving,
  operationNotificationArchiveApproving,
  operationNotificationArchiveDeleting,
  operationNotificationArchiveRejecting,
  operationNotificationDownloading,
  overview,
  pendingAction,
  pendingActionAlertId,
  retryingNotification,
  retryingNotificationEventId,
  taskLoading,
  taskOverview,
  taskAutoNotifyRunning,
  taskAutoRetryRunning,
  taskRunHistory,
  taskRunHistoryKeyword,
  taskRunHistoryLoading,
  taskRunHistoryStatus,
  taskRunHistoryTask,
  taskRecoveryAudit,
  taskRecoveryAuditAction,
  taskRecoveryAuditArchiveError,
  taskRecoveryAuditArchiveLoading,
  taskRecoveryAuditArchiveMessage,
  taskRecoveryAuditArchives,
  taskRecoveryAuditArchiveSummary,
  taskRecoveryAuditCreatingArchive,
  taskRecoveryAuditDeletingArchive,
  taskRecoveryAuditDownloadingArchive,
  taskRecoveryAuditArchiveApproving,
  taskRecoveryAuditArchiveRejecting,
  taskRecoveryAuditArchiveApprovalNote,
  taskRecoveryAuditArchiveApprovalOverview,
  taskRecoveryAuditArchiveApprovals,
  taskRecoveryAuditArchiveApprovalsLoading,
  taskRecoveryAuditExportState,
  taskRecoveryAuditFailureSource,
  taskRecoveryAuditKeyword,
  taskRecoveryAuditLoading,
  taskRecoveryAuditReason,
  taskRecoveryAuditStatus,
  slaLoading,
  slaOverview,
  slaRunning,
  slaNotificationLoading,
  slaNotificationOverview,
  slaNotificationRunning,
  slaNotificationRetryLoading,
  slaNotificationRetryOverview,
  slaNotificationRetryRunning,
  slaDeadLetterLoading,
  slaDeadLetterNote,
  slaDeadLetterOverview,
  slaDeadLetterPendingAction,
  slaDeadLetterPendingEventId,
  slaDeadLetterRunning,
  slaDeadLetterAuditAction,
  slaDeadLetterAuditKeyword,
  slaDeadLetterAuditLoading,
  slaDeadLetterAuditPage,
  slaDeadLetterAuditPageCount,
  slaDeadLetterAuditResult,
  slaDeadLetterAuditStatus,
  slaDeadLetterAuditExportState,
  slaDeadLetterAuditArchives,
  slaDeadLetterAuditArchiveError,
  slaDeadLetterAuditArchiveLoading,
  slaDeadLetterAuditArchiveMessage,
  slaDeadLetterAuditArchiveSummary,
  slaDeadLetterAuditCreatingArchive,
  slaDeadLetterAuditDownloadingArchive,
  slaDeadLetterAuditDeletingArchive,
  slaDeadLetterAuditArchiveApproving,
  slaDeadLetterAuditArchiveRejecting,
  slaDeadLetterAuditArchiveApprovalNote,
  slaDeadLetterAuditArchiveApprovalOverview,
  slaDeadLetterAuditArchiveApprovals,
  slaDeadLetterAuditArchiveApprovalsLoading,
  onRefreshTask,
  onRunAutoNotify,
  onRunAutoRetry,
  onRefreshTaskRecoveryAudit,
  onRefreshTaskRunHistory,
  onTaskRecoveryAuditActionChange,
  onTaskRecoveryAuditArchiveApprove,
  onTaskRecoveryAuditArchiveCreate,
  onTaskRecoveryAuditArchiveDelete,
  onTaskRecoveryAuditArchiveDownload,
  onTaskRecoveryAuditArchiveNoteChange,
  onTaskRecoveryAuditArchiveReject,
  onTaskRecoveryAuditArchiveRefresh,
  onTaskRecoveryAuditArchiveApprovalRefresh,
  onTaskRecoveryAuditExport,
  onTaskRecoveryAuditFailureSourceChange,
  onTaskRecoveryAuditKeywordChange,
  onTaskRecoveryAuditReasonChange,
  onTaskRecoveryAuditStatusChange,
  onTaskRunHistoryKeywordChange,
  onTaskRunHistoryStatusChange,
  onTaskRunHistoryTaskChange,
  onRefreshSla,
  onRunSlaEscalation,
  onRefreshSlaNotification,
  onNotifySlaOverdue,
  onRefreshSlaNotificationRetry,
  onRunSlaNotificationAutoRetry,
  onRetrySlaNotification,
  onRefreshSlaDeadLetter,
  onHandleSlaDeadLetter,
  onSlaDeadLetterNoteChange,
  onSlaDeadLetterAuditActionChange,
  onSlaDeadLetterAuditArchiveApprove,
  onSlaDeadLetterAuditArchiveCreate,
  onSlaDeadLetterAuditArchiveDelete,
  onSlaDeadLetterAuditArchiveDownload,
  onSlaDeadLetterAuditArchiveNoteChange,
  onSlaDeadLetterAuditArchiveReject,
  onSlaDeadLetterAuditArchiveRefresh,
  onSlaDeadLetterAuditArchiveApprovalRefresh,
  onSlaDeadLetterAuditExport,
  onSlaDeadLetterAuditKeywordChange,
  onSlaDeadLetterAuditStatusChange,
  onSlaDeadLetterAuditPageChange,
  onRefreshSlaDeadLetterAudit,
  retryingSlaNotification,
  retryingSlaNotificationEventId,
  updatingAction,
}: {
  actionResults: Record<string, SecurityOperationAlertActionResult>;
  loading: boolean;
  notificationResults: Record<string, SecurityOperationAlertNotificationResult>;
  notificationTaskRecoveryActionResults: Record<string, SecurityOperationAlertNotificationTaskRecoveryActionResult>;
  notificationTaskRecoveryPendingAction: SecurityOperationAlertNotificationTaskRecoveryAction | null;
  notificationTaskRecoveryPendingSuggestionId: string | null;
  notificationTaskRecoveryUpdating: boolean;
  notifying: boolean;
  notifyingAlertId: string | null;
  onAction: (alertId: string, action: SecurityOperationAlertAction) => void;
  onNotificationTaskRecoveryAction: (
    suggestionId: string,
    action: SecurityOperationAlertNotificationTaskRecoveryAction,
  ) => void;
  notificationAudit: SecurityOperationAlertNotificationOverview | null;
  notificationAuditLoading: boolean;
  notificationArchiveError: string | null;
  notificationArchiveLoading: boolean;
  notificationArchiveMessage: string | null;
  notificationArchiveApprovalNote: string;
  notificationArchiveApprovalOverview: SecurityOperationAlertNotificationArchiveApprovalOverview | null;
  notificationArchiveApprovals: SecurityOperationAlertNotificationArchiveApprovalItem[];
  notificationArchiveApprovalsLoading: boolean;
  notificationArchives: SecurityOperationAlertNotificationArchiveItem[];
  notificationArchiveSummary: { archive_count: number; total_size_bytes: number } | null;
  notificationCategory: string;
  notificationExportState: 'idle' | 'exporting' | 'success' | 'error';
  notificationKeyword: string;
  notificationStatus: SecurityOperationAlertNotificationStatus | '';
  onNotificationArchiveApprove: (approvalId: string) => void;
  onNotificationArchiveCreate: () => void;
  onNotificationArchiveDelete: (archive: SecurityOperationAlertNotificationArchiveItem) => void;
  onNotificationArchiveDownload: (archive: SecurityOperationAlertNotificationArchiveItem) => void;
  onNotificationArchiveNoteChange: (note: string) => void;
  onNotificationArchiveReject: (approvalId: string) => void;
  onNotificationArchiveRefresh: () => void;
  onNotificationArchiveApprovalRefresh: () => void;
  onNotificationCategoryChange: (category: string) => void;
  onNotificationExport: () => void;
  onNotificationKeywordChange: (keyword: string) => void;
  onNotificationStatusChange: (status: SecurityOperationAlertNotificationStatus | '') => void;
  onNotify: (alertId: string) => void;
  onRetryNotification: (notificationEventId: string) => void;
  operationNotificationArchiving: boolean;
  operationNotificationArchiveApproving: boolean;
  operationNotificationArchiveDeleting: boolean;
  operationNotificationArchiveRejecting: boolean;
  operationNotificationDownloading: boolean;
  overview: SecurityCenterOverview | null;
  pendingAction: SecurityOperationAlertAction | null;
  pendingActionAlertId: string | null;
  retryingNotification: boolean;
  retryingNotificationEventId: string | null;
  taskLoading: boolean;
  taskOverview: SecurityOperationAlertNotificationTaskOverview | null;
  taskAutoNotifyRunning: boolean;
  taskAutoRetryRunning: boolean;
  taskRunHistory: SecurityOperationAlertNotificationTaskRunOverview | null;
  taskRunHistoryKeyword: string;
  taskRunHistoryLoading: boolean;
  taskRunHistoryStatus: SecurityOperationAlertNotificationTaskRunResult['status'] | '';
  taskRunHistoryTask: SecurityOperationAlertNotificationTaskName | '';
  taskRecoveryAudit: SecurityOperationAlertNotificationTaskRecoveryAuditOverview | null;
  taskRecoveryAuditAction: SecurityOperationAlertNotificationTaskRecoveryAction | '';
  taskRecoveryAuditArchiveError: string | null;
  taskRecoveryAuditArchiveLoading: boolean;
  taskRecoveryAuditArchiveMessage: string | null;
  taskRecoveryAuditArchives: SecurityOperationAlertNotificationTaskRecoveryAuditArchiveItem[];
  taskRecoveryAuditArchiveSummary: { archive_count: number; total_size_bytes: number } | null;
  taskRecoveryAuditCreatingArchive: boolean;
  taskRecoveryAuditDeletingArchive: boolean;
  taskRecoveryAuditDownloadingArchive: boolean;
  taskRecoveryAuditArchiveApproving: boolean;
  taskRecoveryAuditArchiveRejecting: boolean;
  taskRecoveryAuditArchiveApprovalNote: string;
  taskRecoveryAuditArchiveApprovalOverview: SecurityOperationAlertNotificationTaskRecoveryAuditArchiveApprovalOverview | null;
  taskRecoveryAuditArchiveApprovals: SecurityOperationAlertNotificationTaskRecoveryAuditArchiveApprovalItem[];
  taskRecoveryAuditArchiveApprovalsLoading: boolean;
  taskRecoveryAuditExportState: 'idle' | 'exporting' | 'success' | 'error';
  taskRecoveryAuditFailureSource: SecurityOperationAlertNotificationTaskRecoveryFailureSource | '';
  taskRecoveryAuditKeyword: string;
  taskRecoveryAuditLoading: boolean;
  taskRecoveryAuditReason: SecurityOperationAlertNotificationTaskRecoverySuggestion['reason_code'] | '';
  taskRecoveryAuditStatus: SecurityOperationAlertNotificationTaskRecoveryStatus | '';
  slaLoading: boolean;
  slaOverview: SecurityOperationAlertSlaOverview | null;
  slaRunning: boolean;
  slaNotificationLoading: boolean;
  slaNotificationOverview: SecurityOperationAlertSlaNotificationOverview | null;
  slaNotificationRunning: boolean;
  slaNotificationRetryLoading: boolean;
  slaNotificationRetryOverview: SecurityOperationAlertSlaNotificationRetryOverview | null;
  slaNotificationRetryRunning: boolean;
  slaDeadLetterLoading: boolean;
  slaDeadLetterNote: string;
  slaDeadLetterOverview: SecurityOperationAlertSlaDeadLetterOverview | null;
  slaDeadLetterPendingAction: SecurityOperationAlertSlaDeadLetterAction | null;
  slaDeadLetterPendingEventId: string | null;
  slaDeadLetterRunning: boolean;
  slaDeadLetterAuditAction: SecurityOperationAlertSlaDeadLetterAction | '';
  slaDeadLetterAuditKeyword: string;
  slaDeadLetterAuditLoading: boolean;
  slaDeadLetterAuditPage: number;
  slaDeadLetterAuditPageCount: number;
  slaDeadLetterAuditResult: PaginatedSecurityOperationAlertSlaDeadLetterAudits | null;
  slaDeadLetterAuditStatus: SecurityOperationAlertSlaDeadLetterDispositionStatus | '';
  slaDeadLetterAuditExportState: 'idle' | 'exporting' | 'success' | 'error';
  slaDeadLetterAuditArchives: SecurityOperationAlertSlaDeadLetterAuditArchiveItem[];
  slaDeadLetterAuditArchiveError: string | null;
  slaDeadLetterAuditArchiveLoading: boolean;
  slaDeadLetterAuditArchiveMessage: string | null;
  slaDeadLetterAuditArchiveSummary: { archive_count: number; total_size_bytes: number } | null;
  slaDeadLetterAuditCreatingArchive: boolean;
  slaDeadLetterAuditDownloadingArchive: boolean;
  slaDeadLetterAuditDeletingArchive: boolean;
  slaDeadLetterAuditArchiveApproving: boolean;
  slaDeadLetterAuditArchiveRejecting: boolean;
  slaDeadLetterAuditArchiveApprovalNote: string;
  slaDeadLetterAuditArchiveApprovalOverview: SecurityOperationAlertSlaDeadLetterAuditArchiveApprovalOverview | null;
  slaDeadLetterAuditArchiveApprovals: SecurityOperationAlertSlaDeadLetterAuditArchiveApprovalItem[];
  slaDeadLetterAuditArchiveApprovalsLoading: boolean;
  onRefreshTask: () => void;
  onRunAutoNotify: () => void;
  onRunAutoRetry: () => void;
  onRefreshTaskRecoveryAudit: () => void;
  onRefreshTaskRunHistory: () => void;
  onTaskRecoveryAuditActionChange: (action: SecurityOperationAlertNotificationTaskRecoveryAction | '') => void;
  onTaskRecoveryAuditArchiveApprove: (approvalId: string) => void;
  onTaskRecoveryAuditArchiveCreate: () => void;
  onTaskRecoveryAuditArchiveDelete: (archive: SecurityOperationAlertNotificationTaskRecoveryAuditArchiveItem) => void;
  onTaskRecoveryAuditArchiveDownload: (archive: SecurityOperationAlertNotificationTaskRecoveryAuditArchiveItem) => void;
  onTaskRecoveryAuditArchiveNoteChange: (note: string) => void;
  onTaskRecoveryAuditArchiveReject: (approvalId: string) => void;
  onTaskRecoveryAuditArchiveRefresh: () => void;
  onTaskRecoveryAuditArchiveApprovalRefresh: () => void;
  onTaskRecoveryAuditExport: () => void;
  onTaskRecoveryAuditFailureSourceChange: (source: SecurityOperationAlertNotificationTaskRecoveryFailureSource | '') => void;
  onTaskRecoveryAuditKeywordChange: (keyword: string) => void;
  onTaskRecoveryAuditReasonChange: (reason: SecurityOperationAlertNotificationTaskRecoverySuggestion['reason_code'] | '') => void;
  onTaskRecoveryAuditStatusChange: (status: SecurityOperationAlertNotificationTaskRecoveryStatus | '') => void;
  onTaskRunHistoryKeywordChange: (keyword: string) => void;
  onTaskRunHistoryStatusChange: (status: SecurityOperationAlertNotificationTaskRunResult['status'] | '') => void;
  onTaskRunHistoryTaskChange: (task: SecurityOperationAlertNotificationTaskName | '') => void;
  onRefreshSla: () => void;
  onRunSlaEscalation: () => void;
  onRefreshSlaNotification: () => void;
  onNotifySlaOverdue: () => void;
  onRefreshSlaNotificationRetry: () => void;
  onRunSlaNotificationAutoRetry: () => void;
  onRetrySlaNotification: (notificationEventId: string) => void;
  onRefreshSlaDeadLetter: () => void;
  onHandleSlaDeadLetter: (notificationEventId: string, action: SecurityOperationAlertSlaDeadLetterAction) => void;
  onSlaDeadLetterNoteChange: (note: string) => void;
  onSlaDeadLetterAuditActionChange: (action: SecurityOperationAlertSlaDeadLetterAction | '') => void;
  onSlaDeadLetterAuditArchiveApprove: (approvalId: string) => void;
  onSlaDeadLetterAuditArchiveCreate: () => void;
  onSlaDeadLetterAuditArchiveDelete: (archive: SecurityOperationAlertSlaDeadLetterAuditArchiveItem) => void;
  onSlaDeadLetterAuditArchiveDownload: (archive: SecurityOperationAlertSlaDeadLetterAuditArchiveItem) => void;
  onSlaDeadLetterAuditArchiveNoteChange: (note: string) => void;
  onSlaDeadLetterAuditArchiveReject: (approvalId: string) => void;
  onSlaDeadLetterAuditArchiveRefresh: () => void;
  onSlaDeadLetterAuditArchiveApprovalRefresh: () => void;
  onSlaDeadLetterAuditExport: () => void;
  onSlaDeadLetterAuditKeywordChange: (keyword: string) => void;
  onSlaDeadLetterAuditStatusChange: (status: SecurityOperationAlertSlaDeadLetterDispositionStatus | '') => void;
  onSlaDeadLetterAuditPageChange: (page: number) => void;
  onRefreshSlaDeadLetterAudit: () => void;
  retryingSlaNotification: boolean;
  retryingSlaNotificationEventId: string | null;
  updatingAction: boolean;
}) {
  if (loading && !overview) {
    return (
      <Card className="p-5">
        <div className="text-sm text-muted-foreground">正在汇总审批与归档运营数据...</div>
      </Card>
    );
  }

  if (!overview) return null;

  const operations = overview.approval_operations;
  const archiveDeletePendingTotal =
    operations.archive_delete_pending +
    operations.sla_dead_letter_archive_delete_pending +
    operations.notification_task_recovery_audit_archive_delete_pending;
  const pendingTotal =
    operations.tool_pending +
    operations.notification_pending +
    archiveDeletePendingTotal;
  const auditRiskTotal = operations.audit_failed_24h + operations.audit_warning_24h;
  const notificationTaskRisk =
    operations.notification_task_failed_24h > 0 ||
    operations.notification_task_skipped_24h > 0 ||
    operations.notification_task_consecutive_failures >= 2;
  const notificationTaskCategoryFailureTotal =
    operations.notification_task_sla_dead_letter_failed_24h +
    operations.notification_task_recovery_archive_delete_failed_24h;
  const notificationTaskMixedFailure =
    operations.notification_task_sla_dead_letter_failed_24h > 0 &&
    operations.notification_task_recovery_archive_delete_failed_24h > 0;
  const notificationTaskRecoveryArchiveDeleteRisk =
    operations.notification_task_recovery_audit_archive_delete_rejected > 0 &&
    operations.notification_task_recovery_audit_archive_delete_rejected >=
      operations.notification_task_recovery_audit_archive_delete_applied;
  const archiveRisk = operations.archive_storage_status === 'UNKNOWN' || operations.archive_storage_status === 'UNAVAILABLE';
  const statusTone =
    archiveRisk || auditRiskTotal > 0 || notificationTaskRisk || notificationTaskRecoveryArchiveDeleteRisk
      ? 'degraded'
      : pendingTotal > 0
        ? 'planned'
        : 'healthy';
  const statusLabel = archiveRisk
    ? '归档风险'
    : notificationTaskRecoveryArchiveDeleteRisk
      ? '自愈归档风险'
      : notificationTaskRisk
        ? '通知风险'
        : pendingTotal > 0
          ? '待处理'
          : '正常';
  const approvalMetrics = [
    {
      label: '工具待审',
      value: operations.tool_pending,
      helper: `运行时 ${operations.runtime_pending} 个`,
    },
    {
      label: '策略待审',
      value: operations.notification_pending,
      helper: `高影响 ${operations.notification_high_impact_pending} 个`,
    },
    {
      label: '归档删除待审',
      value: archiveDeletePendingTotal,
      helper: `审计 ${operations.archive_delete_pending} / SLA ${operations.sla_dead_letter_archive_delete_pending} / 自愈 ${operations.notification_task_recovery_audit_archive_delete_pending}`,
    },
    {
      label: '审批审计',
      value: operations.audit_events_24h,
      helper: '最近 24 小时',
    },
  ];
  const slaArchiveDeleteMetrics = [
    {
      label: 'SLA 死信删除待审',
      value: operations.sla_dead_letter_archive_delete_pending,
      helper: `已生效 ${operations.sla_dead_letter_archive_delete_applied} 个`,
    },
    {
      label: 'SLA 死信已批准',
      value: operations.sla_dead_letter_archive_delete_approved,
      helper: '等待或已完成删除',
    },
    {
      label: 'SLA 死信已拒绝',
      value: operations.sla_dead_letter_archive_delete_rejected,
      helper: '需要复核申请原因',
    },
    {
      label: 'SLA 死信闭环率',
      value: approvalClosureRate(
        operations.sla_dead_letter_archive_delete_applied + operations.sla_dead_letter_archive_delete_rejected,
        operations.sla_dead_letter_archive_delete_pending +
          operations.sla_dead_letter_archive_delete_applied +
          operations.sla_dead_letter_archive_delete_rejected,
      ),
      helper: '已生效或已拒绝占比',
    },
  ];
  const notificationTaskRecoveryArchiveDeleteMetrics = [
    {
      label: '自愈删除待审',
      value: operations.notification_task_recovery_audit_archive_delete_pending,
      helper: `已生效 ${operations.notification_task_recovery_audit_archive_delete_applied} 个`,
    },
    {
      label: '自愈已批准',
      value: operations.notification_task_recovery_audit_archive_delete_approved,
      helper: '等待或已完成删除',
    },
    {
      label: '自愈已拒绝',
      value: operations.notification_task_recovery_audit_archive_delete_rejected,
      helper: notificationTaskRecoveryArchiveDeleteRisk ? '需要复核申请原因' : '审批意见已留存',
    },
    {
      label: '自愈闭环率',
      value: approvalClosureRate(
        operations.notification_task_recovery_audit_archive_delete_applied +
          operations.notification_task_recovery_audit_archive_delete_rejected,
        operations.notification_task_recovery_audit_archive_delete_pending +
          operations.notification_task_recovery_audit_archive_delete_applied +
          operations.notification_task_recovery_audit_archive_delete_rejected,
      ),
      helper: `${operations.notification_task_recovery_audit_archive_delete_applied} 生效 / ${operations.notification_task_recovery_audit_archive_delete_rejected} 拒绝`,
    },
  ];
  const archiveMetrics = [
    {
      label: '失败/告警',
      value: auditRiskTotal,
      helper: `${operations.audit_failed_24h} 失败 / ${operations.audit_warning_24h} 告警`,
    },
    {
      label: 'Trace 覆盖',
      value: operations.audit_trace_count_24h,
      helper: '可追踪审批事件',
    },
    {
      label: '归档文件',
      value: operations.archive_count,
      helper: storageStatusLabel(operations.archive_storage_status),
    },
    {
      label: '归档容量',
      value: formatBytes(operations.archive_total_size_bytes),
      helper: '审批审计 CSV',
    },
  ];
  const notificationTaskMetrics = [
    {
      label: '通知任务',
      value: operations.notification_task_runs_24h,
      helper: '最近 24 小时执行',
    },
    {
      label: '失败/跳过',
      value: `${operations.notification_task_failed_24h}/${operations.notification_task_skipped_24h}`,
      helper: '失败 / 跳过',
    },
    {
      label: '失败率',
      value: `${operations.notification_task_failure_rate_24h}%`,
      helper: '失败与跳过占比',
    },
    {
      label: '连续失败',
      value: operations.notification_task_consecutive_failures,
      helper: operations.notification_task_consecutive_failures >= 2 ? '已触发风险' : '链路正常',
    },
    {
      label: 'SLA 失败来源',
      value: operations.notification_task_sla_dead_letter_failed_24h,
      helper: notificationTaskCategoryFailureTotal > 0 ? '死信归档删除覆盖' : '暂无分类失败',
    },
    {
      label: '自愈失败来源',
      value: operations.notification_task_recovery_archive_delete_failed_24h,
      helper: notificationTaskCategoryFailureTotal > 0 ? '自愈归档删除覆盖' : '暂无分类失败',
    },
  ];

  return (
    <Card className="min-w-0 overflow-hidden border-border/70 bg-background/85 shadow-sm backdrop-blur">
      <div className="border-b bg-muted/15 p-5">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge tone="ready">M82</StatusBadge>
              <StatusBadge tone={statusTone}>{statusLabel}</StatusBadge>
              <StatusBadge tone={archiveRisk ? 'degraded' : 'healthy'}>
                {storageStatusLabel(operations.archive_storage_status)}
              </StatusBadge>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <Archive className="size-4 text-muted-foreground" />
              <h2 className="text-lg font-semibold">审批与归档运营</h2>
            </div>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              聚合工具审批、通知策略审批、归档删除审批、通知任务自愈归档删除、审批审计事件和 MinIO 归档容量，帮助安全管理员快速处理待办与归档风险。
            </p>
          </div>
          <div className="grid min-w-[210px] gap-1 rounded-md border bg-background/70 p-3 text-sm">
            <span className="text-xs text-muted-foreground">运营待办</span>
            <span className="text-2xl font-semibold">{pendingTotal}</span>
            <span className="text-xs text-muted-foreground">工具 / 策略 / 归档删除合计</span>
          </div>
        </div>
      </div>

      {archiveRisk ? (
        <div className="mx-5 mt-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-700">
          归档存储暂不可用，当前看板已保留审批数据，归档文件数量和容量可能不是实时值。
        </div>
      ) : null}

      {notificationTaskCategoryFailureTotal > 0 ? (
        <div className="mx-5 mt-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-700">
          通知任务来源失败已进入运营告警闭环：SLA 死信 {operations.notification_task_sla_dead_letter_failed_24h} 条，
          自愈归档 {operations.notification_task_recovery_archive_delete_failed_24h} 条
          {notificationTaskMixedFailure ? '，当前为双来源失败。' : '。'}
        </div>
      ) : null}

      <div className="grid gap-4 p-5 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {approvalMetrics.map((metric) => (
            <OperationMetricTile
              helper={metric.helper}
              key={metric.label}
              label={metric.label}
              value={String(metric.value)}
            />
          ))}
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {archiveMetrics.map((metric) => (
            <OperationMetricTile
              helper={metric.helper}
              key={metric.label}
              label={metric.label}
              value={String(metric.value)}
            />
          ))}
        </div>
      </div>

      <div className="border-t bg-muted/10 p-5">
        <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-start">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge tone="ready">M98</StatusBadge>
              <StatusBadge tone={operations.sla_dead_letter_archive_delete_pending > 0 ? 'degraded' : 'healthy'}>
                {operations.sla_dead_letter_archive_delete_pending > 0 ? '存在待审' : '已闭环'}
              </StatusBadge>
            </div>
            <h3 className="mt-3 text-sm font-semibold">SLA 死信归档删除审批运营</h3>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">
              将 SLA 死信处置审计归档删除申请纳入安全中心运营看板，追踪待审、批准、拒绝和删除生效情况。
            </p>
          </div>
          <Button asChild type="button" variant="outline">
            <Link href="/security">
              <Archive className="size-4" />
              查看归档删除审批
            </Link>
          </Button>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {slaArchiveDeleteMetrics.map((metric) => (
            <OperationMetricTile
              helper={metric.helper}
              key={metric.label}
              label={metric.label}
              value={String(metric.value)}
            />
          ))}
        </div>
      </div>

      <div className="border-t bg-muted/10 p-5">
        <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-start">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge tone="ready">M108</StatusBadge>
              <StatusBadge
                tone={
                  notificationTaskRecoveryArchiveDeleteRisk
                    ? 'degraded'
                    : operations.notification_task_recovery_audit_archive_delete_pending > 0
                      ? 'planned'
                      : 'healthy'
                }
              >
                {notificationTaskRecoveryArchiveDeleteRisk
                  ? '拒绝复核'
                  : operations.notification_task_recovery_audit_archive_delete_pending > 0
                    ? '存在待审'
                    : '已闭环'}
              </StatusBadge>
            </div>
            <h3 className="mt-3 text-sm font-semibold">通知任务自愈归档删除审批运营</h3>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">
              将通知任务自愈闭环审计归档删除申请纳入安全中心运营看板，联动待审、拒绝风险、删除生效和运营告警闭环。
            </p>
          </div>
          <Button asChild type="button" variant="outline">
            <Link href="/security">
              <Archive className="size-4" />
              查看自愈归档审批
            </Link>
          </Button>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {notificationTaskRecoveryArchiveDeleteMetrics.map((metric) => (
            <OperationMetricTile
              helper={metric.helper}
              key={metric.label}
              label={metric.label}
              value={String(metric.value)}
            />
          ))}
        </div>
      </div>

      <div className="border-t bg-muted/10 p-5">
        <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-start">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge tone="ready">M102</StatusBadge>
              <StatusBadge tone={notificationTaskRisk ? 'degraded' : 'healthy'}>
                {notificationTaskRisk ? '通知任务风险' : '任务正常'}
              </StatusBadge>
            </div>
            <h3 className="mt-3 text-sm font-semibold">通知任务失败聚合</h3>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">
              聚合首发自动通知与失败自动重试任务的执行结果，连续失败或失败率偏高会进入运营告警闭环。
            </p>
          </div>
          <Button asChild type="button" variant="outline">
            <Link href="/security">
              <Activity className="size-4" />
              查看任务历史
            </Link>
          </Button>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {notificationTaskMetrics.map((metric) => (
            <OperationMetricTile
              helper={metric.helper}
              key={metric.label}
              label={metric.label}
              value={String(metric.value)}
            />
          ))}
        </div>

        <NotificationTaskRecoverySuggestionsCard
          actionResults={notificationTaskRecoveryActionResults}
          onAction={onNotificationTaskRecoveryAction}
          pendingAction={notificationTaskRecoveryPendingAction}
          pendingSuggestionId={notificationTaskRecoveryPendingSuggestionId}
          suggestions={operations.notification_task_recovery_suggestions}
          updating={notificationTaskRecoveryUpdating}
        />
      </div>

      <div className="border-t bg-muted/10 p-5">
        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge tone={operations.operational_alerts.length > 0 ? 'degraded' : 'healthy'}>
                M83 告警闭环
              </StatusBadge>
              <StatusBadge tone="planned">{operations.operational_alerts.length} 条告警</StatusBadge>
            </div>
            <h3 className="mt-3 text-sm font-semibold">运营告警闭环</h3>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              根据审批积压、归档删除、自愈归档删除、审计失败、Trace 覆盖和归档存储状态自动推导处理项。
            </p>
          </div>
          <Button asChild type="button" variant="outline">
            <Link href="/monitor">
              <Activity className="size-4" />
              查看监控告警
            </Link>
          </Button>
        </div>

        {operations.operational_alerts.length > 0 ? (
          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            {operations.operational_alerts.map((alert) => (
              <OperationAlertCard
                actionResult={actionResults[alert.id] ?? null}
                alert={alert}
                key={alert.id}
                notificationResult={notificationResults[alert.id] ?? null}
                notifying={notifying && notifyingAlertId === alert.id}
                onAction={onAction}
                onNotify={onNotify}
                pendingAction={pendingAction}
                updatingAction={updatingAction && pendingActionAlertId === alert.id}
              />
            ))}
          </div>
        ) : (
          <div className="mt-4">
            <EmptyState
              description="当前审批积压、归档存储、审批审计和 Trace 覆盖没有触发运营告警。"
              title="审批与归档运营平稳"
            />
          </div>
        )}
      </div>

      <div className="grid gap-4 border-t bg-muted/10 p-5 lg:grid-cols-[1fr_auto] lg:items-center">
        <div className="grid gap-2 text-sm text-muted-foreground md:grid-cols-2 xl:grid-cols-4">
          <div>
            <span className="font-medium text-foreground">工具审批：</span>
            已通过 {operations.tool_approved}，已拒绝 {operations.tool_rejected}
          </div>
          <div>
            <span className="font-medium text-foreground">归档删除：</span>
            已通过 {operations.archive_delete_approved}，已拒绝 {operations.archive_delete_rejected}
          </div>
          <div>
            <span className="font-medium text-foreground">自愈归档删除：</span>
            待审 {operations.notification_task_recovery_audit_archive_delete_pending}，拒绝{' '}
            {operations.notification_task_recovery_audit_archive_delete_rejected}，生效{' '}
            {operations.notification_task_recovery_audit_archive_delete_applied}
          </div>
          <div>
            <span className="font-medium text-foreground">审计质量：</span>
            {auditRiskTotal > 0 ? '存在失败或告警事件' : '最近 24 小时无失败告警'}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild type="button">
            <Link href="/approvals">
              <ClipboardCheck className="size-4" />
              处理审批
            </Link>
          </Button>
          <Button asChild type="button" variant="outline">
            <Link href="/approval-audits">
              <Archive className="size-4" />
              查看审批审计
            </Link>
          </Button>
          <Button asChild type="button" variant="outline">
            <Link href="/audit">
              <FileSearch className="size-4" />
              打开审计中心
            </Link>
          </Button>
        </div>
      </div>

      <OperationAlertNotificationAuditCard
        archiveError={notificationArchiveError}
        archiveLoading={notificationArchiveLoading}
        archiveMessage={notificationArchiveMessage}
        archives={notificationArchives}
        archiveSummary={notificationArchiveSummary}
        archiving={operationNotificationArchiving}
        approvingArchive={operationNotificationArchiveApproving}
        archiveApprovalNote={notificationArchiveApprovalNote}
        archiveApprovalOverview={notificationArchiveApprovalOverview}
        archiveApprovals={notificationArchiveApprovals}
        archiveApprovalsLoading={notificationArchiveApprovalsLoading}
        category={notificationCategory}
        deletingArchive={operationNotificationArchiveDeleting}
        downloadingArchive={operationNotificationDownloading}
        exportState={notificationExportState}
        keyword={notificationKeyword}
        loading={notificationAuditLoading}
        onArchiveApprove={onNotificationArchiveApprove}
        onArchiveCreate={onNotificationArchiveCreate}
        onArchiveDelete={onNotificationArchiveDelete}
        onArchiveDownload={onNotificationArchiveDownload}
        onArchiveNoteChange={onNotificationArchiveNoteChange}
        onArchiveReject={onNotificationArchiveReject}
        onArchiveRefresh={onNotificationArchiveRefresh}
        onArchiveApprovalRefresh={onNotificationArchiveApprovalRefresh}
        onCategoryChange={onNotificationCategoryChange}
        onExport={onNotificationExport}
        onKeywordChange={onNotificationKeywordChange}
        onRetry={onRetryNotification}
        onStatusChange={onNotificationStatusChange}
        overview={notificationAudit}
        rejectingArchive={operationNotificationArchiveRejecting}
        retrying={retryingNotification}
        retryingNotificationEventId={retryingNotificationEventId}
        status={notificationStatus}
      />

      <OperationAlertSlaCard
        loading={slaLoading}
        notificationLoading={slaNotificationLoading}
        notificationOverview={slaNotificationOverview}
        notificationRetryLoading={slaNotificationRetryLoading}
        notificationRetryOverview={slaNotificationRetryOverview}
        notificationRetryRunning={slaNotificationRetryRunning}
        notificationRunning={slaNotificationRunning}
        onNotifyOverdue={onNotifySlaOverdue}
        onRefresh={onRefreshSla}
        onRefreshNotification={onRefreshSlaNotification}
        onRefreshNotificationRetry={onRefreshSlaNotificationRetry}
        onRunEscalation={onRunSlaEscalation}
        onRunNotificationAutoRetry={onRunSlaNotificationAutoRetry}
        onRetryNotification={onRetrySlaNotification}
        overview={slaOverview}
        retryingNotification={retryingSlaNotification}
        retryingNotificationEventId={retryingSlaNotificationEventId}
        running={slaRunning}
        deadLetterLoading={slaDeadLetterLoading}
        deadLetterNote={slaDeadLetterNote}
        deadLetterOverview={slaDeadLetterOverview}
        deadLetterPendingAction={slaDeadLetterPendingAction}
        deadLetterPendingEventId={slaDeadLetterPendingEventId}
        deadLetterRunning={slaDeadLetterRunning}
        deadLetterAuditAction={slaDeadLetterAuditAction}
        deadLetterAuditKeyword={slaDeadLetterAuditKeyword}
        deadLetterAuditLoading={slaDeadLetterAuditLoading}
        deadLetterAuditPage={slaDeadLetterAuditPage}
        deadLetterAuditPageCount={slaDeadLetterAuditPageCount}
        deadLetterAuditResult={slaDeadLetterAuditResult}
        deadLetterAuditStatus={slaDeadLetterAuditStatus}
        deadLetterAuditExportState={slaDeadLetterAuditExportState}
        deadLetterAuditArchives={slaDeadLetterAuditArchives}
        deadLetterAuditArchiveError={slaDeadLetterAuditArchiveError}
        deadLetterAuditArchiveLoading={slaDeadLetterAuditArchiveLoading}
        deadLetterAuditArchiveMessage={slaDeadLetterAuditArchiveMessage}
        deadLetterAuditArchiveSummary={slaDeadLetterAuditArchiveSummary}
        deadLetterAuditCreatingArchive={slaDeadLetterAuditCreatingArchive}
        deadLetterAuditDownloadingArchive={slaDeadLetterAuditDownloadingArchive}
        deadLetterAuditDeletingArchive={slaDeadLetterAuditDeletingArchive}
        deadLetterAuditArchiveApproving={slaDeadLetterAuditArchiveApproving}
        deadLetterAuditArchiveRejecting={slaDeadLetterAuditArchiveRejecting}
        deadLetterAuditArchiveApprovalNote={slaDeadLetterAuditArchiveApprovalNote}
        deadLetterAuditArchiveApprovalOverview={slaDeadLetterAuditArchiveApprovalOverview}
        deadLetterAuditArchiveApprovals={slaDeadLetterAuditArchiveApprovals}
        deadLetterAuditArchiveApprovalsLoading={slaDeadLetterAuditArchiveApprovalsLoading}
        onDeadLetterNoteChange={onSlaDeadLetterNoteChange}
        onHandleDeadLetter={onHandleSlaDeadLetter}
        onRefreshDeadLetter={onRefreshSlaDeadLetter}
        onDeadLetterAuditActionChange={onSlaDeadLetterAuditActionChange}
        onDeadLetterAuditArchiveApprove={onSlaDeadLetterAuditArchiveApprove}
        onDeadLetterAuditArchiveCreate={onSlaDeadLetterAuditArchiveCreate}
        onDeadLetterAuditArchiveDelete={onSlaDeadLetterAuditArchiveDelete}
        onDeadLetterAuditArchiveDownload={onSlaDeadLetterAuditArchiveDownload}
        onDeadLetterAuditArchiveNoteChange={onSlaDeadLetterAuditArchiveNoteChange}
        onDeadLetterAuditArchiveReject={onSlaDeadLetterAuditArchiveReject}
        onDeadLetterAuditArchiveRefresh={onSlaDeadLetterAuditArchiveRefresh}
        onDeadLetterAuditArchiveApprovalRefresh={onSlaDeadLetterAuditArchiveApprovalRefresh}
        onDeadLetterAuditExport={onSlaDeadLetterAuditExport}
        onDeadLetterAuditKeywordChange={onSlaDeadLetterAuditKeywordChange}
        onDeadLetterAuditStatusChange={onSlaDeadLetterAuditStatusChange}
        onDeadLetterAuditPageChange={onSlaDeadLetterAuditPageChange}
        onRefreshDeadLetterAudit={onRefreshSlaDeadLetterAudit}
      />

      <OperationAlertNotificationTaskCard
        history={taskRunHistory}
        historyKeyword={taskRunHistoryKeyword}
        historyLoading={taskRunHistoryLoading}
        historyStatus={taskRunHistoryStatus}
        historyTask={taskRunHistoryTask}
        loading={taskLoading}
        recoveryAudit={taskRecoveryAudit}
        recoveryAuditAction={taskRecoveryAuditAction}
        recoveryAuditArchiveError={taskRecoveryAuditArchiveError}
        recoveryAuditArchiveLoading={taskRecoveryAuditArchiveLoading}
        recoveryAuditArchiveMessage={taskRecoveryAuditArchiveMessage}
        recoveryAuditArchives={taskRecoveryAuditArchives}
        recoveryAuditArchiveSummary={taskRecoveryAuditArchiveSummary}
        recoveryAuditCreatingArchive={taskRecoveryAuditCreatingArchive}
        recoveryAuditDeletingArchive={taskRecoveryAuditDeletingArchive}
        recoveryAuditDownloadingArchive={taskRecoveryAuditDownloadingArchive}
        recoveryAuditArchiveApproving={taskRecoveryAuditArchiveApproving}
        recoveryAuditArchiveRejecting={taskRecoveryAuditArchiveRejecting}
        recoveryAuditArchiveApprovalNote={taskRecoveryAuditArchiveApprovalNote}
        recoveryAuditArchiveApprovalOverview={taskRecoveryAuditArchiveApprovalOverview}
        recoveryAuditArchiveApprovals={taskRecoveryAuditArchiveApprovals}
        recoveryAuditArchiveApprovalsLoading={taskRecoveryAuditArchiveApprovalsLoading}
        recoveryAuditExportState={taskRecoveryAuditExportState}
        recoveryAuditFailureSource={taskRecoveryAuditFailureSource}
        recoveryAuditKeyword={taskRecoveryAuditKeyword}
        recoveryAuditLoading={taskRecoveryAuditLoading}
        recoveryAuditReason={taskRecoveryAuditReason}
        recoveryAuditStatus={taskRecoveryAuditStatus}
        onRefresh={onRefreshTask}
        onRefreshRecoveryAudit={onRefreshTaskRecoveryAudit}
        onRefreshHistory={onRefreshTaskRunHistory}
        onRunAutoNotify={onRunAutoNotify}
        onRunAutoRetry={onRunAutoRetry}
        onHistoryKeywordChange={onTaskRunHistoryKeywordChange}
        onHistoryStatusChange={onTaskRunHistoryStatusChange}
        onHistoryTaskChange={onTaskRunHistoryTaskChange}
        onRecoveryAuditActionChange={onTaskRecoveryAuditActionChange}
        onRecoveryAuditArchiveApprove={onTaskRecoveryAuditArchiveApprove}
        onRecoveryAuditArchiveCreate={onTaskRecoveryAuditArchiveCreate}
        onRecoveryAuditArchiveDelete={onTaskRecoveryAuditArchiveDelete}
        onRecoveryAuditArchiveDownload={onTaskRecoveryAuditArchiveDownload}
        onRecoveryAuditArchiveNoteChange={onTaskRecoveryAuditArchiveNoteChange}
        onRecoveryAuditArchiveReject={onTaskRecoveryAuditArchiveReject}
        onRecoveryAuditArchiveRefresh={onTaskRecoveryAuditArchiveRefresh}
        onRecoveryAuditArchiveApprovalRefresh={onTaskRecoveryAuditArchiveApprovalRefresh}
        onRecoveryAuditExport={onTaskRecoveryAuditExport}
        onRecoveryAuditFailureSourceChange={onTaskRecoveryAuditFailureSourceChange}
        onRecoveryAuditKeywordChange={onTaskRecoveryAuditKeywordChange}
        onRecoveryAuditReasonChange={onTaskRecoveryAuditReasonChange}
        onRecoveryAuditStatusChange={onTaskRecoveryAuditStatusChange}
        overview={taskOverview}
        running={taskAutoNotifyRunning || taskAutoRetryRunning}
        runningAutoNotify={taskAutoNotifyRunning}
        runningAutoRetry={taskAutoRetryRunning}
      />
    </Card>
  );
}

function OperationAlertCard({
  actionResult,
  alert,
  notificationResult,
  notifying,
  onAction,
  onNotify,
  pendingAction,
  updatingAction,
}: {
  actionResult: SecurityOperationAlertActionResult | null;
  alert: SecurityCenterOperationalAlert;
  notificationResult: SecurityOperationAlertNotificationResult | null;
  notifying: boolean;
  onAction: (alertId: string, action: SecurityOperationAlertAction) => void;
  onNotify: (alertId: string) => void;
  pendingAction: SecurityOperationAlertAction | null;
  updatingAction: boolean;
}) {
  const currentStatus = actionResult?.status ?? alert.status;
  const lastAction = actionResult?.last_action ?? alert.last_action;
  const lastNote = actionResult?.last_note ?? alert.last_note;
  const updatedAt = actionResult?.updated_at ?? alert.updated_at;
  const closed = currentStatus === 'CLOSED';
  const alertCategory = operationAlertCategory(alert.id);

  return (
    <div className="grid gap-3 rounded-lg border bg-background/75 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge tone={securityRiskTone(alert.severity)}>
              {securityRiskLevelLabel(alert.severity)}
            </StatusBadge>
            <StatusBadge tone={operationAlertStatusTone(currentStatus)}>
              {operationAlertStatusLabel(currentStatus)}
            </StatusBadge>
            <StatusBadge tone={operationAlertNotificationCategoryRisk(alertCategory) ? 'degraded' : 'planned'}>
              {operationAlertNotificationCategoryLabel(alertCategory)}
            </StatusBadge>
            <span className="text-xs text-muted-foreground">{alert.metric}</span>
          </div>
          <h4 className="mt-2 text-sm font-semibold">{alert.title}</h4>
          <p className="mt-1 line-clamp-2 text-sm leading-6 text-muted-foreground">{alert.description}</p>
          {lastAction ? (
            <div className="mt-2 text-xs text-muted-foreground">
              最近{securityOperationActionVerb(lastAction)}：{lastNote ?? '无备注'}
              {updatedAt ? ` · ${formatDateTime(updatedAt)}` : ''}
            </div>
          ) : null}
        </div>
        <Link className="group mt-1 inline-flex shrink-0 items-center text-muted-foreground" href={alert.href}>
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      {notificationResult ? (
        <div className="rounded-md border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge tone={notificationStatusTone(notificationResult.status)}>
              {notificationStatusLabel(notificationResult.status)}
            </StatusBadge>
            <span>{notificationResult.message}</span>
          </div>
          <div className="mt-1 flex flex-wrap gap-2">
            <span>渠道：{notificationResult.channels.map(notificationChannelLabel).join('、')}</span>
            <span>目标：{notificationResult.targets.join('、') || '未记录目标'}</span>
            <span>Webhook：{notificationResult.webhook_status ?? '未配置'}</span>
            <span>{formatDateTime(notificationResult.delivered_at)}</span>
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap justify-end gap-2">
        <Button asChild size="sm" type="button" variant="outline">
          <Link href={alert.href}>{alert.action_label}</Link>
        </Button>
        <LifecycleButton
          action="ACKNOWLEDGE"
          alert={alert}
          closed={closed}
          onAction={onAction}
          pendingAction={pendingAction}
          updatingAction={updatingAction}
        />
        <LifecycleButton
          action="ESCALATE"
          alert={alert}
          closed={closed}
          onAction={onAction}
          pendingAction={pendingAction}
          updatingAction={updatingAction}
        />
        <LifecycleButton
          action="CLOSE"
          alert={alert}
          closed={closed}
          onAction={onAction}
          pendingAction={pendingAction}
          updatingAction={updatingAction}
        />
        <Button disabled={notifying} onClick={() => onNotify(alert.id)} size="sm" type="button" variant="outline">
          {notifying ? '正在通知' : '通知'}
        </Button>
      </div>
    </div>
  );
}

function NotificationTaskRecoverySuggestionsCard({
  actionResults,
  onAction,
  pendingAction,
  pendingSuggestionId,
  suggestions,
  updating,
}: {
  actionResults: Record<string, SecurityOperationAlertNotificationTaskRecoveryActionResult>;
  onAction: (suggestionId: string, action: SecurityOperationAlertNotificationTaskRecoveryAction) => void;
  pendingAction: SecurityOperationAlertNotificationTaskRecoveryAction | null;
  pendingSuggestionId: string | null;
  suggestions: SecurityOperationAlertNotificationTaskRecoverySuggestion[];
  updating: boolean;
}) {
  const hasSuggestions = suggestions.length > 0;
  const openCount = suggestions.filter((suggestion) => {
    const status = actionResults[suggestion.id]?.status ?? suggestion.status;
    return status === 'OPEN' || status === 'ACKNOWLEDGED';
  }).length;

  return (
    <div className="mt-4 rounded-lg border bg-background/65 p-4 shadow-sm">
      <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-start">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge tone="ready">M104</StatusBadge>
            <StatusBadge tone={openCount > 0 ? 'degraded' : 'healthy'}>
              {openCount > 0 ? `${openCount} 条待闭环` : '已闭环'}
            </StatusBadge>
          </div>
          <h4 className="mt-3 text-sm font-semibold">通知任务自愈建议</h4>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">
            根据任务执行、投递审计、Webhook 配置和通知策略生成排障入口，并记录确认、忽略和处理闭环。
          </p>
        </div>
        <Button asChild size="sm" type="button" variant="outline">
          <Link href="/security">
            <Search className="size-4" />
            查看任务历史
          </Link>
        </Button>
      </div>

      {hasSuggestions ? (
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {suggestions.map((suggestion) => (
            <NotificationTaskRecoverySuggestionItem
              actionResult={actionResults[suggestion.id] ?? null}
              key={suggestion.id}
              onAction={onAction}
              pendingAction={pendingAction}
              suggestion={suggestion}
              updating={updating && pendingSuggestionId === suggestion.id}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          action={
            <Button asChild size="sm" type="button" variant="outline">
              <Link href="/security">查看任务历史</Link>
            </Button>
          }
          className="mt-4 rounded-md border bg-muted/15 p-6"
          description="最近任务执行、投递审计和通知策略没有形成明确排障建议。"
          title="暂无排障建议"
        />
      )}
    </div>
  );
}

function NotificationTaskRecoverySuggestionItem({
  actionResult,
  onAction,
  pendingAction,
  suggestion,
  updating,
}: {
  actionResult: SecurityOperationAlertNotificationTaskRecoveryActionResult | null;
  onAction: (suggestionId: string, action: SecurityOperationAlertNotificationTaskRecoveryAction) => void;
  pendingAction: SecurityOperationAlertNotificationTaskRecoveryAction | null;
  suggestion: SecurityOperationAlertNotificationTaskRecoverySuggestion;
  updating: boolean;
}) {
  const currentStatus = actionResult?.status ?? suggestion.status;
  const lastAction = actionResult?.last_action ?? suggestion.last_action;
  const lastNote = actionResult?.last_note ?? suggestion.last_note;
  const updatedAt = actionResult?.updated_at ?? suggestion.updated_at;
  const closed = currentStatus === 'IGNORED' || currentStatus === 'RESOLVED';

  return (
    <div className="grid gap-3 rounded-lg border bg-background/80 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge tone={securityRiskTone(suggestion.severity)}>{securityRiskLevelLabel(suggestion.severity)}</StatusBadge>
        <StatusBadge tone="planned">{notificationTaskRecoveryReasonLabel(suggestion.reason_code)}</StatusBadge>
        <StatusBadge tone={notificationTaskRecoveryFailureSourceTone(suggestion.failure_source)}>
          {notificationTaskRecoveryFailureSourceLabel(suggestion.failure_source)}
        </StatusBadge>
        <StatusBadge tone={notificationTaskRecoveryStatusTone(currentStatus)}>
          {notificationTaskRecoveryStatusLabel(currentStatus)}
        </StatusBadge>
      </div>
      <div>
        <h5 className="text-sm font-semibold">{suggestion.title}</h5>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">{suggestion.description}</p>
      </div>
      {lastAction ? (
        <div className="rounded-md border bg-muted/15 px-3 py-2 text-xs leading-5 text-muted-foreground">
          最近{notificationTaskRecoveryActionVerb(lastAction)}：{lastNote ?? '无备注'}
          {updatedAt ? ` · ${formatDateTime(updatedAt)}` : ''}
        </div>
      ) : null}
      <div className="rounded-md border bg-muted/20 px-3 py-2 text-xs leading-5 text-muted-foreground">
        证据：{suggestion.evidence}
        <div className="mt-1 flex flex-wrap gap-1">
          <StatusBadge tone={suggestion.sla_dead_letter_failed_count > 0 ? 'degraded' : 'planned'}>
            SLA 死信 {suggestion.sla_dead_letter_failed_count}
          </StatusBadge>
          <StatusBadge tone={suggestion.recovery_archive_delete_failed_count > 0 ? 'degraded' : 'planned'}>
            自愈归档 {suggestion.recovery_archive_delete_failed_count}
          </StatusBadge>
        </div>
      </div>
      <div className="flex flex-wrap justify-end gap-2">
        {suggestion.secondary_action_href && suggestion.secondary_action_label ? (
          <Button asChild size="sm" type="button" variant="outline">
            <Link href={suggestion.secondary_action_href}>{suggestion.secondary_action_label}</Link>
          </Button>
        ) : null}
        <Button asChild size="sm" type="button">
          <Link href={suggestion.primary_action_href}>{suggestion.primary_action_label}</Link>
        </Button>
      </div>
      <div className="flex flex-wrap justify-end gap-2 border-t pt-3">
        <NotificationTaskRecoveryActionButton
          action="ACKNOWLEDGE"
          closed={closed}
          onAction={onAction}
          pendingAction={pendingAction}
          suggestionId={suggestion.id}
          updating={updating}
        />
        <NotificationTaskRecoveryActionButton
          action="IGNORE"
          closed={closed}
          onAction={onAction}
          pendingAction={pendingAction}
          suggestionId={suggestion.id}
          updating={updating}
        />
        <NotificationTaskRecoveryActionButton
          action="RESOLVE"
          closed={closed}
          onAction={onAction}
          pendingAction={pendingAction}
          suggestionId={suggestion.id}
          updating={updating}
        />
      </div>
    </div>
  );
}

function NotificationTaskRecoveryActionButton({
  action,
  closed,
  onAction,
  pendingAction,
  suggestionId,
  updating,
}: {
  action: SecurityOperationAlertNotificationTaskRecoveryAction;
  closed: boolean;
  onAction: (suggestionId: string, action: SecurityOperationAlertNotificationTaskRecoveryAction) => void;
  pendingAction: SecurityOperationAlertNotificationTaskRecoveryAction | null;
  suggestionId: string;
  updating: boolean;
}) {
  const pending = updating && pendingAction === action;

  return (
    <Button
      disabled={closed || updating}
      onClick={() => onAction(suggestionId, action)}
      size="sm"
      type="button"
      variant={action === 'RESOLVE' ? 'default' : 'outline'}
    >
      {pending ? '处理中' : notificationTaskRecoveryActionVerb(action)}
    </Button>
  );
}

function LifecycleButton({
  action,
  alert,
  closed,
  onAction,
  pendingAction,
  updatingAction,
}: {
  action: SecurityOperationAlertAction;
  alert: SecurityCenterOperationalAlert;
  closed: boolean;
  onAction: (alertId: string, action: SecurityOperationAlertAction) => void;
  pendingAction: SecurityOperationAlertAction | null;
  updatingAction: boolean;
}) {
  const pending = updatingAction && pendingAction === action;

  return (
    <Button
      disabled={closed || updatingAction}
      onClick={() => onAction(alert.id, action)}
      size="sm"
      type="button"
      variant="outline"
    >
      {pending ? '处理中' : securityOperationActionVerb(action)}
    </Button>
  );
}

function OperationAlertNotificationAuditCard({
  archiveError,
  archiveLoading,
  archiveMessage,
  archiveApprovalNote,
  archiveApprovalOverview,
  archiveApprovals,
  archiveApprovalsLoading,
  archives,
  archiveSummary,
  archiving,
  approvingArchive,
  category,
  deletingArchive,
  downloadingArchive,
  exportState,
  keyword,
  loading,
  onArchiveApprove,
  onArchiveCreate,
  onArchiveDelete,
  onArchiveDownload,
  onArchiveNoteChange,
  onArchiveReject,
  onArchiveRefresh,
  onArchiveApprovalRefresh,
  onCategoryChange,
  onExport,
  onKeywordChange,
  onRetry,
  onStatusChange,
  overview,
  rejectingArchive,
  retrying,
  retryingNotificationEventId,
  status,
}: {
  archiveError: string | null;
  archiveLoading: boolean;
  archiveMessage: string | null;
  archiveApprovalNote: string;
  archiveApprovalOverview: SecurityOperationAlertNotificationArchiveApprovalOverview | null;
  archiveApprovals: SecurityOperationAlertNotificationArchiveApprovalItem[];
  archiveApprovalsLoading: boolean;
  archives: SecurityOperationAlertNotificationArchiveItem[];
  archiveSummary: { archive_count: number; total_size_bytes: number } | null;
  archiving: boolean;
  approvingArchive: boolean;
  category: string;
  deletingArchive: boolean;
  downloadingArchive: boolean;
  exportState: 'idle' | 'exporting' | 'success' | 'error';
  keyword: string;
  loading: boolean;
  onArchiveApprove: (approvalId: string) => void;
  onArchiveCreate: () => void;
  onArchiveDelete: (archive: SecurityOperationAlertNotificationArchiveItem) => void;
  onArchiveDownload: (archive: SecurityOperationAlertNotificationArchiveItem) => void;
  onArchiveNoteChange: (note: string) => void;
  onArchiveReject: (approvalId: string) => void;
  onArchiveRefresh: () => void;
  onArchiveApprovalRefresh: () => void;
  onCategoryChange: (category: string) => void;
  onExport: () => void;
  onKeywordChange: (keyword: string) => void;
  onRetry: (notificationEventId: string) => void;
  onStatusChange: (status: SecurityOperationAlertNotificationStatus | '') => void;
  overview: SecurityOperationAlertNotificationOverview | null;
  rejectingArchive: boolean;
  retrying: boolean;
  retryingNotificationEventId: string | null;
  status: SecurityOperationAlertNotificationStatus | '';
}) {
  const items = overview?.items ?? [];
  const exporting = exportState === 'exporting';
  const sourceRiskCount = items.filter((item) => operationAlertNotificationCategoryRisk(item.alert_category)).length;
  const failedOrPartialCount = items.filter((item) => item.status === 'FAILED' || item.status === 'PARTIAL').length;
  const hasFilters = Boolean(status || category || keyword);
  const hasTaskRecoveryArchiveDeleteNotification = items.some(
    (item) => item.alert_category === 'NOTIFICATION_TASK_RECOVERY_AUDIT_ARCHIVE_DELETE',
  );
  const [selectedArchiveApprovalId, setSelectedArchiveApprovalId] = useState<string | null>(null);
  const [archiveApprovalKeyword, setArchiveApprovalKeyword] = useState('');
  const [archiveApprovalStatus, setArchiveApprovalStatus] = useState<
    SecurityOperationAlertNotificationArchiveApprovalItem['status'] | ''
  >('');
  const [archiveApprovalPendingOnly, setArchiveApprovalPendingOnly] = useState(false);
  const pendingArchiveApprovals = archiveApprovals.filter((approval) => approval.status === 'PENDING');
  const filteredArchiveApprovals = useMemo(() => {
    const normalizedKeyword = archiveApprovalKeyword.trim().toLowerCase();
    return archiveApprovals
      .filter((approval) => !archiveApprovalPendingOnly || approval.status === 'PENDING')
      .filter((approval) => !archiveApprovalStatus || approval.status === archiveApprovalStatus)
      .filter((approval) => {
        if (!normalizedKeyword) return true;
        return [
          approval.id,
          approval.archive_id,
          approval.archive_key,
          approval.archive_file_name,
          approval.reason,
          approval.requested_by?.name,
          approval.requested_by?.email,
          approval.reviewed_by?.name,
          approval.reviewed_by?.email,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(normalizedKeyword));
      });
  }, [archiveApprovalKeyword, archiveApprovalPendingOnly, archiveApprovalStatus, archiveApprovals]);
  const selectedArchiveApproval = selectedArchiveApprovalId
    ? filteredArchiveApprovals.find((approval) => approval.id === selectedArchiveApprovalId) ??
      archiveApprovals.find((approval) => approval.id === selectedArchiveApprovalId) ??
      null
    : filteredArchiveApprovals[0] ?? null;
  const activeArchiveApprovalId = selectedArchiveApproval?.id ?? null;
  const archiveApprovalDetailQuery = useQuery({
    enabled: Boolean(activeArchiveApprovalId),
    queryKey: ['security-operation-alert-notification-archive-approval', activeArchiveApprovalId],
    queryFn: () => getSecurityOperationAlertNotificationArchiveApproval(activeArchiveApprovalId ?? ''),
  });
  const hasArchiveApprovalFilters = Boolean(archiveApprovalKeyword || archiveApprovalStatus || archiveApprovalPendingOnly);

  useEffect(() => {
    if (selectedArchiveApprovalId && !archiveApprovals.some((approval) => approval.id === selectedArchiveApprovalId)) {
      setSelectedArchiveApprovalId(null);
    }
  }, [archiveApprovals, selectedArchiveApprovalId]);

  useEffect(() => {
    if (
      selectedArchiveApprovalId &&
      filteredArchiveApprovals.length > 0 &&
      !filteredArchiveApprovals.some((approval) => approval.id === selectedArchiveApprovalId)
    ) {
      setSelectedArchiveApprovalId(filteredArchiveApprovals[0]?.id ?? null);
    }
  }, [filteredArchiveApprovals, selectedArchiveApprovalId]);

  const handleArchiveDelete = (archive: SecurityOperationAlertNotificationArchiveItem) => {
    const confirmed = window.confirm(`确认申请删除归档 ${archive.file_name}？该操作需要审批后生效。`);
    if (confirmed) {
      onArchiveDelete(archive);
    }
  };

  const resetArchiveApprovalFilters = () => {
    setArchiveApprovalKeyword('');
    setArchiveApprovalStatus('');
    setArchiveApprovalPendingOnly(false);
  };

  const exportFilteredArchiveApprovals = () => {
    const header = ['审批ID', '状态', '归档文件', '对象路径', '大小', '申请人', '申请时间', '审批人', '审批时间', '审批意见'];
    const rows = filteredArchiveApprovals.map((approval) => [
      approval.id,
      archiveApprovalStatusLabel(approval.status),
      approval.archive_file_name,
      approval.archive_key,
      String(approval.archive_size_bytes),
      approval.requested_by?.name ?? '系统',
      approval.requested_at,
      approval.reviewed_by?.name ?? '',
      approval.reviewed_at ?? '',
      approval.reason ?? '',
    ]);
    const csv = [header, ...rows].map((row) => row.map(csvCell).join(',')).join('\n');
    downloadBlob(new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8' }), `通知审计归档删除审批-${new Date().toISOString().slice(0, 10)}.csv`);
  };

  return (
    <div className="border-t bg-muted/10 p-5">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge tone="ready">M86 投递审计</StatusBadge>
            <StatusBadge tone={overview && overview.summary.retryable_count > 0 ? 'degraded' : 'healthy'}>
              {overview?.summary.retryable_count ?? 0} 条可重试
            </StatusBadge>
            <StatusBadge tone={items.some((item) => operationAlertNotificationCategoryRisk(item.alert_category)) ? 'degraded' : 'planned'}>
              M99/M102/M109 风险通知
            </StatusBadge>
            {hasTaskRecoveryArchiveDeleteNotification ? (
              <StatusBadge tone="degraded">M109 自愈归档通知</StatusBadge>
            ) : null}
            <StatusBadge tone="ready">M115 审计检索</StatusBadge>
          </div>
          <h3 className="mt-3 text-sm font-semibold">通知投递审计</h3>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            查询审批与归档告警通知投递记录，按来源分类筛选并导出或归档当前审计结果。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button disabled={loading || exporting || items.length === 0} onClick={onExport} type="button" variant="outline">
            <Download className="size-4" />
            {exporting ? '正在导出' : '导出 CSV'}
          </Button>
          <Button disabled={loading || archiving || items.length === 0} onClick={onArchiveCreate} type="button" variant="outline">
            <Archive className="size-4" />
            {archiving ? '归档中' : '创建归档'}
          </Button>
        </div>
      </div>

      {exportState === 'success' ? (
        <div className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          当前筛选条件下的通知投递审计已导出。
        </div>
      ) : exportState === 'error' ? (
        <div className="mt-4 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          通知投递审计导出失败，请稍后重试。
        </div>
      ) : null}

      {archiveMessage ? (
        <div className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {archiveMessage}
        </div>
      ) : archiveError ? (
        <div className="mt-4 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {archiveError}
        </div>
      ) : null}

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard helper="当前筛选结果" label="投递记录" value={`${overview?.summary.total_count ?? 0}`} />
        <MetricCard helper="失败或部分成功" label="可重试" value={`${overview?.summary.retryable_count ?? 0}`} />
        <MetricCard helper="来源型风险通知" label="来源风险" value={`${sourceRiskCount}`} />
        <MetricCard helper="FAILED / PARTIAL" label="失败或部分" value={`${failedOrPartialCount}`} />
      </div>

      <div className="mt-4 grid gap-3 xl:grid-cols-[150px_240px_1fr_auto]">
        <select
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          onChange={(event) => onStatusChange(event.target.value as SecurityOperationAlertNotificationStatus | '')}
          value={status}
        >
          <option value="">全部状态</option>
          <option value="SENT">已投递</option>
          <option value="PARTIAL">部分成功</option>
          <option value="SKIPPED">已跳过</option>
          <option value="FAILED">投递失败</option>
        </select>
        <select
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          onChange={(event) => onCategoryChange(event.target.value)}
          value={category}
        >
          <option value="">全部来源</option>
          <option value="NOTIFICATION_TASK">通知任务风险</option>
          <option value="SLA_DEAD_LETTER_ARCHIVE_DELETE">SLA 死信归档删除</option>
          <option value="NOTIFICATION_TASK_RECOVERY_AUDIT_ARCHIVE_DELETE">自愈归档删除</option>
          <option value="NOTIFICATION_TASK_MIXED_FAILURE_SOURCE">双来源失败</option>
          <option value="ARCHIVE_OPERATION">归档运营</option>
          <option value="NOTIFICATION_POLICY">通知策略</option>
          <option value="RUNTIME_APPROVAL">运行时审批</option>
          <option value="SECURITY_OPERATION">安全运营</option>
        </select>
        <Input
          onChange={(event) => onKeywordChange(event.target.value)}
          placeholder="搜索告警、分类、Webhook 错误、request_id、trace_id"
          value={keyword}
        />
        <Button
          disabled={!hasFilters}
          onClick={() => {
            onStatusChange('');
            onCategoryChange('');
            onKeywordChange('');
          }}
          type="button"
          variant="outline"
        >
          清空筛选
        </Button>
      </div>

      {loading ? (
        <div className="mt-4 rounded-md border bg-background/70 p-4 text-sm text-muted-foreground">
          正在加载通知投递审计...
        </div>
      ) : items.length === 0 ? (
        <div className="mt-4">
          <EmptyState description="触发运营告警通知后，这里会展示投递状态、渠道和重试链路。" title="暂无通知投递记录" />
        </div>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-md border">
          <table className="w-full min-w-[900px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                {['状态', '告警', '渠道', 'Webhook', '重试', '投递时间', '操作'].map((column) => (
                  <th className="px-4 py-3 font-medium text-muted-foreground" key={column}>
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.slice(0, 8).map((item) => {
                const retryable = item.status === 'FAILED' || item.status === 'PARTIAL';
                const pending = retrying && retryingNotificationEventId === item.notification_event_id;

                return (
                  <tr className="border-b last:border-0" key={item.notification_event_id}>
                    <td className="px-4 py-3">
                      <StatusBadge tone={notificationStatusTone(item.status)}>
                        {notificationStatusLabel(item.status)}
                      </StatusBadge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{shortId(item.alert_id)}</div>
                      <div className="text-xs text-muted-foreground">{item.message}</div>
                      {item.alert_category ? (
                        <div className="mt-1">
                          <StatusBadge tone={operationAlertNotificationCategoryRisk(item.alert_category) ? 'degraded' : 'planned'}>
                            {operationAlertNotificationCategoryLabel(item.alert_category)}
                          </StatusBadge>
                        </div>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      <div>{item.channels.map(notificationChannelLabel).join('、') || '-'}</div>
                      <div className="mt-1 text-xs">{item.targets.join('、') || '未记录目标'}</div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {item.webhook_status ?? '未配置'}
                      {item.webhook_error ? <div className="line-clamp-1 text-xs text-destructive">{item.webhook_error}</div> : null}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{item.retry_count}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      <div>{formatDateTime(item.delivered_at)}</div>
                      <div className="mt-1 max-w-[180px] truncate text-xs">{item.request_id ?? '无 request_id'}</div>
                      <div className="mt-1 max-w-[180px] truncate text-xs">{item.trace_id ?? '无 trace_id'}</div>
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        disabled={!retryable || pending}
                        onClick={() => onRetry(item.notification_event_id)}
                        size="sm"
                        type="button"
                        variant="outline"
                      >
                        {pending ? '重试中' : '重试'}
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-4 rounded-md border bg-background/70 p-4">
        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge tone="ready">通知归档</StatusBadge>
              <StatusBadge tone={(archiveSummary?.archive_count ?? 0) > 0 ? 'healthy' : 'planned'}>
                {archiveSummary?.archive_count ?? 0} 个归档
              </StatusBadge>
              <StatusBadge tone={(archiveApprovalOverview?.pending_count ?? 0) > 0 ? 'degraded' : 'healthy'}>
                M116 删除审批
              </StatusBadge>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              当前筛选结果可以归档为 CSV，归档总容量 {formatBytes(archiveSummary?.total_size_bytes ?? 0)}；归档删除需要审批后生效。
            </p>
          </div>
          <Button disabled={archiveLoading} onClick={onArchiveRefresh} type="button" variant="outline">
            <RefreshCw className={`size-4 ${archiveLoading ? 'animate-spin' : ''}`} />
            刷新归档
          </Button>
        </div>
        {archiveLoading ? (
          <div className="mt-4 text-sm text-muted-foreground">正在加载通知审计归档...</div>
        ) : archives.length === 0 ? (
          <EmptyState className="mt-4 rounded-md border bg-muted/15 p-5" description="创建归档后，CSV 文件会出现在这里。" title="暂无通知审计归档" />
        ) : (
          <div className="mt-4 grid gap-2">
            {archives.map((archive) => (
              <div className="flex flex-col justify-between gap-3 rounded-md border bg-muted/10 p-3 md:flex-row md:items-center" key={archive.id}>
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{archive.file_name}</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {formatBytes(archive.size_bytes)} · {formatDateTime(archive.last_modified ?? '')}
                  </div>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <Button disabled={downloadingArchive} onClick={() => onArchiveDownload(archive)} size="sm" type="button" variant="outline">
                    <Download className="size-4" />
                    下载
                  </Button>
                  <Button disabled={deletingArchive} onClick={() => handleArchiveDelete(archive)} size="sm" type="button" variant="outline">
                    <Trash2 className="size-4" />
                    {deletingArchive ? '提交中' : '申请删除'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 rounded-md border bg-background/75 p-4">
          <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-start">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge tone="ready">M116</StatusBadge>
                <StatusBadge tone={pendingArchiveApprovals.length > 0 ? 'degraded' : 'planned'}>
                  {pendingArchiveApprovals.length > 0 ? `${pendingArchiveApprovals.length} 个待审批` : '删除审批'}
                </StatusBadge>
              </div>
              <h4 className="mt-3 text-sm font-semibold">通知归档删除审批</h4>
              <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">
                删除申请写入平台事件审计；审批通过会立即删除对象存储文件，拒绝会保留通知审计归档。
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button disabled={archiveApprovalsLoading} onClick={onArchiveApprovalRefresh} type="button" variant="outline">
                <RefreshCw className={`size-4 ${archiveApprovalsLoading ? 'animate-spin' : ''}`} />
                刷新审批
              </Button>
              <Button disabled={archiveApprovalsLoading || filteredArchiveApprovals.length === 0} onClick={exportFilteredArchiveApprovals} type="button" variant="outline">
                <Download className="size-4" />
                导出当前筛选
              </Button>
            </div>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <ArchiveMetric helper="等待处理" label="待审批" value={`${archiveApprovalOverview?.pending_count ?? 0}`} />
            <ArchiveMetric helper="已通过申请" label="已批准" value={`${archiveApprovalOverview?.approved_count ?? 0}`} />
            <ArchiveMetric helper="申请被拒绝" label="已拒绝" value={`${archiveApprovalOverview?.rejected_count ?? 0}`} />
            <ArchiveMetric helper="对象已删除" label="已生效" value={`${archiveApprovalOverview?.applied_count ?? 0}`} />
          </div>

          <div className="mt-4 grid gap-2 lg:grid-cols-[1fr_150px_auto_auto]">
            <label className="flex h-9 min-w-0 items-center gap-2 rounded-md border bg-background/70 px-3 text-sm">
              <Search className="size-4 shrink-0 text-muted-foreground" />
              <input
                className="min-w-0 flex-1 bg-transparent outline-none"
                onChange={(event) => setArchiveApprovalKeyword(event.target.value)}
                placeholder="搜索审批 ID、文件名、对象路径、申请人、意见"
                value={archiveApprovalKeyword}
              />
            </label>
            <select
              className="h-9 rounded-md border bg-background/80 px-3 text-sm"
              onChange={(event) => setArchiveApprovalStatus(event.target.value as SecurityOperationAlertNotificationArchiveApprovalItem['status'] | '')}
              value={archiveApprovalStatus}
            >
              <option value="">全部状态</option>
              <option value="PENDING">待审批</option>
              <option value="APPROVED">已批准</option>
              <option value="REJECTED">已拒绝</option>
              <option value="APPLIED">已生效</option>
            </select>
            <Button
              onClick={() => setArchiveApprovalPendingOnly((current) => !current)}
              type="button"
              variant={archiveApprovalPendingOnly ? 'default' : 'outline'}
            >
              只看待审批
            </Button>
            <Button disabled={!hasArchiveApprovalFilters} onClick={resetArchiveApprovalFilters} type="button" variant="outline">
              清空筛选
            </Button>
          </div>

          {archiveApprovalsLoading ? (
            <div className="mt-4 rounded-md border bg-muted/20 p-5 text-sm text-muted-foreground">正在加载通知归档删除审批...</div>
          ) : filteredArchiveApprovals.length === 0 ? (
            <EmptyState
              className="mt-4 rounded-md border bg-slate-50/60 p-5"
              description="提交通知审计归档删除申请后，审批记录会出现在这里。"
              title="暂无通知归档删除审批"
            />
          ) : (
            <div className="mt-4 grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
              <div className="overflow-x-auto rounded-md border">
                <table className="w-full min-w-[720px] border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b bg-muted/40">
                      {['状态', '归档文件', '申请人', '申请时间', '审批人', '操作'].map((column) => (
                        <th className="px-3 py-2 font-medium text-muted-foreground" key={column}>{column}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredArchiveApprovals.map((approval) => (
                      <OperationAlertNotificationArchiveApprovalRow
                        active={approval.id === activeArchiveApprovalId}
                        approval={approval}
                        key={approval.id}
                        onSelect={setSelectedArchiveApprovalId}
                      />
                    ))}
                  </tbody>
                </table>
              </div>

              <OperationAlertNotificationArchiveApprovalDetailPanel
                approvalNote={archiveApprovalNote}
                approving={approvingArchive}
                detail={archiveApprovalDetailQuery.data ?? null}
                fallbackApproval={selectedArchiveApproval}
                loading={archiveApprovalDetailQuery.isLoading || archiveApprovalDetailQuery.isFetching}
                onApprove={onArchiveApprove}
                onNoteChange={onArchiveNoteChange}
                onReject={onArchiveReject}
                rejecting={rejectingArchive}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function OperationAlertNotificationArchiveApprovalRow({
  active,
  approval,
  onSelect,
}: {
  active: boolean;
  approval: SecurityOperationAlertNotificationArchiveApprovalItem;
  onSelect: (approvalId: string) => void;
}) {
  return (
    <tr className={`border-b last:border-0 ${active ? 'bg-blue-50/50' : ''}`}>
      <td className="px-3 py-2">
        <StatusBadge tone={archiveApprovalStatusTone(approval.status)}>{archiveApprovalStatusLabel(approval.status)}</StatusBadge>
        <div className="mt-1 font-mono text-xs text-muted-foreground">{shortId(approval.id)}</div>
      </td>
      <td className="px-3 py-2">
        <div className="font-medium">{approval.archive_file_name}</div>
        <div className="mt-1 truncate font-mono text-xs text-muted-foreground">{approval.archive_key}</div>
      </td>
      <td className="px-3 py-2 text-muted-foreground">{approval.requested_by?.name ?? '系统'}</td>
      <td className="px-3 py-2 text-muted-foreground">{formatDateTime(approval.requested_at)}</td>
      <td className="px-3 py-2 text-muted-foreground">
        {approval.reviewed_by?.name ?? '未审批'}
        {approval.reviewed_at ? <div className="mt-1 text-xs">{formatDateTime(approval.reviewed_at)}</div> : null}
      </td>
      <td className="px-3 py-2">
        <Button onClick={() => onSelect(approval.id)} size="sm" type="button" variant="outline">
          {active ? '当前详情' : '查看详情'}
        </Button>
      </td>
    </tr>
  );
}

function OperationAlertNotificationArchiveApprovalDetailPanel({
  approvalNote,
  approving,
  detail,
  fallbackApproval,
  loading,
  onApprove,
  onNoteChange,
  onReject,
  rejecting,
}: {
  approvalNote: string;
  approving: boolean;
  detail: SecurityOperationAlertNotificationArchiveApprovalDetail | null;
  fallbackApproval: SecurityOperationAlertNotificationArchiveApprovalItem | null;
  loading: boolean;
  onApprove: (approvalId: string) => void;
  onNoteChange: (note: string) => void;
  onReject: (approvalId: string) => void;
  rejecting: boolean;
}) {
  const current = detail ?? fallbackApproval;
  const pending = current?.status === 'PENDING';

  return (
    <div className="rounded-md border bg-background/75 p-4">
      <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-start">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge tone="ready">审批详情</StatusBadge>
            {current ? (
              <StatusBadge tone={archiveApprovalStatusTone(current.status)}>
                {archiveApprovalStatusLabel(current.status)}
              </StatusBadge>
            ) : null}
          </div>
          <h5 className="mt-3 text-sm font-semibold">详情与审计时间线</h5>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            查看通知审计归档删除从申请、审批到生效的完整事件链路，并可通过请求 ID 和 Trace ID 跳转定位。
          </p>
        </div>
        {current ? (
          <div className="rounded-md border bg-background/80 px-3 py-2 text-xs text-muted-foreground">
            审批 ID：<span className="font-mono">{shortId(current.id)}</span>
          </div>
        ) : null}
      </div>

      {loading ? (
        <div className="mt-4 rounded-md border bg-muted/20 p-5 text-sm text-muted-foreground">正在加载审批详情...</div>
      ) : !current ? (
        <EmptyState
          className="mt-4 rounded-md border bg-slate-50/60 p-5"
          description="选择一条通知归档删除审批后，这里会展示审批详情和事件时间线。"
          title="暂无审批详情"
        />
      ) : (
        <div className="mt-4 grid gap-4">
          <div className="grid gap-2 text-sm md:grid-cols-2">
            <SummaryTile label="归档文件" value={current.archive_file_name} />
            <SummaryTile label="归档大小" value={formatBytes(current.archive_size_bytes)} />
            <SummaryTile label="对象路径" value={current.archive_key} />
            <SummaryTile label="申请人" value={current.requested_by?.name ?? '系统'} />
            <SummaryTile label="申请时间" value={formatDateTime(current.requested_at)} />
            <SummaryTile label="审批人" value={current.reviewed_by?.name ?? '未审批'} />
            <SummaryTile label="审批时间" value={formatDateTime(current.reviewed_at ?? '')} />
            <SummaryTile label="审批意见" value={current.reason ?? '未填写'} />
          </div>

          {pending ? (
            <div className="rounded-md border bg-muted/20 p-3">
              <label className="text-xs font-medium text-muted-foreground">审批意见</label>
              <Input
                className="mt-2"
                onChange={(event) => onNoteChange(event.target.value)}
                placeholder="填写批准或拒绝理由"
                value={approvalNote}
              />
              <div className="mt-3 flex flex-wrap gap-2">
                <Button disabled={approving || rejecting} onClick={() => onApprove(current.id)} size="sm" type="button" variant="outline">
                  {approving ? '批准中' : '批准删除'}
                </Button>
                <Button disabled={approving || rejecting} onClick={() => onReject(current.id)} size="sm" type="button" variant="outline">
                  {rejecting ? '拒绝中' : '拒绝'}
                </Button>
              </div>
            </div>
          ) : null}

          <div className="rounded-md border bg-background/70 p-3">
            <div className="mb-3 flex items-center justify-between gap-3">
              <span className="text-sm font-semibold">事件时间线</span>
              <StatusBadge tone={(detail?.audit_timeline.length ?? 0) > 0 ? 'mock' : 'planned'}>
                {detail?.audit_timeline.length ?? 0} 条事件
              </StatusBadge>
            </div>
            {!detail ? (
              <div className="rounded-md border bg-muted/20 p-4 text-sm text-muted-foreground">
                详情加载后会显示申请、审批、拒绝或删除生效事件。
              </div>
            ) : detail.audit_timeline.length === 0 ? (
              <EmptyState
                className="rounded-md border bg-slate-50/60 p-5"
                description="当前审批还没有可展示的事件时间线。"
                title="暂无时间线事件"
              />
            ) : (
              <div className="grid gap-3">
                {detail.audit_timeline.map((event) => (
                  <OperationAlertNotificationArchiveApprovalTimelineRow event={event} key={event.event_id} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function OperationAlertNotificationArchiveApprovalTimelineRow({
  event,
}: {
  event: SecurityOperationAlertNotificationArchiveApprovalTimelineItem;
}) {
  return (
    <div className="rounded-md border bg-background/75 p-3">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge tone={archiveApprovalEventTone(event.event_type)}>
              {archiveApprovalEventLabel(event.event_type)}
            </StatusBadge>
            <StatusBadge tone={archiveApprovalEventStatusTone(event.status)}>{event.status}</StatusBadge>
            <span className="font-mono text-xs text-muted-foreground">{shortId(event.event_id)}</span>
          </div>
          <div className="mt-2 truncate text-sm font-medium">{event.title}</div>
          {event.note ? <div className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">备注：{event.note}</div> : null}
        </div>
        <div className="shrink-0 text-xs text-muted-foreground md:text-right">
          <div>{formatDateTime(event.occurred_at)}</div>
          <div className="mt-1">{event.actor?.name ?? '系统'}</div>
        </div>
      </div>
      <div className="mt-3 grid gap-2 text-xs text-muted-foreground md:grid-cols-2">
        <div className="truncate">request_id：{event.request_id ?? '无'}</div>
        <div className="truncate">trace_id：{event.trace_id ?? '无'}</div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {event.request_id ? (
          <Button asChild size="sm" type="button" variant="outline">
            <Link href={`/audit?keyword=${encodeURIComponent(event.request_id)}`}>审计</Link>
          </Button>
        ) : null}
        {event.trace_id ? (
          <Button asChild size="sm" type="button" variant="outline">
            <Link href={`/monitor?keyword=${encodeURIComponent(event.trace_id)}`}>链路</Link>
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function OperationAlertNotificationTaskCard({
  history,
  historyKeyword,
  historyLoading,
  historyStatus,
  historyTask,
  loading,
  recoveryAudit,
  recoveryAuditAction,
  recoveryAuditArchiveError,
  recoveryAuditArchiveLoading,
  recoveryAuditArchiveMessage,
  recoveryAuditArchives,
  recoveryAuditArchiveSummary,
  recoveryAuditCreatingArchive,
  recoveryAuditDeletingArchive,
  recoveryAuditDownloadingArchive,
  recoveryAuditArchiveApproving,
  recoveryAuditArchiveRejecting,
  recoveryAuditArchiveApprovalNote,
  recoveryAuditArchiveApprovalOverview,
  recoveryAuditArchiveApprovals,
  recoveryAuditArchiveApprovalsLoading,
  recoveryAuditExportState,
  recoveryAuditFailureSource,
  recoveryAuditKeyword,
  recoveryAuditLoading,
  recoveryAuditReason,
  recoveryAuditStatus,
  onHistoryKeywordChange,
  onHistoryStatusChange,
  onHistoryTaskChange,
  onRefresh,
  onRefreshRecoveryAudit,
  onRefreshHistory,
  onRecoveryAuditActionChange,
  onRecoveryAuditArchiveApprove,
  onRecoveryAuditArchiveCreate,
  onRecoveryAuditArchiveDelete,
  onRecoveryAuditArchiveDownload,
  onRecoveryAuditArchiveNoteChange,
  onRecoveryAuditArchiveReject,
  onRecoveryAuditArchiveRefresh,
  onRecoveryAuditArchiveApprovalRefresh,
  onRecoveryAuditExport,
  onRecoveryAuditFailureSourceChange,
  onRecoveryAuditKeywordChange,
  onRecoveryAuditReasonChange,
  onRecoveryAuditStatusChange,
  onRunAutoNotify,
  onRunAutoRetry,
  overview,
  running,
  runningAutoNotify,
  runningAutoRetry,
}: {
  history: SecurityOperationAlertNotificationTaskRunOverview | null;
  historyKeyword: string;
  historyLoading: boolean;
  historyStatus: SecurityOperationAlertNotificationTaskRunResult['status'] | '';
  historyTask: SecurityOperationAlertNotificationTaskName | '';
  loading: boolean;
  recoveryAudit: SecurityOperationAlertNotificationTaskRecoveryAuditOverview | null;
  recoveryAuditAction: SecurityOperationAlertNotificationTaskRecoveryAction | '';
  recoveryAuditArchiveError: string | null;
  recoveryAuditArchiveLoading: boolean;
  recoveryAuditArchiveMessage: string | null;
  recoveryAuditArchives: SecurityOperationAlertNotificationTaskRecoveryAuditArchiveItem[];
  recoveryAuditArchiveSummary: { archive_count: number; total_size_bytes: number } | null;
  recoveryAuditCreatingArchive: boolean;
  recoveryAuditDeletingArchive: boolean;
  recoveryAuditDownloadingArchive: boolean;
  recoveryAuditArchiveApproving: boolean;
  recoveryAuditArchiveRejecting: boolean;
  recoveryAuditArchiveApprovalNote: string;
  recoveryAuditArchiveApprovalOverview: SecurityOperationAlertNotificationTaskRecoveryAuditArchiveApprovalOverview | null;
  recoveryAuditArchiveApprovals: SecurityOperationAlertNotificationTaskRecoveryAuditArchiveApprovalItem[];
  recoveryAuditArchiveApprovalsLoading: boolean;
  recoveryAuditExportState: 'idle' | 'exporting' | 'success' | 'error';
  recoveryAuditFailureSource: SecurityOperationAlertNotificationTaskRecoveryFailureSource | '';
  recoveryAuditKeyword: string;
  recoveryAuditLoading: boolean;
  recoveryAuditReason: SecurityOperationAlertNotificationTaskRecoverySuggestion['reason_code'] | '';
  recoveryAuditStatus: SecurityOperationAlertNotificationTaskRecoveryStatus | '';
  onHistoryKeywordChange: (keyword: string) => void;
  onHistoryStatusChange: (status: SecurityOperationAlertNotificationTaskRunResult['status'] | '') => void;
  onHistoryTaskChange: (task: SecurityOperationAlertNotificationTaskName | '') => void;
  onRefresh: () => void;
  onRefreshRecoveryAudit: () => void;
  onRefreshHistory: () => void;
  onRecoveryAuditActionChange: (action: SecurityOperationAlertNotificationTaskRecoveryAction | '') => void;
  onRecoveryAuditArchiveApprove: (approvalId: string) => void;
  onRecoveryAuditArchiveCreate: () => void;
  onRecoveryAuditArchiveDelete: (archive: SecurityOperationAlertNotificationTaskRecoveryAuditArchiveItem) => void;
  onRecoveryAuditArchiveDownload: (archive: SecurityOperationAlertNotificationTaskRecoveryAuditArchiveItem) => void;
  onRecoveryAuditArchiveNoteChange: (note: string) => void;
  onRecoveryAuditArchiveReject: (approvalId: string) => void;
  onRecoveryAuditArchiveRefresh: () => void;
  onRecoveryAuditArchiveApprovalRefresh: () => void;
  onRecoveryAuditExport: () => void;
  onRecoveryAuditFailureSourceChange: (source: SecurityOperationAlertNotificationTaskRecoveryFailureSource | '') => void;
  onRecoveryAuditKeywordChange: (keyword: string) => void;
  onRecoveryAuditReasonChange: (reason: SecurityOperationAlertNotificationTaskRecoverySuggestion['reason_code'] | '') => void;
  onRecoveryAuditStatusChange: (status: SecurityOperationAlertNotificationTaskRecoveryStatus | '') => void;
  onRunAutoNotify: () => void;
  onRunAutoRetry: () => void;
  overview: SecurityOperationAlertNotificationTaskOverview | null;
  running: boolean;
  runningAutoNotify: boolean;
  runningAutoRetry: boolean;
}) {
  const summary = overview?.summary;
  const policy = overview?.policy;
  const hasNotifyWork = (summary?.pending_auto_notify_count ?? 0) > 0;
  const hasRetryWork = (summary?.pending_auto_retry_count ?? 0) > 0;
  const notifyMetrics = [
    { label: '待自动通知', value: `${summary?.pending_auto_notify_count ?? 0}`, helper: 'SLA 死信 / 自愈归档删除' },
    { label: '已自动覆盖', value: `${summary?.auto_notified_count ?? 0}`, helper: '回看窗口内已通知告警' },
    { label: '最早待通知', value: formatDateTime(summary?.oldest_auto_notify_at ?? ''), helper: '按触发时间优先' },
  ];
  const retryMetrics = [
    { label: '待自动重试', value: `${summary?.pending_auto_retry_count ?? 0}`, helper: '满足退避与次数限制' },
    { label: '失败投递', value: `${summary?.failed_notification_count ?? 0}`, helper: '最近投递失败' },
    { label: '部分成功', value: `${summary?.partial_notification_count ?? 0}`, helper: '站内或外部部分成功' },
    { label: '已重试', value: `${summary?.retried_notification_count ?? 0}`, helper: '已有重试链路' },
  ];

  return (
    <div className="border-t bg-muted/10 p-5">
      <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-start">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge tone="ready">M100 自动通知</StatusBadge>
            <StatusBadge tone="ready">M110 自愈归档</StatusBadge>
            <StatusBadge tone="ready">M87 自动重试</StatusBadge>
            <StatusBadge tone={overview?.scheduler_enabled ? 'healthy' : 'planned'}>
              {overview?.scheduler_enabled ? '任务已启用' : '任务未启用'}
            </StatusBadge>
            <StatusBadge tone={overview?.running || running ? 'loading' : 'mock'}>
              {overview?.running || running ? '执行中' : '空闲'}
            </StatusBadge>
          </div>
          <h3 className="mt-3 text-sm font-semibold">通知任务中心</h3>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">
            对 SLA 死信归档删除与通知任务自愈归档删除审批运营告警执行首发自动通知，并继续扫描失败或部分成功的投递做自动重试。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button disabled={loading} onClick={onRefresh} type="button" variant="outline">
            <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} />
            刷新任务
          </Button>
          <Button disabled={loading || running} onClick={onRunAutoNotify} type="button">
            <RefreshCw className={`size-4 ${runningAutoNotify ? 'animate-spin' : ''}`} />
            {runningAutoNotify ? '通知中' : '立即自动通知'}
          </Button>
          <Button disabled={loading || running} onClick={onRunAutoRetry} type="button" variant="outline">
            <RefreshCw className={`size-4 ${runningAutoRetry ? 'animate-spin' : ''}`} />
            {runningAutoRetry ? '扫描中' : '立即扫描重试'}
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="mt-4 rounded-md border bg-background/70 p-4 text-sm text-muted-foreground">
          正在加载通知任务...
        </div>
      ) : (
        <div className="mt-4 grid gap-4">
          <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
            <Card className="border-border/70 p-4 shadow-none">
              <div className="mb-3 text-sm font-semibold">调度状态</div>
              <div className="grid gap-2 text-sm">
                <SummaryTile label="任务开关" value={overview?.scheduler_enabled ? '已启用' : '未启用'} />
                <SummaryTile label="运行状态" value={overview?.running || running ? '执行中' : '空闲'} />
                <SummaryTile label="最近扫描" value={formatDateTime(overview?.last_tick_at ?? '')} />
                <SummaryTile label="扫描间隔" value={overview?.next_tick_after_seconds ? `${overview.next_tick_after_seconds} 秒` : '未配置'} />
              </div>
            </Card>

            <Card className="border-border/70 p-4 shadow-none">
              <div className="mb-3 text-sm font-semibold">当前策略</div>
              <div className="grid gap-2 text-sm md:grid-cols-2">
                <SummaryTile label="首发通知" value={policy?.auto_notify_enabled ? '已启用' : '未启用'} />
                <SummaryTile label="通知单批" value={`${policy?.auto_notify_batch_size ?? 0}`} />
                <SummaryTile label="重试任务" value={policy?.auto_retry_enabled ? '已启用' : '未启用'} />
                <SummaryTile label="重试单批" value={`${policy?.retry_batch_size ?? 0}`} />
                <SummaryTile label="最大重试" value={`${policy?.max_retry_count ?? 0} 次`} />
                <SummaryTile label="退避时间" value={`${policy?.retry_backoff_seconds ?? 0} 秒`} />
                <SummaryTile label="回看窗口" value={`${policy?.lookback_hours ?? 0} 小时`} />
                <SummaryTile label="策略来源" value={notificationTaskPolicySourceLabel(policy?.source)} />
              </div>
            </Card>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <Card className="border-border/70 p-4 shadow-none">
              <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge tone="ready">M100 首发通知</StatusBadge>
                    <StatusBadge tone={policy?.auto_notify_enabled ? 'healthy' : 'planned'}>
                      {policy?.auto_notify_enabled ? '已启用' : '未启用'}
                    </StatusBadge>
                  </div>
                  <h4 className="mt-3 text-sm font-semibold">归档删除审批告警首发通知</h4>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    扫描待审或拒绝风险类 SLA 死信归档删除、自愈归档删除运营告警，跳过回看窗口内已有通知的告警。
                  </p>
                </div>
                <Button disabled={loading || running} onClick={onRunAutoNotify} size="sm" type="button">
                  <RefreshCw className={`size-4 ${runningAutoNotify ? 'animate-spin' : ''}`} />
                  {runningAutoNotify ? '通知中' : '立即通知'}
                </Button>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                {notifyMetrics.map((metric) => (
                  <MetricCard helper={metric.helper} key={metric.label} label={metric.label} value={metric.value} />
                ))}
              </div>
              {!hasNotifyWork ? (
                <div className="mt-4">
                  <EmptyState
                    description="当前没有尚未首发通知的 SLA 死信或自愈归档删除审批运营告警。"
                    title="暂无待自动通知项"
                  />
                </div>
              ) : null}
              <div className="mt-4">
                <OperationAlertNotificationTaskResult result={overview?.last_auto_notify_result ?? null} />
              </div>
            </Card>

            <Card className="border-border/70 p-4 shadow-none">
              <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge tone="ready">M87 失败重试</StatusBadge>
                    <StatusBadge tone={policy?.auto_retry_enabled ? 'healthy' : 'planned'}>
                      {policy?.auto_retry_enabled ? '已启用' : '未启用'}
                    </StatusBadge>
                  </div>
                  <h4 className="mt-3 text-sm font-semibold">失败与部分成功投递自动重试</h4>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    对失败或部分成功的运营告警通知执行退避重试，超过最大次数后保留审计线索。
                  </p>
                </div>
                <Button disabled={loading || running} onClick={onRunAutoRetry} size="sm" type="button" variant="outline">
                  <RefreshCw className={`size-4 ${runningAutoRetry ? 'animate-spin' : ''}`} />
                  {runningAutoRetry ? '扫描中' : '立即重试'}
                </Button>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {retryMetrics.map((metric) => (
                  <MetricCard helper={metric.helper} key={metric.label} label={metric.label} value={metric.value} />
                ))}
              </div>
              {!hasRetryWork ? (
                <div className="mt-4">
                  <EmptyState
                    description="当前没有达到退避时间且未超过最大重试次数的审批与归档告警通知投递。"
                    title="暂无待自动重试项"
                  />
                </div>
              ) : null}
              <div className="mt-4">
                <OperationAlertNotificationTaskResult result={overview?.last_auto_retry_result ?? null} />
              </div>
            </Card>
          </div>

          <OperationAlertNotificationTaskRunHistoryCard
            history={history}
            keyword={historyKeyword}
            loading={historyLoading}
            onKeywordChange={onHistoryKeywordChange}
            onRefresh={onRefreshHistory}
            onStatusChange={onHistoryStatusChange}
            onTaskChange={onHistoryTaskChange}
            status={historyStatus}
            task={historyTask}
          />

          <OperationAlertNotificationTaskRecoveryAuditCard
            action={recoveryAuditAction}
            archiveError={recoveryAuditArchiveError}
            archiveLoading={recoveryAuditArchiveLoading}
            archiveMessage={recoveryAuditArchiveMessage}
            archives={recoveryAuditArchives}
            archiveSummary={recoveryAuditArchiveSummary}
            archiveApprovalNote={recoveryAuditArchiveApprovalNote}
            archiveApprovalOverview={recoveryAuditArchiveApprovalOverview}
            archiveApprovals={recoveryAuditArchiveApprovals}
            archiveApprovalsLoading={recoveryAuditArchiveApprovalsLoading}
            audit={recoveryAudit}
            approvingArchive={recoveryAuditArchiveApproving}
            creatingArchive={recoveryAuditCreatingArchive}
            deletingArchive={recoveryAuditDeletingArchive}
            downloadingArchive={recoveryAuditDownloadingArchive}
            exportState={recoveryAuditExportState}
            failureSource={recoveryAuditFailureSource}
            keyword={recoveryAuditKeyword}
            loading={recoveryAuditLoading}
            onActionChange={onRecoveryAuditActionChange}
            onArchiveApprove={onRecoveryAuditArchiveApprove}
            onArchiveCreate={onRecoveryAuditArchiveCreate}
            onArchiveDelete={onRecoveryAuditArchiveDelete}
            onArchiveDownload={onRecoveryAuditArchiveDownload}
            onArchiveNoteChange={onRecoveryAuditArchiveNoteChange}
            onArchiveReject={onRecoveryAuditArchiveReject}
            onArchiveRefresh={onRecoveryAuditArchiveRefresh}
            onArchiveApprovalRefresh={onRecoveryAuditArchiveApprovalRefresh}
            onExport={onRecoveryAuditExport}
            onFailureSourceChange={onRecoveryAuditFailureSourceChange}
            onKeywordChange={onRecoveryAuditKeywordChange}
            onReasonChange={onRecoveryAuditReasonChange}
            onRefresh={onRefreshRecoveryAudit}
            rejectingArchive={recoveryAuditArchiveRejecting}
            onStatusChange={onRecoveryAuditStatusChange}
            reason={recoveryAuditReason}
            status={recoveryAuditStatus}
          />
        </div>
      )}
    </div>
  );
}

function OperationAlertNotificationTaskRunHistoryCard({
  history,
  keyword,
  loading,
  onKeywordChange,
  onRefresh,
  onStatusChange,
  onTaskChange,
  status,
  task,
}: {
  history: SecurityOperationAlertNotificationTaskRunOverview | null;
  keyword: string;
  loading: boolean;
  onKeywordChange: (keyword: string) => void;
  onRefresh: () => void;
  onStatusChange: (status: SecurityOperationAlertNotificationTaskRunResult['status'] | '') => void;
  onTaskChange: (task: SecurityOperationAlertNotificationTaskName | '') => void;
  status: SecurityOperationAlertNotificationTaskRunResult['status'] | '';
  task: SecurityOperationAlertNotificationTaskName | '';
}) {
  const summary = history?.summary;
  const metrics = [
    { label: '执行记录', value: `${summary?.total_count ?? 0}`, helper: '最近 100 条任务事件' },
    { label: '成功执行', value: `${summary?.success_count ?? 0}`, helper: 'SUCCESS' },
    { label: '失败执行', value: `${summary?.failed_count ?? 0}`, helper: 'FAILED' },
    { label: '手动触发', value: `${summary?.manual_count ?? 0}`, helper: `调度 ${summary?.scheduled_count ?? 0} 次` },
    { label: '首发通知', value: `${summary?.auto_notify_count ?? 0}`, helper: `重试 ${summary?.auto_retry_count ?? 0} 次` },
    { label: 'SLA 覆盖', value: `${summary?.sla_dead_letter_notify_count ?? 0}`, helper: '死信归档删除' },
    { label: '自愈覆盖', value: `${summary?.recovery_archive_delete_notify_count ?? 0}`, helper: '自愈归档删除' },
    { label: '最近完成', value: formatDateTime(summary?.latest_finished_at ?? ''), helper: '任务完成时间' },
  ];

  return (
    <Card className="border-border/70 p-4 shadow-none">
      <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-start">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge tone="ready">M101 执行历史</StatusBadge>
            <StatusBadge tone="ready">M111 分类覆盖</StatusBadge>
            <StatusBadge tone={(summary?.failed_count ?? 0) > 0 ? 'degraded' : 'healthy'}>
              {(summary?.failed_count ?? 0) > 0 ? '存在失败' : '历史正常'}
            </StatusBadge>
          </div>
          <h4 className="mt-3 text-sm font-semibold">任务执行历史与审计检索</h4>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            从平台事件投影自动通知与自动重试任务执行记录，区分 SLA 死信归档删除与自愈归档删除覆盖数量，并保留 request_id 和 trace_id 便于审计追踪。
          </p>
        </div>
        <Button disabled={loading} onClick={onRefresh} type="button" variant="outline">
          <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} />
          刷新历史
        </Button>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <MetricCard helper={metric.helper} key={metric.label} label={metric.label} value={metric.value} />
        ))}
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-[180px_180px_1fr_auto]">
        <select
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          onChange={(event) => onTaskChange(event.target.value as SecurityOperationAlertNotificationTaskName | '')}
          value={task}
        >
          <option value="">全部任务</option>
          <option value="AUTO_NOTIFY">首发自动通知</option>
          <option value="AUTO_RETRY">失败自动重试</option>
        </select>
        <select
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          onChange={(event) => onStatusChange(event.target.value as SecurityOperationAlertNotificationTaskRunResult['status'] | '')}
          value={status}
        >
          <option value="">全部状态</option>
          <option value="SUCCESS">成功</option>
          <option value="FAILED">失败</option>
          <option value="SKIPPED">跳过</option>
        </select>
        <Input
          onChange={(event) => onKeywordChange(event.target.value)}
          placeholder="搜索 event_id / request_id / trace_id / 错误信息"
          value={keyword}
        />
        <Button
          disabled={!keyword && !task && !status}
          onClick={() => {
            onKeywordChange('');
            onTaskChange('');
            onStatusChange('');
          }}
          type="button"
          variant="outline"
        >
          清空筛选
        </Button>
      </div>

      {loading ? (
        <div className="mt-4 rounded-md border bg-background/70 p-4 text-sm text-muted-foreground">
          正在加载任务执行历史...
        </div>
      ) : !history || history.items.length === 0 ? (
        <div className="mt-4">
          <EmptyState description="当前筛选条件下没有通知任务执行记录。" title="暂无执行历史" />
        </div>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-md border bg-background/70">
          <table className="min-w-[980px] divide-y divide-border text-sm">
            <thead className="bg-muted/40 text-left text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">任务</th>
                <th className="px-4 py-3 font-medium">触发</th>
                <th className="px-4 py-3 font-medium">状态</th>
                <th className="px-4 py-3 font-medium">扫描 / 通知 / 重试</th>
                <th className="px-4 py-3 font-medium">成功 / 失败 / 跳过</th>
                <th className="px-4 py-3 font-medium">请求 / 链路</th>
                <th className="px-4 py-3 font-medium">完成时间</th>
                <th className="px-4 py-3 font-medium">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {history.items.map((item) => (
                <OperationAlertNotificationTaskRunRow item={item} key={item.event_id} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

function OperationAlertNotificationTaskRunRow({ item }: { item: SecurityOperationAlertNotificationTaskRunItem }) {
  return (
    <tr className="align-top">
      <td className="px-4 py-3">
        <div className="font-medium">{notificationTaskNameLabel(item.task)}</div>
        <div className="mt-1 text-xs text-muted-foreground">{item.event_id.slice(0, 8)}</div>
      </td>
      <td className="px-4 py-3">
        <StatusBadge tone={item.trigger_type === 'MANUAL' ? 'ready' : 'mock'}>{taskTriggerLabel(item.trigger_type)}</StatusBadge>
      </td>
      <td className="px-4 py-3">
        <StatusBadge tone={taskRunTone(item.status)}>{taskRunLabel(item.status)}</StatusBadge>
        {item.error_message ? <div className="mt-1 line-clamp-2 text-xs text-destructive">{item.error_message}</div> : null}
      </td>
      <td className="px-4 py-3 text-muted-foreground">
        <div>{item.scanned_count} / {item.notified_count} / {item.retried_count}</div>
        <div className="mt-1 flex flex-wrap gap-1 text-xs">
          <StatusBadge tone={item.sla_dead_letter_notify_count > 0 ? 'degraded' : 'planned'}>
            SLA {item.sla_dead_letter_notify_count}
          </StatusBadge>
          <StatusBadge tone={item.recovery_archive_delete_notify_count > 0 ? 'degraded' : 'planned'}>
            自愈 {item.recovery_archive_delete_notify_count}
          </StatusBadge>
        </div>
      </td>
      <td className="px-4 py-3 text-muted-foreground">
        {item.success_count} / {item.failed_count} / {item.skipped_count}
      </td>
      <td className="px-4 py-3 text-muted-foreground">
        <div className="max-w-[220px] truncate">{item.request_id ?? '无 request_id'}</div>
        <div className="mt-1 max-w-[220px] truncate text-xs">{item.trace_id ?? '无 trace_id'}</div>
      </td>
      <td className="px-4 py-3 text-muted-foreground">
        <div>{formatDateTime(item.finished_at)}</div>
        <div className="mt-1 text-xs">{formatDuration(item.duration_ms)}</div>
      </td>
      <td className="px-4 py-3">
        <div className="flex flex-wrap gap-2">
          {item.request_id ? (
            <Button asChild size="sm" type="button" variant="outline">
              <Link href={`/audit?keyword=${encodeURIComponent(item.request_id)}`}>审计</Link>
            </Button>
          ) : null}
          {item.trace_id ? (
            <Button asChild size="sm" type="button" variant="outline">
              <Link href={`/monitor?keyword=${encodeURIComponent(item.trace_id)}`}>链路</Link>
            </Button>
          ) : null}
        </div>
      </td>
    </tr>
  );
}

function OperationAlertNotificationTaskRecoveryAuditCard({
  action,
  archiveError,
  archiveLoading,
  archiveMessage,
  archives,
  archiveSummary,
  archiveApprovalNote,
  archiveApprovalOverview,
  archiveApprovals,
  archiveApprovalsLoading,
  audit,
  approvingArchive,
  creatingArchive,
  deletingArchive,
  downloadingArchive,
  exportState,
  failureSource,
  keyword,
  loading,
  onActionChange,
  onArchiveApprove,
  onArchiveCreate,
  onArchiveDelete,
  onArchiveDownload,
  onArchiveNoteChange,
  onArchiveReject,
  onArchiveRefresh,
  onArchiveApprovalRefresh,
  onExport,
  onFailureSourceChange,
  onKeywordChange,
  onReasonChange,
  onRefresh,
  rejectingArchive,
  onStatusChange,
  reason,
  status,
}: {
  action: SecurityOperationAlertNotificationTaskRecoveryAction | '';
  archiveError: string | null;
  archiveLoading: boolean;
  archiveMessage: string | null;
  archives: SecurityOperationAlertNotificationTaskRecoveryAuditArchiveItem[];
  archiveSummary: { archive_count: number; total_size_bytes: number } | null;
  archiveApprovalNote: string;
  archiveApprovalOverview: SecurityOperationAlertNotificationTaskRecoveryAuditArchiveApprovalOverview | null;
  archiveApprovals: SecurityOperationAlertNotificationTaskRecoveryAuditArchiveApprovalItem[];
  archiveApprovalsLoading: boolean;
  audit: SecurityOperationAlertNotificationTaskRecoveryAuditOverview | null;
  approvingArchive: boolean;
  creatingArchive: boolean;
  deletingArchive: boolean;
  downloadingArchive: boolean;
  exportState: 'idle' | 'exporting' | 'success' | 'error';
  failureSource: SecurityOperationAlertNotificationTaskRecoveryFailureSource | '';
  keyword: string;
  loading: boolean;
  onActionChange: (action: SecurityOperationAlertNotificationTaskRecoveryAction | '') => void;
  onArchiveApprove: (approvalId: string) => void;
  onArchiveCreate: () => void;
  onArchiveDelete: (archive: SecurityOperationAlertNotificationTaskRecoveryAuditArchiveItem) => void;
  onArchiveDownload: (archive: SecurityOperationAlertNotificationTaskRecoveryAuditArchiveItem) => void;
  onArchiveNoteChange: (note: string) => void;
  onArchiveReject: (approvalId: string) => void;
  onArchiveRefresh: () => void;
  onArchiveApprovalRefresh: () => void;
  onExport: () => void;
  onFailureSourceChange: (source: SecurityOperationAlertNotificationTaskRecoveryFailureSource | '') => void;
  onKeywordChange: (keyword: string) => void;
  onReasonChange: (reason: SecurityOperationAlertNotificationTaskRecoverySuggestion['reason_code'] | '') => void;
  onRefresh: () => void;
  rejectingArchive: boolean;
  onStatusChange: (status: SecurityOperationAlertNotificationTaskRecoveryStatus | '') => void;
  reason: SecurityOperationAlertNotificationTaskRecoverySuggestion['reason_code'] | '';
  status: SecurityOperationAlertNotificationTaskRecoveryStatus | '';
}) {
  const summary = audit?.summary;
  const metrics = [
    { label: '闭环记录', value: `${summary?.total_count ?? 0}`, helper: '最近 100 条处理事件' },
    { label: '已确认', value: `${summary?.acknowledged_count ?? 0}`, helper: 'ACKNOWLEDGE' },
    { label: '已忽略', value: `${summary?.ignored_count ?? 0}`, helper: 'IGNORE' },
    { label: '已处理', value: `${summary?.resolved_count ?? 0}`, helper: 'RESOLVE' },
    {
      label: 'SLA 来源',
      value: `${summary?.sla_dead_letter_source_count ?? 0}`,
      helper: `混合 ${summary?.mixed_source_count ?? 0}`,
    },
    {
      label: '自愈来源',
      value: `${summary?.recovery_archive_delete_source_count ?? 0}`,
      helper: `未知 ${summary?.unknown_source_count ?? 0}`,
    },
    { label: '最近处理', value: formatDateTime(summary?.latest_action_at ?? ''), helper: '处理时间' },
  ];
  const hasFilters = Boolean(action || status || reason || failureSource || keyword);
  const exporting = exportState === 'exporting';

  return (
    <Card className="border-border/70 p-4 shadow-none">
      <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-start">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge tone="ready">M105 闭环审计</StatusBadge>
            <StatusBadge tone={(summary?.total_count ?? 0) > 0 ? 'healthy' : 'planned'}>
              {(summary?.total_count ?? 0) > 0 ? `${summary?.total_count ?? 0} 条记录` : '暂无记录'}
            </StatusBadge>
          </div>
          <h4 className="mt-3 text-sm font-semibold">自愈闭环审计检索</h4>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            检索通知任务自愈建议的确认、忽略和已处理事件，联动审计中心与 Trace 链路定位处理上下文。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button disabled={loading || exporting || (summary?.total_count ?? 0) === 0} onClick={onExport} type="button" variant="outline">
            <Download className="size-4" />
            {exporting ? '正在导出' : '导出 CSV'}
          </Button>
          <Button disabled={loading} onClick={onRefresh} type="button" variant="outline">
            <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} />
            刷新审计
          </Button>
        </div>
      </div>

      {exportState === 'success' ? (
        <div className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          当前筛选条件下的通知任务自愈闭环审计已导出。
        </div>
      ) : exportState === 'error' ? (
        <div className="mt-4 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          通知任务自愈闭环审计导出失败，请稍后重试。
        </div>
      ) : null}

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <MetricCard helper={metric.helper} key={metric.label} label={metric.label} value={metric.value} />
        ))}
      </div>

      <div className="mt-4 grid gap-3 xl:grid-cols-[140px_140px_180px_190px_1fr_auto]">
        <select
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          onChange={(event) => onActionChange(event.target.value as SecurityOperationAlertNotificationTaskRecoveryAction | '')}
          value={action}
        >
          <option value="">全部动作</option>
          <option value="ACKNOWLEDGE">确认</option>
          <option value="IGNORE">忽略</option>
          <option value="RESOLVE">标记已处理</option>
        </select>
        <select
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          onChange={(event) => onStatusChange(event.target.value as SecurityOperationAlertNotificationTaskRecoveryStatus | '')}
          value={status}
        >
          <option value="">全部状态</option>
          <option value="ACKNOWLEDGED">已确认</option>
          <option value="IGNORED">已忽略</option>
          <option value="RESOLVED">已处理</option>
        </select>
        <select
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          onChange={(event) => onReasonChange(event.target.value as SecurityOperationAlertNotificationTaskRecoverySuggestion['reason_code'] | '')}
          value={reason}
        >
          <option value="">全部原因</option>
          <option value="WEBHOOK_NOT_CONFIGURED">Webhook 未配置</option>
          <option value="WEBHOOK_DELIVERY_FAILED">Webhook 投递失败</option>
          <option value="AUTO_NOTIFY_DISABLED">自动通知关闭</option>
          <option value="AUTO_RETRY_DISABLED">自动重试关闭</option>
          <option value="CONSECUTIVE_FAILURES">连续失败</option>
          <option value="HIGH_FAILURE_RATE">失败率偏高</option>
        </select>
        <select
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          onChange={(event) => onFailureSourceChange(event.target.value as SecurityOperationAlertNotificationTaskRecoveryFailureSource | '')}
          value={failureSource}
        >
          <option value="">全部来源</option>
          <option value="SLA_DEAD_LETTER_ARCHIVE_DELETE">SLA 死信归档</option>
          <option value="NOTIFICATION_TASK_RECOVERY_AUDIT_ARCHIVE_DELETE">自愈归档删除</option>
          <option value="MIXED">混合来源</option>
          <option value="UNKNOWN">未知来源</option>
        </select>
        <Input
          onChange={(event) => onKeywordChange(event.target.value)}
          placeholder="搜索建议、来源、备注、request_id、trace_id"
          value={keyword}
        />
        <Button
          disabled={!hasFilters}
          onClick={() => {
            onActionChange('');
            onStatusChange('');
            onReasonChange('');
            onFailureSourceChange('');
            onKeywordChange('');
          }}
          type="button"
          variant="outline"
        >
          清空筛选
        </Button>
      </div>

      {loading ? (
        <div className="mt-4 rounded-md border bg-background/70 p-4 text-sm text-muted-foreground">
          正在加载自愈闭环审计...
        </div>
      ) : !audit || audit.items.length === 0 ? (
        <div className="mt-4">
          <EmptyState description="当前筛选条件下没有通知任务自愈闭环记录。" title="暂无闭环审计记录" />
        </div>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-md border bg-background/70">
          <table className="min-w-[1080px] divide-y divide-border text-sm">
            <thead className="bg-muted/40 text-left text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">建议</th>
                <th className="px-4 py-3 font-medium">原因 / 风险</th>
                <th className="px-4 py-3 font-medium">动作 / 状态</th>
                <th className="px-4 py-3 font-medium">备注</th>
                <th className="px-4 py-3 font-medium">请求 / 链路</th>
                <th className="px-4 py-3 font-medium">处理时间</th>
                <th className="px-4 py-3 font-medium">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {audit.items.map((item) => (
                <OperationAlertNotificationTaskRecoveryAuditRow item={item} key={item.event_id} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      <OperationAlertNotificationTaskRecoveryAuditArchivePanel
        approvalNote={archiveApprovalNote}
        approvalOverview={archiveApprovalOverview}
        approvals={archiveApprovals}
        approvalsLoading={archiveApprovalsLoading}
        archives={archives}
        errorMessage={archiveError}
        isApproving={approvingArchive}
        isCreating={creatingArchive}
        isDeleting={deletingArchive}
        isDownloading={downloadingArchive}
        isRejecting={rejectingArchive}
        loading={archiveLoading}
        message={archiveMessage}
        onApprove={onArchiveApprove}
        onCreate={onArchiveCreate}
        onDelete={onArchiveDelete}
        onDownload={onArchiveDownload}
        onNoteChange={onArchiveNoteChange}
        onReject={onArchiveReject}
        onApprovalRefresh={onArchiveApprovalRefresh}
        onRefresh={onArchiveRefresh}
        summary={archiveSummary}
      />
    </Card>
  );
}

function OperationAlertNotificationTaskRecoveryAuditArchivePanel({
  approvalNote,
  approvalOverview,
  approvals,
  approvalsLoading,
  archives,
  errorMessage,
  isApproving,
  isCreating,
  isDeleting,
  isDownloading,
  isRejecting,
  loading,
  message,
  onApprove,
  onCreate,
  onDelete,
  onDownload,
  onNoteChange,
  onReject,
  onApprovalRefresh,
  onRefresh,
  summary,
}: {
  approvalNote: string;
  approvalOverview: SecurityOperationAlertNotificationTaskRecoveryAuditArchiveApprovalOverview | null;
  approvals: SecurityOperationAlertNotificationTaskRecoveryAuditArchiveApprovalItem[];
  approvalsLoading: boolean;
  archives: SecurityOperationAlertNotificationTaskRecoveryAuditArchiveItem[];
  errorMessage: string | null;
  isApproving: boolean;
  isCreating: boolean;
  isDeleting: boolean;
  isDownloading: boolean;
  isRejecting: boolean;
  loading: boolean;
  message: string | null;
  onApprove: (approvalId: string) => void;
  onCreate: () => void;
  onDelete: (archive: SecurityOperationAlertNotificationTaskRecoveryAuditArchiveItem) => void;
  onDownload: (archive: SecurityOperationAlertNotificationTaskRecoveryAuditArchiveItem) => void;
  onNoteChange: (note: string) => void;
  onReject: (approvalId: string) => void;
  onApprovalRefresh: () => void;
  onRefresh: () => void;
  summary: { archive_count: number; total_size_bytes: number } | null;
}) {
  const [selectedApprovalId, setSelectedApprovalId] = useState<string | null>(null);
  const [approvalKeyword, setApprovalKeyword] = useState('');
  const [approvalStatus, setApprovalStatus] = useState<SecurityOperationAlertNotificationTaskRecoveryAuditArchiveApprovalItem['status'] | ''>('');
  const [approvalPendingOnly, setApprovalPendingOnly] = useState(false);
  const pendingApprovals = approvals.filter((approval) => approval.status === 'PENDING');
  const filteredApprovals = useMemo(() => {
    const keyword = approvalKeyword.trim().toLowerCase();
    return approvals
      .filter((approval) => !approvalPendingOnly || approval.status === 'PENDING')
      .filter((approval) => !approvalStatus || approval.status === approvalStatus)
      .filter((approval) => {
        if (!keyword) return true;
        return [
          approval.id,
          approval.archive_id,
          approval.archive_key,
          approval.archive_file_name,
          approval.reason,
          approval.requested_by?.name,
          approval.requested_by?.email,
          approval.reviewed_by?.name,
          approval.reviewed_by?.email,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(keyword));
      });
  }, [approvalKeyword, approvalPendingOnly, approvalStatus, approvals]);
  const selectedApproval = selectedApprovalId
    ? filteredApprovals.find((approval) => approval.id === selectedApprovalId) ??
      approvals.find((approval) => approval.id === selectedApprovalId) ??
      null
    : filteredApprovals[0] ?? null;
  const activeApprovalId = selectedApproval?.id ?? null;
  const approvalDetailQuery = useQuery({
    enabled: Boolean(activeApprovalId),
    queryKey: ['security-operation-alert-notification-task-recovery-audit-archive-approval', activeApprovalId],
    queryFn: () => getSecurityOperationAlertNotificationTaskRecoveryAuditArchiveApproval(activeApprovalId ?? ''),
  });
  const hasApprovalFilters = Boolean(approvalKeyword || approvalStatus || approvalPendingOnly);

  useEffect(() => {
    if (selectedApprovalId && !approvals.some((approval) => approval.id === selectedApprovalId)) {
      setSelectedApprovalId(null);
    }
  }, [approvals, selectedApprovalId]);

  useEffect(() => {
    if (selectedApprovalId && filteredApprovals.length > 0 && !filteredApprovals.some((approval) => approval.id === selectedApprovalId)) {
      setSelectedApprovalId(filteredApprovals[0]?.id ?? null);
    }
  }, [filteredApprovals, selectedApprovalId]);

  const handleDelete = (archive: SecurityOperationAlertNotificationTaskRecoveryAuditArchiveItem) => {
    const confirmed = window.confirm(`确认申请删除归档 ${archive.file_name}？该操作需要审批后生效。`);
    if (confirmed) {
      onDelete(archive);
    }
  };
  const resetApprovalFilters = () => {
    setApprovalKeyword('');
    setApprovalStatus('');
    setApprovalPendingOnly(false);
  };
  const exportFilteredApprovals = () => {
    const header = ['审批ID', '状态', '归档文件', '对象路径', '大小', '申请人', '申请时间', '审批人', '审批时间', '审批意见'];
    const rows = filteredApprovals.map((approval) => [
      approval.id,
      archiveApprovalStatusLabel(approval.status),
      approval.archive_file_name,
      approval.archive_key,
      String(approval.archive_size_bytes),
      approval.requested_by?.name ?? '系统',
      approval.requested_at,
      approval.reviewed_by?.name ?? '',
      approval.reviewed_at ?? '',
      approval.reason ?? '',
    ]);
    const csv = [header, ...rows].map((row) => row.map(csvCell).join(',')).join('\n');
    downloadBlob(new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8' }), `自愈闭环归档删除审批-${new Date().toISOString().slice(0, 10)}.csv`);
  };

  return (
    <Card className="mt-4 border-border/70 bg-background/80 p-4 shadow-none">
      <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-start">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge tone="ready">M106 审计归档</StatusBadge>
            <StatusBadge tone="planned">MinIO 下载</StatusBadge>
            <StatusBadge tone={(approvalOverview?.pending_count ?? 0) > 0 ? 'degraded' : 'healthy'}>
              M107 删除审批
            </StatusBadge>
          </div>
          <h5 className="mt-3 text-sm font-semibold">自愈闭环审计归档下载</h5>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">
            将当前筛选条件下的自愈闭环审计生成 CSV 归档，保存到对象存储；归档删除需要先提交审批，通过后才会删除对象文件。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button disabled={isCreating} onClick={onCreate} type="button">
            <Archive className="size-4" />
            {isCreating ? '正在生成' : '生成归档'}
          </Button>
          <Button disabled={loading} onClick={onRefresh} type="button" variant="outline">
            <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} />
            刷新归档
          </Button>
        </div>
      </div>

      {message ? (
        <div className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {message}
        </div>
      ) : null}
      {errorMessage ? (
        <div className="mt-4 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {errorMessage}
        </div>
      ) : null}

      <div className="mt-4 grid gap-4 xl:grid-cols-[240px_1fr]">
        <div className="grid gap-3">
          <ArchiveMetric helper="对象存储文件" label="归档文件" value={`${summary?.archive_count ?? 0}`} />
          <ArchiveMetric helper="CSV 总容量" label="归档容量" value={formatBytes(summary?.total_size_bytes ?? 0)} />
          <ArchiveMetric helper="等待安全管理员处理" label="删除待审" value={`${approvalOverview?.pending_count ?? 0}`} />
          <ArchiveMetric helper="审批通过且已删除" label="删除生效" value={`${approvalOverview?.applied_count ?? 0}`} />
        </div>

        {loading ? (
          <div className="rounded-md border bg-muted/20 p-5 text-sm text-muted-foreground">
            正在加载自愈闭环审计归档...
          </div>
        ) : archives.length === 0 ? (
          <EmptyState
            className="rounded-md border bg-slate-50/60 p-5"
            description="点击生成归档后，当前筛选结果会保存为 CSV 文件。"
            title="暂无自愈闭环审计归档"
          />
        ) : (
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full min-w-[760px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  {['文件名', '目录', '大小', '更新时间', '对象路径', '操作'].map((column) => (
                    <th className="px-3 py-2 font-medium text-muted-foreground" key={column}>{column}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {archives.map((archive) => (
                  <tr className="border-b last:border-0" key={archive.id}>
                    <td className="px-3 py-2 font-medium">{archive.file_name}</td>
                    <td className="px-3 py-2 text-muted-foreground">{archive.folder}</td>
                    <td className="px-3 py-2 text-muted-foreground">{formatBytes(archive.size_bytes)}</td>
                    <td className="px-3 py-2 text-muted-foreground">{formatDateTime(archive.last_modified)}</td>
                    <td className="px-3 py-2 font-mono text-xs text-muted-foreground">{archive.key}</td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap gap-2">
                        <Button disabled={isDownloading} onClick={() => onDownload(archive)} size="sm" type="button" variant="outline">
                          <Download className="size-4" />
                          下载
                        </Button>
                        <Button disabled={isDeleting} onClick={() => handleDelete(archive)} size="sm" type="button" variant="outline">
                          <Trash2 className="size-4" />
                          {isDeleting ? '提交中' : '申请删除'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mt-4 rounded-md border bg-background/70 p-4">
        <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-start">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge tone="ready">M107</StatusBadge>
              <StatusBadge tone={pendingApprovals.length > 0 ? 'degraded' : 'planned'}>
                {pendingApprovals.length > 0 ? `${pendingApprovals.length} 个待审批` : '删除审批'}
              </StatusBadge>
            </div>
            <h6 className="mt-3 text-sm font-semibold">归档删除审批</h6>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">
              删除申请写入平台事件审计；审批通过会立即删除对象存储文件，拒绝会保留归档。
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button disabled={approvalsLoading} onClick={onApprovalRefresh} type="button" variant="outline">
              <RefreshCw className={`size-4 ${approvalsLoading ? 'animate-spin' : ''}`} />
              刷新审批
            </Button>
            <Button disabled={approvalsLoading || filteredApprovals.length === 0} onClick={exportFilteredApprovals} type="button" variant="outline">
              <Download className="size-4" />
              导出当前筛选
            </Button>
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <ArchiveMetric helper="等待处理" label="待审批" value={`${approvalOverview?.pending_count ?? 0}`} />
          <ArchiveMetric helper="已通过申请" label="已批准" value={`${approvalOverview?.approved_count ?? 0}`} />
          <ArchiveMetric helper="申请被拒绝" label="已拒绝" value={`${approvalOverview?.rejected_count ?? 0}`} />
          <ArchiveMetric helper="对象已删除" label="已生效" value={`${approvalOverview?.applied_count ?? 0}`} />
        </div>

        <div className="mt-4 grid gap-2 lg:grid-cols-[1fr_150px_auto_auto]">
          <label className="flex h-9 min-w-0 items-center gap-2 rounded-md border bg-background/70 px-3 text-sm">
            <Search className="size-4 shrink-0 text-muted-foreground" />
            <input
              className="min-w-0 flex-1 bg-transparent outline-none"
              onChange={(event) => setApprovalKeyword(event.target.value)}
              placeholder="搜索审批 ID、文件名、对象路径、申请人、意见"
              value={approvalKeyword}
            />
          </label>
          <select
            className="h-9 rounded-md border bg-background/80 px-3 text-sm"
            onChange={(event) => setApprovalStatus(event.target.value as SecurityOperationAlertNotificationTaskRecoveryAuditArchiveApprovalItem['status'] | '')}
            value={approvalStatus}
          >
            <option value="">全部状态</option>
            <option value="PENDING">待审批</option>
            <option value="APPROVED">已批准</option>
            <option value="REJECTED">已拒绝</option>
            <option value="APPLIED">已生效</option>
          </select>
          <Button
            onClick={() => setApprovalPendingOnly((current) => !current)}
            type="button"
            variant={approvalPendingOnly ? 'default' : 'outline'}
          >
            只看待审批
          </Button>
          <Button disabled={!hasApprovalFilters} onClick={resetApprovalFilters} type="button" variant="outline">
            清空筛选
          </Button>
        </div>

        {approvalsLoading ? (
          <div className="mt-4 rounded-md border bg-muted/20 p-5 text-sm text-muted-foreground">正在加载归档删除审批...</div>
        ) : filteredApprovals.length === 0 ? (
          <EmptyState
            className="mt-4 rounded-md border bg-slate-50/60 p-5"
            description="提交归档删除申请后，审批记录会出现在这里。"
            title="暂无归档删除审批"
          />
        ) : (
          <div className="mt-4 grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
            <div className="overflow-x-auto rounded-md border">
              <table className="w-full min-w-[720px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    {['状态', '归档文件', '申请人', '申请时间', '审批人', '操作'].map((column) => (
                      <th className="px-3 py-2 font-medium text-muted-foreground" key={column}>{column}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredApprovals.map((approval) => (
                    <NotificationTaskRecoveryAuditArchiveApprovalRow
                      approval={approval}
                      active={approval.id === activeApprovalId}
                      key={approval.id}
                      onSelect={setSelectedApprovalId}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            <NotificationTaskRecoveryAuditArchiveApprovalDetailPanel
              approvalNote={approvalNote}
              detail={approvalDetailQuery.data ?? null}
              fallbackApproval={selectedApproval}
              loading={approvalDetailQuery.isLoading}
              onApprove={onApprove}
              onNoteChange={onNoteChange}
              onReject={onReject}
              approving={isApproving}
              rejecting={isRejecting}
            />
          </div>
        )}
      </div>
    </Card>
  );
}

function OperationAlertNotificationTaskRecoveryAuditRow({
  item,
}: {
  item: SecurityOperationAlertNotificationTaskRecoveryAuditItem;
}) {
  return (
    <tr className="align-top">
      <td className="px-4 py-3">
        <div className="font-medium">{item.title}</div>
        <div className="mt-1 text-xs text-muted-foreground">{item.suggestion_id}</div>
      </td>
      <td className="px-4 py-3">
        <div className="flex flex-wrap gap-2">
          <StatusBadge tone="planned">{notificationTaskRecoveryReasonLabel(item.reason_code)}</StatusBadge>
          <StatusBadge tone={notificationTaskRecoveryFailureSourceTone(item.failure_source)}>
            {notificationTaskRecoveryFailureSourceLabel(item.failure_source)}
          </StatusBadge>
          <StatusBadge tone={securityRiskTone(item.severity)}>{securityRiskLevelLabel(item.severity)}</StatusBadge>
        </div>
        <div className="mt-1 flex flex-wrap gap-1 text-xs">
          <StatusBadge tone={item.sla_dead_letter_failed_count > 0 ? 'degraded' : 'planned'}>
            SLA {item.sla_dead_letter_failed_count}
          </StatusBadge>
          <StatusBadge tone={item.recovery_archive_delete_failed_count > 0 ? 'degraded' : 'planned'}>
            自愈 {item.recovery_archive_delete_failed_count}
          </StatusBadge>
        </div>
        {item.evidence ? <div className="mt-1 line-clamp-2 text-xs text-muted-foreground">{item.evidence}</div> : null}
      </td>
      <td className="px-4 py-3">
        <div className="flex flex-wrap gap-2">
          <StatusBadge tone="mock">{notificationTaskRecoveryActionVerb(item.action)}</StatusBadge>
          <StatusBadge tone={notificationTaskRecoveryStatusTone(item.status)}>
            {notificationTaskRecoveryStatusLabel(item.status)}
          </StatusBadge>
        </div>
      </td>
      <td className="px-4 py-3 text-muted-foreground">
        <div className="line-clamp-2 max-w-[240px]">{item.note ?? '无备注'}</div>
      </td>
      <td className="px-4 py-3 text-muted-foreground">
        <div className="max-w-[220px] truncate">{item.request_id ?? '无 request_id'}</div>
        <div className="mt-1 max-w-[220px] truncate text-xs">{item.trace_id ?? '无 trace_id'}</div>
      </td>
      <td className="px-4 py-3 text-muted-foreground">{formatDateTime(item.occurred_at)}</td>
      <td className="px-4 py-3">
        <div className="flex flex-wrap gap-2">
          {item.request_id ? (
            <Button asChild size="sm" type="button" variant="outline">
              <Link href={`/audit?keyword=${encodeURIComponent(item.request_id)}`}>审计</Link>
            </Button>
          ) : null}
          {item.trace_id ? (
            <Button asChild size="sm" type="button" variant="outline">
              <Link href={`/monitor?keyword=${encodeURIComponent(item.trace_id)}`}>链路</Link>
            </Button>
          ) : null}
        </div>
      </td>
    </tr>
  );
}

function NotificationTaskRecoveryAuditArchiveApprovalRow({
  active,
  approval,
  onSelect,
}: {
  active: boolean;
  approval: SecurityOperationAlertNotificationTaskRecoveryAuditArchiveApprovalItem;
  onSelect: (approvalId: string) => void;
}) {
  return (
    <tr className={`border-b last:border-0 ${active ? 'bg-blue-50/50' : ''}`}>
      <td className="px-3 py-2">
        <StatusBadge tone={archiveApprovalStatusTone(approval.status)}>{archiveApprovalStatusLabel(approval.status)}</StatusBadge>
        <div className="mt-1 font-mono text-xs text-muted-foreground">{shortId(approval.id)}</div>
      </td>
      <td className="px-3 py-2">
        <div className="font-medium">{approval.archive_file_name}</div>
        <div className="mt-1 truncate font-mono text-xs text-muted-foreground">{approval.archive_key}</div>
      </td>
      <td className="px-3 py-2 text-muted-foreground">{approval.requested_by?.name ?? '系统'}</td>
      <td className="px-3 py-2 text-muted-foreground">{formatDateTime(approval.requested_at)}</td>
      <td className="px-3 py-2 text-muted-foreground">
        {approval.reviewed_by?.name ?? '未审批'}
        {approval.reviewed_at ? <div className="mt-1 text-xs">{formatDateTime(approval.reviewed_at)}</div> : null}
      </td>
      <td className="px-3 py-2">
        <Button onClick={() => onSelect(approval.id)} size="sm" type="button" variant="outline">
          {active ? '当前详情' : '查看详情'}
        </Button>
      </td>
    </tr>
  );
}

function NotificationTaskRecoveryAuditArchiveApprovalDetailPanel({
  approvalNote,
  approving,
  detail,
  fallbackApproval,
  loading,
  onApprove,
  onNoteChange,
  onReject,
  rejecting,
}: {
  approvalNote: string;
  approving: boolean;
  detail: SecurityOperationAlertNotificationTaskRecoveryAuditArchiveApprovalDetail | null;
  fallbackApproval: SecurityOperationAlertNotificationTaskRecoveryAuditArchiveApprovalItem | null;
  loading: boolean;
  onApprove: (approvalId: string) => void;
  onNoteChange: (note: string) => void;
  onReject: (approvalId: string) => void;
  rejecting: boolean;
}) {
  const current = detail ?? fallbackApproval;
  const pending = current?.status === 'PENDING';

  return (
    <div className="rounded-md border bg-background/75 p-4">
      <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-start">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge tone="ready">审批详情</StatusBadge>
            {current ? (
              <StatusBadge tone={archiveApprovalStatusTone(current.status)}>
                {archiveApprovalStatusLabel(current.status)}
              </StatusBadge>
            ) : null}
          </div>
          <h6 className="mt-3 text-sm font-semibold">详情与审计时间线</h6>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            查看归档删除从申请、审批到生效的完整事件链路，并可通过请求 ID 和 Trace ID 跳转定位。
          </p>
        </div>
        {current ? (
          <div className="rounded-md border bg-background/80 px-3 py-2 text-xs text-muted-foreground">
            审批 ID：<span className="font-mono">{shortId(current.id)}</span>
          </div>
        ) : null}
      </div>

      {loading ? (
        <div className="mt-4 rounded-md border bg-muted/20 p-5 text-sm text-muted-foreground">正在加载审批详情...</div>
      ) : !current ? (
        <EmptyState
          className="mt-4 rounded-md border bg-slate-50/60 p-5"
          description="选择一条归档删除审批后，这里会展示审批详情和事件时间线。"
          title="暂无审批详情"
        />
      ) : (
        <div className="mt-4 grid gap-4">
          <div className="grid gap-2 text-sm md:grid-cols-2">
            <SummaryTile label="归档文件" value={current.archive_file_name} />
            <SummaryTile label="归档大小" value={formatBytes(current.archive_size_bytes)} />
            <SummaryTile label="对象路径" value={current.archive_key} />
            <SummaryTile label="申请人" value={current.requested_by?.name ?? '系统'} />
            <SummaryTile label="申请时间" value={formatDateTime(current.requested_at)} />
            <SummaryTile label="审批人" value={current.reviewed_by?.name ?? '未审批'} />
            <SummaryTile label="审批时间" value={formatDateTime(current.reviewed_at ?? '')} />
            <SummaryTile label="审批意见" value={current.reason ?? '未填写'} />
          </div>

          {pending ? (
            <div className="rounded-md border bg-muted/20 p-3">
              <label className="text-xs font-medium text-muted-foreground">审批意见</label>
              <Input
                className="mt-2"
                onChange={(event) => onNoteChange(event.target.value)}
                placeholder="填写批准或拒绝理由"
                value={approvalNote}
              />
              <div className="mt-3 flex flex-wrap gap-2">
                <Button disabled={approving || rejecting} onClick={() => onApprove(current.id)} size="sm" type="button" variant="outline">
                  {approving ? '批准中' : '批准删除'}
                </Button>
                <Button disabled={approving || rejecting} onClick={() => onReject(current.id)} size="sm" type="button" variant="outline">
                  {rejecting ? '拒绝中' : '拒绝'}
                </Button>
              </div>
            </div>
          ) : null}

          <div className="rounded-md border bg-background/70 p-3">
            <div className="mb-3 flex items-center justify-between gap-3">
              <span className="text-sm font-semibold">事件时间线</span>
              <StatusBadge tone={(detail?.audit_timeline.length ?? 0) > 0 ? 'mock' : 'planned'}>
                {detail?.audit_timeline.length ?? 0} 条事件
              </StatusBadge>
            </div>
            {!detail ? (
              <div className="rounded-md border bg-muted/20 p-4 text-sm text-muted-foreground">
                详情加载后会显示申请、审批、拒绝或删除生效事件。
              </div>
            ) : detail.audit_timeline.length === 0 ? (
              <EmptyState
                className="rounded-md border bg-slate-50/60 p-5"
                description="当前审批还没有可展示的事件时间线。"
                title="暂无时间线事件"
              />
            ) : (
              <div className="grid gap-3">
                {detail.audit_timeline.map((event) => (
                  <NotificationTaskRecoveryAuditArchiveApprovalTimelineRow event={event} key={event.event_id} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function NotificationTaskRecoveryAuditArchiveApprovalTimelineRow({
  event,
}: {
  event: SecurityOperationAlertNotificationTaskRecoveryAuditArchiveApprovalTimelineItem;
}) {
  return (
    <div className="rounded-md border bg-background/75 p-3">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge tone={archiveApprovalEventTone(event.event_type)}>
              {archiveApprovalEventLabel(event.event_type)}
            </StatusBadge>
            <StatusBadge tone={archiveApprovalEventStatusTone(event.status)}>{event.status}</StatusBadge>
            <span className="font-mono text-xs text-muted-foreground">{shortId(event.event_id)}</span>
          </div>
          <div className="mt-2 truncate text-sm font-medium">{event.title}</div>
          {event.note ? <div className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">备注：{event.note}</div> : null}
        </div>
        <div className="shrink-0 text-xs text-muted-foreground md:text-right">
          <div>{formatDateTime(event.occurred_at)}</div>
          <div className="mt-1">{event.actor ? `操作人：${event.actor.name}` : '操作人：系统'}</div>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
        <span className="truncate font-mono">对象：{event.archive_key}</span>
        {event.request_id ? <span>请求 {shortId(event.request_id)}</span> : null}
        {event.trace_id ? <span>Trace {shortId(event.trace_id)}</span> : null}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {event.request_id ? (
          <Button asChild size="sm" type="button" variant="outline">
            <Link href={`/audit?keyword=${encodeURIComponent(event.request_id)}`}>审计中心</Link>
          </Button>
        ) : null}
        {event.trace_id ? (
          <Button asChild size="sm" type="button" variant="outline">
            <Link href={`/monitor?keyword=${encodeURIComponent(event.trace_id)}`}>查看 Trace</Link>
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function OperationAlertNotificationTaskResult({
  result,
}: {
  result: SecurityOperationAlertNotificationTaskRunResult | null;
}) {
  if (!result) {
    return (
      <div className="rounded-md border bg-background/70 p-4">
        <div className="mb-2 flex items-center justify-between gap-3">
          <span className="text-sm font-semibold">最近执行结果</span>
          <StatusBadge tone="planned">暂无结果</StatusBadge>
        </div>
        <p className="text-sm leading-6 text-muted-foreground">任务执行后会显示最近一次扫描、通知或重试摘要。</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border bg-background/70 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="text-sm font-semibold">最近执行结果 · {notificationTaskNameLabel(result.task)}</span>
        <StatusBadge tone={taskRunTone(result.status)}>{taskRunLabel(result.status)}</StatusBadge>
      </div>
      <div className="grid gap-2 text-sm md:grid-cols-3">
        <SummaryTile label="扫描" value={`${result.scanned_count}`} />
        <SummaryTile label="通知" value={`${result.notified_count}`} />
        <SummaryTile label="重试" value={`${result.retried_count}`} />
        <SummaryTile label="SLA 覆盖" value={`${result.sla_dead_letter_notify_count}`} />
        <SummaryTile label="自愈覆盖" value={`${result.recovery_archive_delete_notify_count}`} />
        <SummaryTile label="成功" value={`${result.success_count}`} />
        <SummaryTile label="失败" value={`${result.failed_count}`} />
        <SummaryTile label="跳过" value={`${result.skipped_count}`} />
        <SummaryTile label="完成时间" value={formatDateTime(result.finished_at)} />
      </div>
      {result.error_message ? (
        <div className="mt-3 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
          {result.error_message}
        </div>
      ) : null}
    </div>
  );
}

function OperationAlertSlaCard({
  loading,
  notificationLoading,
  notificationOverview,
  notificationRetryLoading,
  notificationRetryOverview,
  notificationRetryRunning,
  notificationRunning,
  onNotifyOverdue,
  onRefresh,
  onRefreshNotification,
  onRefreshNotificationRetry,
  onRunEscalation,
  onRunNotificationAutoRetry,
  onRetryNotification,
  overview,
  retryingNotification,
  retryingNotificationEventId,
  running,
  deadLetterLoading,
  deadLetterNote,
  deadLetterOverview,
  deadLetterPendingAction,
  deadLetterPendingEventId,
  deadLetterRunning,
  deadLetterAuditAction,
  deadLetterAuditKeyword,
  deadLetterAuditLoading,
  deadLetterAuditPage,
  deadLetterAuditPageCount,
  deadLetterAuditResult,
  deadLetterAuditStatus,
  deadLetterAuditExportState,
  deadLetterAuditArchives,
  deadLetterAuditArchiveError,
  deadLetterAuditArchiveLoading,
  deadLetterAuditArchiveMessage,
  deadLetterAuditArchiveSummary,
  deadLetterAuditCreatingArchive,
  deadLetterAuditDownloadingArchive,
  deadLetterAuditDeletingArchive,
  deadLetterAuditArchiveApproving,
  deadLetterAuditArchiveRejecting,
  deadLetterAuditArchiveApprovalNote,
  deadLetterAuditArchiveApprovalOverview,
  deadLetterAuditArchiveApprovals,
  deadLetterAuditArchiveApprovalsLoading,
  onDeadLetterNoteChange,
  onHandleDeadLetter,
  onRefreshDeadLetter,
  onDeadLetterAuditActionChange,
  onDeadLetterAuditArchiveApprove,
  onDeadLetterAuditArchiveCreate,
  onDeadLetterAuditArchiveDelete,
  onDeadLetterAuditArchiveDownload,
  onDeadLetterAuditArchiveNoteChange,
  onDeadLetterAuditArchiveReject,
  onDeadLetterAuditArchiveRefresh,
  onDeadLetterAuditArchiveApprovalRefresh,
  onDeadLetterAuditExport,
  onDeadLetterAuditKeywordChange,
  onDeadLetterAuditStatusChange,
  onDeadLetterAuditPageChange,
  onRefreshDeadLetterAudit,
}: {
  loading: boolean;
  notificationLoading: boolean;
  notificationOverview: SecurityOperationAlertSlaNotificationOverview | null;
  notificationRetryLoading: boolean;
  notificationRetryOverview: SecurityOperationAlertSlaNotificationRetryOverview | null;
  notificationRetryRunning: boolean;
  notificationRunning: boolean;
  onNotifyOverdue: () => void;
  onRefresh: () => void;
  onRefreshNotification: () => void;
  onRefreshNotificationRetry: () => void;
  onRunEscalation: () => void;
  onRunNotificationAutoRetry: () => void;
  onRetryNotification: (notificationEventId: string) => void;
  overview: SecurityOperationAlertSlaOverview | null;
  retryingNotification: boolean;
  retryingNotificationEventId: string | null;
  running: boolean;
  deadLetterLoading: boolean;
  deadLetterNote: string;
  deadLetterOverview: SecurityOperationAlertSlaDeadLetterOverview | null;
  deadLetterPendingAction: SecurityOperationAlertSlaDeadLetterAction | null;
  deadLetterPendingEventId: string | null;
  deadLetterRunning: boolean;
  deadLetterAuditAction: SecurityOperationAlertSlaDeadLetterAction | '';
  deadLetterAuditKeyword: string;
  deadLetterAuditLoading: boolean;
  deadLetterAuditPage: number;
  deadLetterAuditPageCount: number;
  deadLetterAuditResult: PaginatedSecurityOperationAlertSlaDeadLetterAudits | null;
  deadLetterAuditStatus: SecurityOperationAlertSlaDeadLetterDispositionStatus | '';
  deadLetterAuditExportState: 'idle' | 'exporting' | 'success' | 'error';
  deadLetterAuditArchives: SecurityOperationAlertSlaDeadLetterAuditArchiveItem[];
  deadLetterAuditArchiveError: string | null;
  deadLetterAuditArchiveLoading: boolean;
  deadLetterAuditArchiveMessage: string | null;
  deadLetterAuditArchiveSummary: { archive_count: number; total_size_bytes: number } | null;
  deadLetterAuditCreatingArchive: boolean;
  deadLetterAuditDownloadingArchive: boolean;
  deadLetterAuditDeletingArchive: boolean;
  deadLetterAuditArchiveApproving: boolean;
  deadLetterAuditArchiveRejecting: boolean;
  deadLetterAuditArchiveApprovalNote: string;
  deadLetterAuditArchiveApprovalOverview: SecurityOperationAlertSlaDeadLetterAuditArchiveApprovalOverview | null;
  deadLetterAuditArchiveApprovals: SecurityOperationAlertSlaDeadLetterAuditArchiveApprovalItem[];
  deadLetterAuditArchiveApprovalsLoading: boolean;
  onDeadLetterNoteChange: (note: string) => void;
  onHandleDeadLetter: (notificationEventId: string, action: SecurityOperationAlertSlaDeadLetterAction) => void;
  onRefreshDeadLetter: () => void;
  onDeadLetterAuditActionChange: (action: SecurityOperationAlertSlaDeadLetterAction | '') => void;
  onDeadLetterAuditArchiveApprove: (approvalId: string) => void;
  onDeadLetterAuditArchiveCreate: () => void;
  onDeadLetterAuditArchiveDelete: (archive: SecurityOperationAlertSlaDeadLetterAuditArchiveItem) => void;
  onDeadLetterAuditArchiveDownload: (archive: SecurityOperationAlertSlaDeadLetterAuditArchiveItem) => void;
  onDeadLetterAuditArchiveNoteChange: (note: string) => void;
  onDeadLetterAuditArchiveReject: (approvalId: string) => void;
  onDeadLetterAuditArchiveRefresh: () => void;
  onDeadLetterAuditArchiveApprovalRefresh: () => void;
  onDeadLetterAuditExport: () => void;
  onDeadLetterAuditKeywordChange: (keyword: string) => void;
  onDeadLetterAuditStatusChange: (status: SecurityOperationAlertSlaDeadLetterDispositionStatus | '') => void;
  onDeadLetterAuditPageChange: (page: number) => void;
  onRefreshDeadLetterAudit: () => void;
}) {
  const summary = overview?.summary;
  const policy = overview?.policy;
  const items = overview?.items ?? [];
  const hasRisk = (summary?.warning_count ?? 0) + (summary?.overdue_count ?? 0) > 0;
  const metrics = [
    { label: 'SLA 内', value: `${summary?.within_sla_count ?? 0}`, helper: '仍有处理时间' },
    { label: '临近超时', value: `${summary?.warning_count ?? 0}`, helper: `预警窗口 ${policy?.warning_minutes ?? 0} 分钟` },
    { label: '已超时', value: `${summary?.overdue_count ?? 0}`, helper: '需要升级或关闭' },
    { label: '自动升级', value: `${summary?.auto_escalated_count ?? 0}`, helper: '由系统写入升级事件' },
  ];

  return (
    <div className="border-t bg-muted/10 p-5">
      <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-start">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge tone="ready">M88 SLA</StatusBadge>
            <StatusBadge tone={policy?.enabled ? 'healthy' : 'planned'}>
              {policy?.enabled ? 'SLA 已启用' : 'SLA 未启用'}
            </StatusBadge>
            <StatusBadge tone={hasRisk ? 'degraded' : 'healthy'}>
              {hasRisk ? '存在时限风险' : '时限正常'}
            </StatusBadge>
          </div>
          <h3 className="mt-3 text-sm font-semibold">告警 SLA 与超时升级</h3>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">
            按审批与归档运营告警触发时间计算处理时限，临近超时进入预警，超时后可由任务自动追加升级事件。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button disabled={loading} onClick={onRefresh} type="button" variant="outline">
            <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} />
            刷新 SLA
          </Button>
          <Button disabled={loading || running || !policy?.enabled || !policy?.auto_escalate_enabled} onClick={onRunEscalation} type="button" variant="outline">
            <RefreshCw className={`size-4 ${running ? 'animate-spin' : ''}`} />
            {running ? '扫描中' : '立即扫描升级'}
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="mt-4 rounded-md border bg-background/70 p-4 text-sm text-muted-foreground">
          正在加载告警 SLA...
        </div>
      ) : (
        <div className="mt-4 grid gap-4">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {metrics.map((metric) => (
              <MetricCard helper={metric.helper} key={metric.label} label={metric.label} value={metric.value} />
            ))}
          </div>

          <div className="grid gap-4 xl:grid-cols-[0.88fr_1.12fr]">
            <Card className="border-border/70 p-4 shadow-none">
              <div className="mb-3 text-sm font-semibold">SLA 策略</div>
              <div className="grid gap-2 text-sm">
                <SummaryTile label="任务开关" value={overview?.scheduler_enabled ? '已启用' : '未启用'} />
                <SummaryTile label="处理时限" value={`${policy?.due_minutes ?? 0} 分钟`} />
                <SummaryTile label="预警窗口" value={`${policy?.warning_minutes ?? 0} 分钟`} />
                <SummaryTile label="扫描间隔" value={overview?.next_tick_after_seconds ? `${overview.next_tick_after_seconds} 秒` : '未配置'} />
                <SummaryTile label="最近扫描" value={formatDateTime(overview?.last_tick_at ?? '')} />
                <SummaryTile label="下次到期" value={formatDateTime(summary?.next_due_at ?? '')} />
              </div>
            </Card>

            <Card className="border-border/70 p-4 shadow-none">
              <div className="mb-3 flex items-center justify-between gap-3">
                <span className="text-sm font-semibold">SLA 明细</span>
                <StatusBadge tone={running || overview?.running ? 'loading' : 'mock'}>
                  {running || overview?.running ? '执行中' : '空闲'}
                </StatusBadge>
              </div>
              {items.length === 0 ? (
                <EmptyState
                  className="rounded-md border bg-slate-50/60 p-5"
                  description="当前没有审批与归档运营告警需要计算 SLA。"
                  title="暂无 SLA 风险"
                />
              ) : (
                <div className="grid gap-3">
                  {items.slice(0, 6).map((item) => (
                    <OperationAlertSlaRow item={item} key={item.alert_id} />
                  ))}
                </div>
              )}
            </Card>
          </div>

          <OperationAlertSlaTaskResult result={overview?.last_auto_escalation_result ?? null} />

          <OperationAlertSlaNotificationCard
            loading={notificationLoading}
            deadLetterAuditAction={deadLetterAuditAction}
            deadLetterAuditKeyword={deadLetterAuditKeyword}
            deadLetterAuditLoading={deadLetterAuditLoading}
            deadLetterAuditPage={deadLetterAuditPage}
            deadLetterAuditPageCount={deadLetterAuditPageCount}
            deadLetterAuditResult={deadLetterAuditResult}
            deadLetterAuditStatus={deadLetterAuditStatus}
            deadLetterAuditExportState={deadLetterAuditExportState}
            deadLetterAuditArchives={deadLetterAuditArchives}
            deadLetterAuditArchiveError={deadLetterAuditArchiveError}
            deadLetterAuditArchiveLoading={deadLetterAuditArchiveLoading}
            deadLetterAuditArchiveMessage={deadLetterAuditArchiveMessage}
            deadLetterAuditArchiveSummary={deadLetterAuditArchiveSummary}
            deadLetterAuditCreatingArchive={deadLetterAuditCreatingArchive}
            deadLetterAuditDownloadingArchive={deadLetterAuditDownloadingArchive}
            deadLetterAuditDeletingArchive={deadLetterAuditDeletingArchive}
            deadLetterAuditArchiveApproving={deadLetterAuditArchiveApproving}
            deadLetterAuditArchiveRejecting={deadLetterAuditArchiveRejecting}
            deadLetterAuditArchiveApprovalNote={deadLetterAuditArchiveApprovalNote}
            deadLetterAuditArchiveApprovalOverview={deadLetterAuditArchiveApprovalOverview}
            deadLetterAuditArchiveApprovals={deadLetterAuditArchiveApprovals}
            deadLetterAuditArchiveApprovalsLoading={deadLetterAuditArchiveApprovalsLoading}
            deadLetterLoading={deadLetterLoading}
            deadLetterNote={deadLetterNote}
            deadLetterOverview={deadLetterOverview}
            deadLetterPendingAction={deadLetterPendingAction}
            deadLetterPendingEventId={deadLetterPendingEventId}
            deadLetterRunning={deadLetterRunning}
            notificationRetryLoading={notificationRetryLoading}
            notificationRetryOverview={notificationRetryOverview}
            notificationRetryRunning={notificationRetryRunning}
            onDeadLetterNoteChange={onDeadLetterNoteChange}
            onDeadLetterAuditActionChange={onDeadLetterAuditActionChange}
            onDeadLetterAuditArchiveApprove={onDeadLetterAuditArchiveApprove}
            onDeadLetterAuditArchiveCreate={onDeadLetterAuditArchiveCreate}
            onDeadLetterAuditArchiveDelete={onDeadLetterAuditArchiveDelete}
            onDeadLetterAuditArchiveDownload={onDeadLetterAuditArchiveDownload}
            onDeadLetterAuditArchiveNoteChange={onDeadLetterAuditArchiveNoteChange}
            onDeadLetterAuditArchiveReject={onDeadLetterAuditArchiveReject}
            onDeadLetterAuditArchiveRefresh={onDeadLetterAuditArchiveRefresh}
            onDeadLetterAuditArchiveApprovalRefresh={onDeadLetterAuditArchiveApprovalRefresh}
            onDeadLetterAuditExport={onDeadLetterAuditExport}
            onDeadLetterAuditKeywordChange={onDeadLetterAuditKeywordChange}
            onDeadLetterAuditPageChange={onDeadLetterAuditPageChange}
            onDeadLetterAuditStatusChange={onDeadLetterAuditStatusChange}
            onHandleDeadLetter={onHandleDeadLetter}
            onNotifyOverdue={onNotifyOverdue}
            onRefresh={onRefreshNotification}
            onRefreshDeadLetterAudit={onRefreshDeadLetterAudit}
            onRefreshDeadLetter={onRefreshDeadLetter}
            onRefreshNotificationRetry={onRefreshNotificationRetry}
            onRunNotificationAutoRetry={onRunNotificationAutoRetry}
            onRetryNotification={onRetryNotification}
            overview={notificationOverview}
            retryingNotification={retryingNotification}
            retryingNotificationEventId={retryingNotificationEventId}
            running={notificationRunning}
          />
        </div>
      )}
    </div>
  );
}

function OperationAlertSlaNotificationCard({
  loading,
  deadLetterAuditAction,
  deadLetterAuditKeyword,
  deadLetterAuditLoading,
  deadLetterAuditPage,
  deadLetterAuditPageCount,
  deadLetterAuditResult,
  deadLetterAuditStatus,
  deadLetterAuditExportState,
  deadLetterAuditArchives,
  deadLetterAuditArchiveError,
  deadLetterAuditArchiveLoading,
  deadLetterAuditArchiveMessage,
  deadLetterAuditArchiveSummary,
  deadLetterAuditCreatingArchive,
  deadLetterAuditDownloadingArchive,
  deadLetterAuditDeletingArchive,
  deadLetterAuditArchiveApproving,
  deadLetterAuditArchiveRejecting,
  deadLetterAuditArchiveApprovalNote,
  deadLetterAuditArchiveApprovalOverview,
  deadLetterAuditArchiveApprovals,
  deadLetterAuditArchiveApprovalsLoading,
  deadLetterLoading,
  deadLetterNote,
  deadLetterOverview,
  deadLetterPendingAction,
  deadLetterPendingEventId,
  deadLetterRunning,
  notificationRetryLoading,
  notificationRetryOverview,
  notificationRetryRunning,
  onDeadLetterNoteChange,
  onDeadLetterAuditActionChange,
  onDeadLetterAuditArchiveApprove,
  onDeadLetterAuditArchiveCreate,
  onDeadLetterAuditArchiveDelete,
  onDeadLetterAuditArchiveDownload,
  onDeadLetterAuditArchiveNoteChange,
  onDeadLetterAuditArchiveReject,
  onDeadLetterAuditArchiveRefresh,
  onDeadLetterAuditArchiveApprovalRefresh,
  onDeadLetterAuditExport,
  onDeadLetterAuditKeywordChange,
  onDeadLetterAuditPageChange,
  onDeadLetterAuditStatusChange,
  onHandleDeadLetter,
  onNotifyOverdue,
  onRefresh,
  onRefreshDeadLetterAudit,
  onRefreshDeadLetter,
  onRefreshNotificationRetry,
  onRunNotificationAutoRetry,
  onRetryNotification,
  overview,
  retryingNotification,
  retryingNotificationEventId,
  running,
}: {
  loading: boolean;
  deadLetterAuditAction: SecurityOperationAlertSlaDeadLetterAction | '';
  deadLetterAuditKeyword: string;
  deadLetterAuditLoading: boolean;
  deadLetterAuditPage: number;
  deadLetterAuditPageCount: number;
  deadLetterAuditResult: PaginatedSecurityOperationAlertSlaDeadLetterAudits | null;
  deadLetterAuditStatus: SecurityOperationAlertSlaDeadLetterDispositionStatus | '';
  deadLetterAuditExportState: 'idle' | 'exporting' | 'success' | 'error';
  deadLetterAuditArchives: SecurityOperationAlertSlaDeadLetterAuditArchiveItem[];
  deadLetterAuditArchiveError: string | null;
  deadLetterAuditArchiveLoading: boolean;
  deadLetterAuditArchiveMessage: string | null;
  deadLetterAuditArchiveSummary: { archive_count: number; total_size_bytes: number } | null;
  deadLetterAuditCreatingArchive: boolean;
  deadLetterAuditDownloadingArchive: boolean;
  deadLetterAuditDeletingArchive: boolean;
  deadLetterAuditArchiveApproving: boolean;
  deadLetterAuditArchiveRejecting: boolean;
  deadLetterAuditArchiveApprovalNote: string;
  deadLetterAuditArchiveApprovalOverview: SecurityOperationAlertSlaDeadLetterAuditArchiveApprovalOverview | null;
  deadLetterAuditArchiveApprovals: SecurityOperationAlertSlaDeadLetterAuditArchiveApprovalItem[];
  deadLetterAuditArchiveApprovalsLoading: boolean;
  deadLetterLoading: boolean;
  deadLetterNote: string;
  deadLetterOverview: SecurityOperationAlertSlaDeadLetterOverview | null;
  deadLetterPendingAction: SecurityOperationAlertSlaDeadLetterAction | null;
  deadLetterPendingEventId: string | null;
  deadLetterRunning: boolean;
  notificationRetryLoading: boolean;
  notificationRetryOverview: SecurityOperationAlertSlaNotificationRetryOverview | null;
  notificationRetryRunning: boolean;
  onDeadLetterNoteChange: (note: string) => void;
  onDeadLetterAuditActionChange: (action: SecurityOperationAlertSlaDeadLetterAction | '') => void;
  onDeadLetterAuditArchiveApprove: (approvalId: string) => void;
  onDeadLetterAuditArchiveCreate: () => void;
  onDeadLetterAuditArchiveDelete: (archive: SecurityOperationAlertSlaDeadLetterAuditArchiveItem) => void;
  onDeadLetterAuditArchiveDownload: (archive: SecurityOperationAlertSlaDeadLetterAuditArchiveItem) => void;
  onDeadLetterAuditArchiveNoteChange: (note: string) => void;
  onDeadLetterAuditArchiveReject: (approvalId: string) => void;
  onDeadLetterAuditArchiveRefresh: () => void;
  onDeadLetterAuditArchiveApprovalRefresh: () => void;
  onDeadLetterAuditExport: () => void;
  onDeadLetterAuditKeywordChange: (keyword: string) => void;
  onDeadLetterAuditPageChange: (page: number) => void;
  onDeadLetterAuditStatusChange: (status: SecurityOperationAlertSlaDeadLetterDispositionStatus | '') => void;
  onHandleDeadLetter: (notificationEventId: string, action: SecurityOperationAlertSlaDeadLetterAction) => void;
  onNotifyOverdue: () => void;
  onRefresh: () => void;
  onRefreshDeadLetterAudit: () => void;
  onRefreshDeadLetter: () => void;
  onRefreshNotificationRetry: () => void;
  onRunNotificationAutoRetry: () => void;
  onRetryNotification: (notificationEventId: string) => void;
  overview: SecurityOperationAlertSlaNotificationOverview | null;
  retryingNotification: boolean;
  retryingNotificationEventId: string | null;
  running: boolean;
}) {
  const summary = overview?.summary;
  const policy = overview?.policy;
  const items = overview?.items ?? [];
  const hasDeliveryRisk = (summary?.failed_count ?? 0) + (summary?.partial_count ?? 0) > 0;
  const metrics = [
    { label: '待通知超时', value: `${summary?.pending_overdue_count ?? 0}`, helper: '未投递的超时告警' },
    { label: '已投递', value: `${summary?.sent_count ?? 0}`, helper: 'SLA 超时通知' },
    { label: '部分成功', value: `${summary?.partial_count ?? 0}`, helper: '站内或外部部分成功' },
    { label: '投递失败', value: `${summary?.failed_count ?? 0}`, helper: '需要检查 Webhook' },
  ];

  return (
    <Card className="border-border/70 p-4 shadow-none">
      <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-start">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge tone="ready">M89 超时通知</StatusBadge>
            <StatusBadge tone={policy?.enabled ? 'healthy' : 'planned'}>
              {policy?.enabled ? '订阅已启用' : '订阅未启用'}
            </StatusBadge>
            <StatusBadge tone={hasDeliveryRisk ? 'degraded' : 'healthy'}>
              {hasDeliveryRisk ? '存在投递风险' : '投递正常'}
            </StatusBadge>
          </div>
          <h4 className="mt-3 text-sm font-semibold">SLA 超时通知与订阅目标</h4>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">
            对已超时且未关闭的审批与归档告警按订阅策略投递站内记录和 Webhook，并保留投递审计。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button disabled={loading} onClick={onRefresh} type="button" variant="outline">
            <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} />
            刷新通知
          </Button>
          <Button disabled={loading || running || !policy?.enabled} onClick={onNotifyOverdue} type="button" variant="outline">
            <RefreshCw className={`size-4 ${running ? 'animate-spin' : ''}`} />
            {running ? '通知中' : '通知超时项'}
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="mt-4 rounded-md border bg-background/70 p-4 text-sm text-muted-foreground">
          正在加载 SLA 超时通知...
        </div>
      ) : (
        <div className="mt-4 grid gap-4">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {metrics.map((metric) => (
              <MetricCard helper={metric.helper} key={metric.label} label={metric.label} value={metric.value} />
            ))}
          </div>

          <div className="grid gap-4 xl:grid-cols-[0.82fr_1.18fr]">
            <Card className="border-border/70 p-4 shadow-none">
              <div className="mb-3 text-sm font-semibold">订阅策略</div>
              <div className="grid gap-2 text-sm">
                <SummaryTile label="渠道" value={policy?.channels.map(notificationChannelLabel).join('、') || '未配置'} />
                <SummaryTile label="Webhook" value={policy?.webhook_configured ? '已配置' : '未配置'} />
                <SummaryTile label="默认目标" value={policy?.default_targets.join('、') || '未配置'} />
                <SummaryTile label="高风险目标" value={policy?.high_risk_targets.join('、') || '未配置'} />
                <SummaryTile label="归档目标" value={policy?.archive_targets.join('、') || '未配置'} />
                <SummaryTile label="最近投递" value={formatDateTime(summary?.last_delivered_at ?? '')} />
              </div>
            </Card>

            <Card className="border-border/70 p-4 shadow-none">
              <div className="mb-3 flex items-center justify-between gap-3">
                <span className="text-sm font-semibold">最近投递审计</span>
                <StatusBadge tone={running ? 'loading' : 'mock'}>{running ? '投递中' : `${summary?.total_count ?? 0} 条`}</StatusBadge>
              </div>
              {items.length === 0 ? (
                <EmptyState
                  className="rounded-md border bg-slate-50/60 p-5"
                  description="触发 SLA 超时通知后，这里会显示投递状态、渠道和订阅目标。"
                  title="暂无 SLA 超时通知"
                />
              ) : (
                <div className="grid gap-3">
                  {items.slice(0, 5).map((item) => (
                    <OperationAlertSlaNotificationRow item={item} key={item.notification_event_id} />
                  ))}
                </div>
              )}
            </Card>
          </div>

          <OperationAlertSlaNotificationResultCard result={overview?.last_notification_result ?? null} />

          <OperationAlertSlaNotificationRetryCard
            loading={notificationRetryLoading}
            deadLetterAuditAction={deadLetterAuditAction}
            deadLetterAuditKeyword={deadLetterAuditKeyword}
            deadLetterAuditLoading={deadLetterAuditLoading}
            deadLetterAuditPage={deadLetterAuditPage}
            deadLetterAuditPageCount={deadLetterAuditPageCount}
            deadLetterAuditResult={deadLetterAuditResult}
            deadLetterAuditStatus={deadLetterAuditStatus}
            deadLetterAuditExportState={deadLetterAuditExportState}
            deadLetterAuditArchives={deadLetterAuditArchives}
            deadLetterAuditArchiveError={deadLetterAuditArchiveError}
            deadLetterAuditArchiveLoading={deadLetterAuditArchiveLoading}
            deadLetterAuditArchiveMessage={deadLetterAuditArchiveMessage}
            deadLetterAuditArchiveSummary={deadLetterAuditArchiveSummary}
            deadLetterAuditCreatingArchive={deadLetterAuditCreatingArchive}
            deadLetterAuditDownloadingArchive={deadLetterAuditDownloadingArchive}
            deadLetterAuditDeletingArchive={deadLetterAuditDeletingArchive}
            deadLetterAuditArchiveApproving={deadLetterAuditArchiveApproving}
            deadLetterAuditArchiveRejecting={deadLetterAuditArchiveRejecting}
            deadLetterAuditArchiveApprovalNote={deadLetterAuditArchiveApprovalNote}
            deadLetterAuditArchiveApprovalOverview={deadLetterAuditArchiveApprovalOverview}
            deadLetterAuditArchiveApprovals={deadLetterAuditArchiveApprovals}
            deadLetterAuditArchiveApprovalsLoading={deadLetterAuditArchiveApprovalsLoading}
            deadLetterLoading={deadLetterLoading}
            deadLetterNote={deadLetterNote}
            deadLetterOverview={deadLetterOverview}
            deadLetterPendingAction={deadLetterPendingAction}
            deadLetterPendingEventId={deadLetterPendingEventId}
            deadLetterRunning={deadLetterRunning}
            onDeadLetterNoteChange={onDeadLetterNoteChange}
            onDeadLetterAuditActionChange={onDeadLetterAuditActionChange}
            onDeadLetterAuditArchiveApprove={onDeadLetterAuditArchiveApprove}
            onDeadLetterAuditArchiveCreate={onDeadLetterAuditArchiveCreate}
            onDeadLetterAuditArchiveDelete={onDeadLetterAuditArchiveDelete}
            onDeadLetterAuditArchiveDownload={onDeadLetterAuditArchiveDownload}
            onDeadLetterAuditArchiveNoteChange={onDeadLetterAuditArchiveNoteChange}
            onDeadLetterAuditArchiveReject={onDeadLetterAuditArchiveReject}
            onDeadLetterAuditArchiveRefresh={onDeadLetterAuditArchiveRefresh}
            onDeadLetterAuditArchiveApprovalRefresh={onDeadLetterAuditArchiveApprovalRefresh}
            onDeadLetterAuditExport={onDeadLetterAuditExport}
            onDeadLetterAuditKeywordChange={onDeadLetterAuditKeywordChange}
            onDeadLetterAuditPageChange={onDeadLetterAuditPageChange}
            onDeadLetterAuditStatusChange={onDeadLetterAuditStatusChange}
            onHandleDeadLetter={onHandleDeadLetter}
            onRefresh={onRefreshNotificationRetry}
            onRefreshDeadLetterAudit={onRefreshDeadLetterAudit}
            onRefreshDeadLetter={onRefreshDeadLetter}
            onRetryNotification={onRetryNotification}
            onRunAutoRetry={onRunNotificationAutoRetry}
            overview={notificationRetryOverview}
            retryingNotification={retryingNotification}
            retryingNotificationEventId={retryingNotificationEventId}
            running={notificationRetryRunning}
          />
        </div>
      )}
    </Card>
  );
}

function OperationAlertSlaNotificationRetryCard({
  loading,
  deadLetterAuditAction,
  deadLetterAuditKeyword,
  deadLetterAuditLoading,
  deadLetterAuditPage,
  deadLetterAuditPageCount,
  deadLetterAuditResult,
  deadLetterAuditStatus,
  deadLetterAuditExportState,
  deadLetterAuditArchives,
  deadLetterAuditArchiveError,
  deadLetterAuditArchiveLoading,
  deadLetterAuditArchiveMessage,
  deadLetterAuditArchiveSummary,
  deadLetterAuditCreatingArchive,
  deadLetterAuditDownloadingArchive,
  deadLetterAuditDeletingArchive,
  deadLetterAuditArchiveApproving,
  deadLetterAuditArchiveRejecting,
  deadLetterAuditArchiveApprovalNote,
  deadLetterAuditArchiveApprovalOverview,
  deadLetterAuditArchiveApprovals,
  deadLetterAuditArchiveApprovalsLoading,
  deadLetterLoading,
  deadLetterNote,
  deadLetterOverview,
  deadLetterPendingAction,
  deadLetterPendingEventId,
  deadLetterRunning,
  onDeadLetterNoteChange,
  onDeadLetterAuditActionChange,
  onDeadLetterAuditArchiveApprove,
  onDeadLetterAuditArchiveCreate,
  onDeadLetterAuditArchiveDelete,
  onDeadLetterAuditArchiveDownload,
  onDeadLetterAuditArchiveNoteChange,
  onDeadLetterAuditArchiveReject,
  onDeadLetterAuditArchiveRefresh,
  onDeadLetterAuditArchiveApprovalRefresh,
  onDeadLetterAuditExport,
  onDeadLetterAuditKeywordChange,
  onDeadLetterAuditPageChange,
  onDeadLetterAuditStatusChange,
  onHandleDeadLetter,
  onRefresh,
  onRefreshDeadLetterAudit,
  onRefreshDeadLetter,
  onRetryNotification,
  onRunAutoRetry,
  overview,
  retryingNotification,
  retryingNotificationEventId,
  running,
}: {
  loading: boolean;
  deadLetterAuditAction: SecurityOperationAlertSlaDeadLetterAction | '';
  deadLetterAuditKeyword: string;
  deadLetterAuditLoading: boolean;
  deadLetterAuditPage: number;
  deadLetterAuditPageCount: number;
  deadLetterAuditResult: PaginatedSecurityOperationAlertSlaDeadLetterAudits | null;
  deadLetterAuditStatus: SecurityOperationAlertSlaDeadLetterDispositionStatus | '';
  deadLetterAuditExportState: 'idle' | 'exporting' | 'success' | 'error';
  deadLetterAuditArchives: SecurityOperationAlertSlaDeadLetterAuditArchiveItem[];
  deadLetterAuditArchiveError: string | null;
  deadLetterAuditArchiveLoading: boolean;
  deadLetterAuditArchiveMessage: string | null;
  deadLetterAuditArchiveSummary: { archive_count: number; total_size_bytes: number } | null;
  deadLetterAuditCreatingArchive: boolean;
  deadLetterAuditDownloadingArchive: boolean;
  deadLetterAuditDeletingArchive: boolean;
  deadLetterAuditArchiveApproving: boolean;
  deadLetterAuditArchiveRejecting: boolean;
  deadLetterAuditArchiveApprovalNote: string;
  deadLetterAuditArchiveApprovalOverview: SecurityOperationAlertSlaDeadLetterAuditArchiveApprovalOverview | null;
  deadLetterAuditArchiveApprovals: SecurityOperationAlertSlaDeadLetterAuditArchiveApprovalItem[];
  deadLetterAuditArchiveApprovalsLoading: boolean;
  deadLetterLoading: boolean;
  deadLetterNote: string;
  deadLetterOverview: SecurityOperationAlertSlaDeadLetterOverview | null;
  deadLetterPendingAction: SecurityOperationAlertSlaDeadLetterAction | null;
  deadLetterPendingEventId: string | null;
  deadLetterRunning: boolean;
  onDeadLetterNoteChange: (note: string) => void;
  onDeadLetterAuditActionChange: (action: SecurityOperationAlertSlaDeadLetterAction | '') => void;
  onDeadLetterAuditArchiveApprove: (approvalId: string) => void;
  onDeadLetterAuditArchiveCreate: () => void;
  onDeadLetterAuditArchiveDelete: (archive: SecurityOperationAlertSlaDeadLetterAuditArchiveItem) => void;
  onDeadLetterAuditArchiveDownload: (archive: SecurityOperationAlertSlaDeadLetterAuditArchiveItem) => void;
  onDeadLetterAuditArchiveNoteChange: (note: string) => void;
  onDeadLetterAuditArchiveReject: (approvalId: string) => void;
  onDeadLetterAuditArchiveRefresh: () => void;
  onDeadLetterAuditArchiveApprovalRefresh: () => void;
  onDeadLetterAuditExport: () => void;
  onDeadLetterAuditKeywordChange: (keyword: string) => void;
  onDeadLetterAuditPageChange: (page: number) => void;
  onDeadLetterAuditStatusChange: (status: SecurityOperationAlertSlaDeadLetterDispositionStatus | '') => void;
  onHandleDeadLetter: (notificationEventId: string, action: SecurityOperationAlertSlaDeadLetterAction) => void;
  onRefresh: () => void;
  onRefreshDeadLetterAudit: () => void;
  onRefreshDeadLetter: () => void;
  onRetryNotification: (notificationEventId: string) => void;
  onRunAutoRetry: () => void;
  overview: SecurityOperationAlertSlaNotificationRetryOverview | null;
  retryingNotification: boolean;
  retryingNotificationEventId: string | null;
  running: boolean;
}) {
  const summary = overview?.summary;
  const policy = overview?.policy;
  const retryableItems = overview?.retryable_items ?? [];
  const deadLetterItems = overview?.dead_letter_items ?? [];
  const hasDeadLetters = (summary?.dead_letter_count ?? 0) > 0;
  const metrics = [
    { label: '待自动重试', value: `${summary?.pending_auto_retry_count ?? 0}`, helper: '满足退避与次数限制' },
    { label: '失败投递', value: `${summary?.failed_notification_count ?? 0}`, helper: '最近窗口内失败' },
    { label: '部分成功', value: `${summary?.partial_notification_count ?? 0}`, helper: '站内或外部部分成功' },
    { label: '死信', value: `${summary?.dead_letter_count ?? 0}`, helper: '达到最大重试次数' },
  ];

  return (
    <Card className="border-border/70 bg-background/80 p-4 shadow-none">
      <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-start">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge tone="ready">M90 重试死信</StatusBadge>
            <StatusBadge tone={overview?.scheduler_enabled ? 'healthy' : 'planned'}>
              {overview?.scheduler_enabled ? '任务已启用' : '任务未启用'}
            </StatusBadge>
            <StatusBadge tone={hasDeadLetters ? 'unavailable' : (summary?.pending_auto_retry_count ?? 0) > 0 ? 'degraded' : 'healthy'}>
              {hasDeadLetters ? '存在死信' : (summary?.pending_auto_retry_count ?? 0) > 0 ? '待重试' : '链路正常'}
            </StatusBadge>
          </div>
          <h4 className="mt-3 text-sm font-semibold">SLA 通知自动重试与失败死信</h4>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">
            自动扫描失败或部分成功的 SLA 超时通知，满足退避和次数限制后追加重试事件；超过最大重试次数的记录进入死信队列。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button disabled={loading} onClick={onRefresh} type="button" variant="outline">
            <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} />
            刷新重试
          </Button>
          <Button disabled={loading || running || !policy?.auto_retry_enabled} onClick={onRunAutoRetry} type="button" variant="outline">
            <RefreshCw className={`size-4 ${running ? 'animate-spin' : ''}`} />
            {running ? '扫描中' : '立即扫描重试'}
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="mt-4 rounded-md border bg-background/70 p-4 text-sm text-muted-foreground">
          正在加载 SLA 通知重试状态...
        </div>
      ) : (
        <div className="mt-4 grid gap-4">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {metrics.map((metric) => (
              <MetricCard helper={metric.helper} key={metric.label} label={metric.label} value={metric.value} />
            ))}
          </div>

          <div className="grid gap-4 xl:grid-cols-[0.78fr_1.22fr]">
            <Card className="border-border/70 p-4 shadow-none">
              <div className="mb-3 text-sm font-semibold">重试策略</div>
              <div className="grid gap-2 text-sm">
                <SummaryTile label="任务开关" value={overview?.scheduler_enabled ? '已启用' : '未启用'} />
                <SummaryTile label="单批数量" value={`${policy?.retry_batch_size ?? 0}`} />
                <SummaryTile label="最大重试" value={`${policy?.max_retry_count ?? 0} 次`} />
                <SummaryTile label="退避时间" value={`${policy?.retry_backoff_seconds ?? 0} 秒`} />
                <SummaryTile label="回看窗口" value={`${policy?.lookback_hours ?? 0} 小时`} />
                <SummaryTile label="最早可重试" value={formatDateTime(summary?.oldest_retryable_at ?? '')} />
                <SummaryTile label="最近死信" value={formatDateTime(summary?.last_dead_letter_at ?? '')} />
              </div>
            </Card>

            <Card className="border-border/70 p-4 shadow-none">
              <div className="mb-3 flex items-center justify-between gap-3">
                <span className="text-sm font-semibold">可重试队列</span>
                <StatusBadge tone={running || overview?.running ? 'loading' : 'mock'}>
                  {running || overview?.running ? '执行中' : `${retryableItems.length} 条`}
                </StatusBadge>
              </div>
              {retryableItems.length === 0 ? (
                <EmptyState
                  className="rounded-md border bg-slate-50/60 p-5"
                  description="当前没有达到退避时间且未超过最大重试次数的 SLA 超时通知。"
                  title="暂无待重试通知"
                />
              ) : (
                <div className="grid gap-3">
                  {retryableItems.slice(0, 5).map((item) => (
                    <OperationAlertSlaNotificationRetryRow
                      item={item}
                      key={item.notification_event_id}
                      onRetry={onRetryNotification}
                      retrying={retryingNotification && retryingNotificationEventId === item.notification_event_id}
                    />
                  ))}
                </div>
              )}
            </Card>
          </div>

          <Card className="border-border/70 p-4 shadow-none">
            <div className="mb-3 flex items-center justify-between gap-3">
              <span className="text-sm font-semibold">失败死信</span>
              <StatusBadge tone={hasDeadLetters ? 'unavailable' : 'healthy'}>
                {hasDeadLetters ? `${deadLetterItems.length} 条` : '无死信'}
              </StatusBadge>
            </div>
            {deadLetterItems.length === 0 ? (
              <EmptyState
                className="rounded-md border bg-slate-50/60 p-5"
                description="失败通知在达到最大重试次数后会进入这里，便于人工检查订阅策略和 Webhook。"
                title="暂无失败死信"
              />
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {deadLetterItems.slice(0, 6).map((item) => (
                  <OperationAlertSlaDeadLetterRow item={item} key={item.notification_event_id} />
                ))}
              </div>
            )}
          </Card>

          <OperationAlertSlaDeadLetterDispositionCard
            loading={deadLetterLoading}
            note={deadLetterNote}
            onNoteChange={onDeadLetterNoteChange}
            onRefresh={onRefreshDeadLetter}
            onHandle={onHandleDeadLetter}
            overview={deadLetterOverview}
            pendingAction={deadLetterPendingAction}
            pendingEventId={deadLetterPendingEventId}
            running={deadLetterRunning}
          />

          <OperationAlertSlaDeadLetterAuditCard
            action={deadLetterAuditAction}
            archives={deadLetterAuditArchives}
            archiveError={deadLetterAuditArchiveError}
            archiveLoading={deadLetterAuditArchiveLoading}
            archiveMessage={deadLetterAuditArchiveMessage}
            archiveSummary={deadLetterAuditArchiveSummary}
            archiveApprovalNote={deadLetterAuditArchiveApprovalNote}
            archiveApprovalOverview={deadLetterAuditArchiveApprovalOverview}
            archiveApprovals={deadLetterAuditArchiveApprovals}
            archiveApprovalsLoading={deadLetterAuditArchiveApprovalsLoading}
            creatingArchive={deadLetterAuditCreatingArchive}
            downloadingArchive={deadLetterAuditDownloadingArchive}
            deletingArchive={deadLetterAuditDeletingArchive}
            exportState={deadLetterAuditExportState}
            keyword={deadLetterAuditKeyword}
            loading={deadLetterAuditLoading}
            approvingArchive={deadLetterAuditArchiveApproving}
            rejectingArchive={deadLetterAuditArchiveRejecting}
            onActionChange={onDeadLetterAuditActionChange}
            onArchiveApprove={onDeadLetterAuditArchiveApprove}
            onArchiveCreate={onDeadLetterAuditArchiveCreate}
            onArchiveDelete={onDeadLetterAuditArchiveDelete}
            onArchiveDownload={onDeadLetterAuditArchiveDownload}
            onArchiveNoteChange={onDeadLetterAuditArchiveNoteChange}
            onArchiveReject={onDeadLetterAuditArchiveReject}
            onArchiveRefresh={onDeadLetterAuditArchiveRefresh}
            onArchiveApprovalRefresh={onDeadLetterAuditArchiveApprovalRefresh}
            onExport={onDeadLetterAuditExport}
            onKeywordChange={onDeadLetterAuditKeywordChange}
            onPageChange={onDeadLetterAuditPageChange}
            onRefresh={onRefreshDeadLetterAudit}
            onStatusChange={onDeadLetterAuditStatusChange}
            page={deadLetterAuditPage}
            pageCount={deadLetterAuditPageCount}
            result={deadLetterAuditResult}
            status={deadLetterAuditStatus}
          />

          <OperationAlertSlaNotificationRetryResultCard result={overview?.last_auto_retry_result ?? null} />
        </div>
      )}
    </Card>
  );
}

function OperationAlertSlaNotificationRetryRow({
  item,
  onRetry,
  retrying,
}: {
  item: SecurityOperationAlertSlaNotificationItem;
  onRetry: (notificationEventId: string) => void;
  retrying: boolean;
}) {
  return (
    <div className="rounded-md border bg-background/75 p-3">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge tone={notificationStatusTone(item.status)}>{notificationStatusLabel(item.status)}</StatusBadge>
            <span className="text-xs text-muted-foreground">重试 {item.retry_count} 次</span>
            <span className="text-xs text-muted-foreground">{item.channels.map(notificationChannelLabel).join('、') || '未配置渠道'}</span>
          </div>
          <div className="mt-2 truncate text-sm font-medium">{item.title}</div>
          <div className="mt-1 line-clamp-1 text-xs text-muted-foreground">{item.message}</div>
        </div>
        <Button disabled={retrying || item.dead_lettered} onClick={() => onRetry(item.notification_event_id)} size="sm" type="button" variant="outline">
          {retrying ? '重试中' : '重试'}
        </Button>
      </div>
      <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
        <span>投递：{formatDateTime(item.delivered_at)}</span>
        <span>Webhook：{item.webhook_status ?? '未配置'}</span>
        {item.webhook_error ? <span className="text-destructive">{item.webhook_error}</span> : null}
      </div>
    </div>
  );
}

function OperationAlertSlaDeadLetterDispositionCard({
  loading,
  note,
  onHandle,
  onNoteChange,
  onRefresh,
  overview,
  pendingAction,
  pendingEventId,
  running,
}: {
  loading: boolean;
  note: string;
  onHandle: (notificationEventId: string, action: SecurityOperationAlertSlaDeadLetterAction) => void;
  onNoteChange: (note: string) => void;
  onRefresh: () => void;
  overview: SecurityOperationAlertSlaDeadLetterOverview | null;
  pendingAction: SecurityOperationAlertSlaDeadLetterAction | null;
  pendingEventId: string | null;
  running: boolean;
}) {
  const summary = overview?.summary;
  const items = overview?.items ?? [];
  const activeItems = items.filter((item) => item.disposition_status === 'OPEN' || item.disposition_status === 'CLAIMED');
  const metrics = [
    { label: '待处理', value: `${summary?.open_count ?? 0}`, helper: '未认领死信' },
    { label: '已认领', value: `${summary?.claimed_count ?? 0}`, helper: '处理中死信' },
    { label: '已重投', value: `${summary?.requeued_count ?? 0}`, helper: '重新进入投递链路' },
    { label: '已关闭', value: `${summary?.closed_count ?? 0}`, helper: '人工确认关闭' },
  ];

  return (
    <Card className="border-border/70 p-4 shadow-none">
      <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-start">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge tone="ready">M91 死信处置</StatusBadge>
            <StatusBadge tone={(summary?.open_count ?? 0) > 0 ? 'degraded' : 'healthy'}>
              {(summary?.open_count ?? 0) > 0 ? '待处理' : '已闭环'}
            </StatusBadge>
          </div>
          <h4 className="mt-3 text-sm font-semibold">SLA 通知死信处置闭环</h4>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">
            对达到最大重试次数的 SLA 通知死信进行认领、重新投递或关闭，处置动作会写入事件审计。
          </p>
        </div>
        <Button disabled={loading} onClick={onRefresh} type="button" variant="outline">
          <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} />
          刷新死信
        </Button>
      </div>

      {loading ? (
        <div className="mt-4 rounded-md border bg-background/70 p-4 text-sm text-muted-foreground">
          正在加载 SLA 通知死信处置状态...
        </div>
      ) : (
        <div className="mt-4 grid gap-4">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {metrics.map((metric) => (
              <MetricCard helper={metric.helper} key={metric.label} label={metric.label} value={metric.value} />
            ))}
          </div>

          <div className="grid gap-4 xl:grid-cols-[0.78fr_1.22fr]">
            <Card className="border-border/70 p-4 shadow-none">
              <div className="mb-3 text-sm font-semibold">处置备注</div>
              <Input
                maxLength={500}
                onChange={(event) => onNoteChange(event.target.value)}
                placeholder="填写认领、重投或关闭原因"
                value={note}
              />
              <div className="mt-3 grid gap-2 text-sm">
                <SummaryTile label="最早待处理" value={formatDateTime(summary?.oldest_open_at ?? '')} />
                <SummaryTile label="最近处置" value={formatDateTime(summary?.last_action_at ?? '')} />
              </div>
              <OperationAlertSlaDeadLetterActionResultCard result={overview?.last_action_result ?? null} />
            </Card>

            <Card className="border-border/70 p-4 shadow-none">
              <div className="mb-3 flex items-center justify-between gap-3">
                <span className="text-sm font-semibold">处置队列</span>
                <StatusBadge tone={running ? 'loading' : 'mock'}>{running ? '处理中' : `${activeItems.length} 条`}</StatusBadge>
              </div>
              {activeItems.length === 0 ? (
                <EmptyState
                  className="rounded-md border bg-slate-50/60 p-5"
                  description="当前没有待处理或已认领的 SLA 通知死信。"
                  title="暂无待处置死信"
                />
              ) : (
                <div className="grid gap-3">
                  {activeItems.slice(0, 6).map((item) => (
                    <OperationAlertSlaDeadLetterDispositionRow
                      item={item}
                      key={item.notification_event_id}
                      onHandle={onHandle}
                      pendingAction={pendingAction}
                      pending={running && pendingEventId === item.notification_event_id}
                    />
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      )}
    </Card>
  );
}

function OperationAlertSlaDeadLetterDispositionRow({
  item,
  onHandle,
  pending,
  pendingAction,
}: {
  item: SecurityOperationAlertSlaDeadLetterItem;
  onHandle: (notificationEventId: string, action: SecurityOperationAlertSlaDeadLetterAction) => void;
  pending: boolean;
  pendingAction: SecurityOperationAlertSlaDeadLetterAction | null;
}) {
  const closed = item.disposition_status === 'CLOSED' || item.disposition_status === 'REQUEUED';

  return (
    <div className="rounded-md border bg-background/75 p-3">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge tone={deadLetterDispositionTone(item.disposition_status)}>
              {deadLetterDispositionLabel(item.disposition_status)}
            </StatusBadge>
            <StatusBadge tone={notificationStatusTone(item.status)}>{notificationStatusLabel(item.status)}</StatusBadge>
            <span className="text-xs text-muted-foreground">重试 {item.retry_count} 次</span>
          </div>
          <div className="mt-2 truncate text-sm font-medium">{item.title}</div>
          <div className="mt-1 line-clamp-1 text-xs text-muted-foreground">{item.dead_letter_reason}</div>
          {item.disposition_note ? (
            <div className="mt-1 line-clamp-1 text-xs text-muted-foreground">备注：{item.disposition_note}</div>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Button disabled={pending || closed || item.disposition_status === 'CLAIMED'} onClick={() => onHandle(item.notification_event_id, 'CLAIM')} size="sm" type="button" variant="outline">
            {pending && pendingAction === 'CLAIM' ? '认领中' : '认领'}
          </Button>
          <Button disabled={pending || closed} onClick={() => onHandle(item.notification_event_id, 'REQUEUE')} size="sm" type="button" variant="outline">
            {pending && pendingAction === 'REQUEUE' ? '重投中' : '重新投递'}
          </Button>
          <Button disabled={pending || closed} onClick={() => onHandle(item.notification_event_id, 'CLOSE')} size="sm" type="button" variant="outline">
            {pending && pendingAction === 'CLOSE' ? '关闭中' : '关闭'}
          </Button>
        </div>
      </div>
      <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
        <span>投递：{formatDateTime(item.delivered_at)}</span>
        <span>Webhook：{item.webhook_status ?? '未配置'}</span>
        {item.handled_at ? <span>最近处置：{formatDateTime(item.handled_at)}</span> : null}
      </div>
    </div>
  );
}

function OperationAlertSlaDeadLetterActionResultCard({
  result,
}: {
  result: SecurityOperationAlertSlaDeadLetterActionResult | null;
}) {
  if (!result) {
    return (
      <div className="mt-3 rounded-md border bg-background/70 p-3">
        <div className="mb-1 flex items-center justify-between gap-3">
          <span className="text-sm font-semibold">最近处置</span>
          <StatusBadge tone="planned">暂无结果</StatusBadge>
        </div>
        <p className="text-xs leading-5 text-muted-foreground">执行认领、重新投递或关闭后会显示处置摘要。</p>
      </div>
    );
  }

  return (
    <div className="mt-3 rounded-md border bg-background/70 p-3">
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-sm font-semibold">最近处置</span>
        <StatusBadge tone={deadLetterDispositionTone(result.disposition_status)}>
          {deadLetterActionLabel(result.action)}
        </StatusBadge>
      </div>
      <div className="grid gap-2 text-sm">
        <SummaryTile label="状态" value={deadLetterDispositionLabel(result.disposition_status)} />
        <SummaryTile label="完成时间" value={formatDateTime(result.handled_at)} />
      </div>
      {result.note ? <div className="mt-2 text-xs text-muted-foreground">备注：{result.note}</div> : null}
    </div>
  );
}

function OperationAlertSlaDeadLetterAuditCard({
  action,
  archives,
  archiveError,
  archiveLoading,
  archiveMessage,
  archiveSummary,
  archiveApprovalNote,
  archiveApprovalOverview,
  archiveApprovals,
  archiveApprovalsLoading,
  approvingArchive,
  creatingArchive,
  deletingArchive,
  downloadingArchive,
  exportState,
  keyword,
  loading,
  onActionChange,
  onArchiveApprove,
  onArchiveCreate,
  onArchiveDelete,
  onArchiveDownload,
  onArchiveNoteChange,
  onArchiveReject,
  onArchiveRefresh,
  onArchiveApprovalRefresh,
  onExport,
  onKeywordChange,
  onPageChange,
  onRefresh,
  onStatusChange,
  page,
  pageCount,
  rejectingArchive,
  result,
  status,
}: {
  action: SecurityOperationAlertSlaDeadLetterAction | '';
  archives: SecurityOperationAlertSlaDeadLetterAuditArchiveItem[];
  archiveError: string | null;
  archiveLoading: boolean;
  archiveMessage: string | null;
  archiveSummary: { archive_count: number; total_size_bytes: number } | null;
  archiveApprovalNote: string;
  archiveApprovalOverview: SecurityOperationAlertSlaDeadLetterAuditArchiveApprovalOverview | null;
  archiveApprovals: SecurityOperationAlertSlaDeadLetterAuditArchiveApprovalItem[];
  archiveApprovalsLoading: boolean;
  approvingArchive: boolean;
  creatingArchive: boolean;
  deletingArchive: boolean;
  downloadingArchive: boolean;
  exportState: 'idle' | 'exporting' | 'success' | 'error';
  keyword: string;
  loading: boolean;
  onActionChange: (action: SecurityOperationAlertSlaDeadLetterAction | '') => void;
  onArchiveApprove: (approvalId: string) => void;
  onArchiveCreate: () => void;
  onArchiveDelete: (archive: SecurityOperationAlertSlaDeadLetterAuditArchiveItem) => void;
  onArchiveDownload: (archive: SecurityOperationAlertSlaDeadLetterAuditArchiveItem) => void;
  onArchiveNoteChange: (note: string) => void;
  onArchiveReject: (approvalId: string) => void;
  onArchiveRefresh: () => void;
  onArchiveApprovalRefresh: () => void;
  onExport: () => void;
  onKeywordChange: (keyword: string) => void;
  onPageChange: (page: number) => void;
  onRefresh: () => void;
  onStatusChange: (status: SecurityOperationAlertSlaDeadLetterDispositionStatus | '') => void;
  page: number;
  pageCount: number;
  rejectingArchive: boolean;
  result: PaginatedSecurityOperationAlertSlaDeadLetterAudits | null;
  status: SecurityOperationAlertSlaDeadLetterDispositionStatus | '';
}) {
  const items = result?.items ?? [];
  const total = result?.total ?? 0;
  const hasFilters = Boolean(keyword || action || status);
  const exporting = exportState === 'exporting';

  const resetFilters = () => {
    onKeywordChange('');
    onActionChange('');
    onStatusChange('');
    onPageChange(1);
  };

  return (
    <Card className="border-border/70 p-4 shadow-none">
      <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-start">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge tone="ready">M92 处置审计</StatusBadge>
            <StatusBadge tone={total > 0 ? 'healthy' : 'planned'}>{total > 0 ? `${total} 条记录` : '暂无记录'}</StatusBadge>
          </div>
          <h4 className="mt-3 text-sm font-semibold">SLA 死信处置审计时间线</h4>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">
            按死信处置事件追踪认领、重新投递和关闭动作，支持通过标题、备注、请求 ID 与 Trace ID 快速定位。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button disabled={loading || exporting || total === 0} onClick={onExport} type="button" variant="outline">
            <Download className="size-4" />
            {exporting ? '正在导出' : '导出 CSV'}
          </Button>
          <Button disabled={loading} onClick={onRefresh} type="button" variant="outline">
            <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} />
            刷新审计
          </Button>
        </div>
      </div>

      {exportState === 'success' ? (
        <div className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          当前筛选条件下的 SLA 死信处置审计已导出。
        </div>
      ) : exportState === 'error' ? (
        <div className="mt-4 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          SLA 死信处置审计导出失败，请稍后重试。
        </div>
      ) : null}

      <div className="mt-4 grid gap-2 lg:grid-cols-[1fr_150px_150px_auto]">
        <label className="flex h-9 min-w-0 items-center gap-2 rounded-md border bg-background/70 px-3 text-sm">
          <Search className="size-4 shrink-0 text-muted-foreground" />
          <input
            className="min-w-0 flex-1 bg-transparent outline-none"
            onChange={(event) => onKeywordChange(event.target.value)}
            placeholder="搜索标题、备注、请求 ID、Trace ID"
            value={keyword}
          />
        </label>
        <select
          className="h-9 rounded-md border bg-background/80 px-3 text-sm"
          onChange={(event) => onActionChange(event.target.value as SecurityOperationAlertSlaDeadLetterAction | '')}
          value={action}
        >
          <option value="">全部动作</option>
          <option value="CLAIM">认领</option>
          <option value="REQUEUE">重新投递</option>
          <option value="CLOSE">关闭</option>
        </select>
        <select
          className="h-9 rounded-md border bg-background/80 px-3 text-sm"
          onChange={(event) => onStatusChange(event.target.value as SecurityOperationAlertSlaDeadLetterDispositionStatus | '')}
          value={status}
        >
          <option value="">全部状态</option>
          <option value="OPEN">待处理</option>
          <option value="CLAIMED">已认领</option>
          <option value="REQUEUED">已重投</option>
          <option value="CLOSED">已关闭</option>
        </select>
        <Button disabled={!hasFilters} onClick={resetFilters} type="button" variant="outline">
          重置筛选
        </Button>
      </div>

      {loading ? (
        <div className="mt-4 rounded-md border bg-background/70 p-4 text-sm text-muted-foreground">
          正在加载死信处置审计...
        </div>
      ) : items.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            className="rounded-md border bg-slate-50/60 p-5"
            description={hasFilters ? '当前筛选条件下没有匹配的死信处置审计记录。' : '执行死信认领、重新投递或关闭后，这里会形成审计时间线。'}
            title={hasFilters ? '未找到审计记录' : '暂无处置审计'}
          />
        </div>
      ) : (
        <div className="mt-4 grid gap-3">
          {items.map((item) => (
            <OperationAlertSlaDeadLetterAuditRow item={item} key={item.event_id} />
          ))}
        </div>
      )}

      <div className="mt-4 flex flex-col justify-between gap-3 border-t pt-3 text-sm text-muted-foreground md:flex-row md:items-center">
        <span>
          共 {total} 条，第 {page} / {pageCount} 页
        </span>
        <div className="flex gap-2">
          <Button disabled={loading || page <= 1} onClick={() => onPageChange(Math.max(1, page - 1))} size="sm" type="button" variant="outline">
            <ChevronLeft className="size-4" />
            上一页
          </Button>
          <Button disabled={loading || page >= pageCount} onClick={() => onPageChange(Math.min(pageCount, page + 1))} size="sm" type="button" variant="outline">
            下一页
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      <OperationAlertSlaDeadLetterAuditArchivePanel
        archives={archives}
        approvalNote={archiveApprovalNote}
        approvalOverview={archiveApprovalOverview}
        approvals={archiveApprovals}
        approvalsLoading={archiveApprovalsLoading}
        errorMessage={archiveError}
        isApproving={approvingArchive}
        isCreating={creatingArchive}
        isDeleting={deletingArchive}
        isDownloading={downloadingArchive}
        isRejecting={rejectingArchive}
        loading={archiveLoading}
        message={archiveMessage}
        onApprove={onArchiveApprove}
        onCreate={onArchiveCreate}
        onDelete={onArchiveDelete}
        onDownload={onArchiveDownload}
        onNoteChange={onArchiveNoteChange}
        onReject={onArchiveReject}
        onApprovalRefresh={onArchiveApprovalRefresh}
        onRefresh={onArchiveRefresh}
        summary={archiveSummary}
      />
    </Card>
  );
}

function OperationAlertSlaDeadLetterAuditArchivePanel({
  archives,
  approvalNote,
  approvalOverview,
  approvals,
  approvalsLoading,
  errorMessage,
  isApproving,
  isCreating,
  isDeleting,
  isDownloading,
  isRejecting,
  loading,
  message,
  onApprove,
  onCreate,
  onDelete,
  onDownload,
  onNoteChange,
  onReject,
  onApprovalRefresh,
  onRefresh,
  summary,
}: {
  archives: SecurityOperationAlertSlaDeadLetterAuditArchiveItem[];
  approvalNote: string;
  approvalOverview: SecurityOperationAlertSlaDeadLetterAuditArchiveApprovalOverview | null;
  approvals: SecurityOperationAlertSlaDeadLetterAuditArchiveApprovalItem[];
  approvalsLoading: boolean;
  errorMessage: string | null;
  isApproving: boolean;
  isCreating: boolean;
  isDeleting: boolean;
  isDownloading: boolean;
  isRejecting: boolean;
  loading: boolean;
  message: string | null;
  onApprove: (approvalId: string) => void;
  onCreate: () => void;
  onDelete: (archive: SecurityOperationAlertSlaDeadLetterAuditArchiveItem) => void;
  onDownload: (archive: SecurityOperationAlertSlaDeadLetterAuditArchiveItem) => void;
  onNoteChange: (note: string) => void;
  onReject: (approvalId: string) => void;
  onApprovalRefresh: () => void;
  onRefresh: () => void;
  summary: { archive_count: number; total_size_bytes: number } | null;
}) {
  const [selectedApprovalId, setSelectedApprovalId] = useState<string | null>(null);
  const [approvalKeyword, setApprovalKeyword] = useState('');
  const [approvalStatus, setApprovalStatus] = useState<SecurityOperationAlertSlaDeadLetterAuditArchiveApprovalItem['status'] | ''>('');
  const [approvalPendingOnly, setApprovalPendingOnly] = useState(false);
  const pendingApprovals = approvals.filter((approval) => approval.status === 'PENDING');
  const filteredApprovals = useMemo(() => {
    const keyword = approvalKeyword.trim().toLowerCase();
    return approvals
      .filter((approval) => !approvalPendingOnly || approval.status === 'PENDING')
      .filter((approval) => !approvalStatus || approval.status === approvalStatus)
      .filter((approval) => {
        if (!keyword) return true;
        return [
          approval.id,
          approval.archive_id,
          approval.archive_key,
          approval.archive_file_name,
          approval.reason,
          approval.requested_by?.name,
          approval.requested_by?.email,
          approval.reviewed_by?.name,
          approval.reviewed_by?.email,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(keyword));
      });
  }, [approvalKeyword, approvalPendingOnly, approvalStatus, approvals]);
  const filteredPendingCount = filteredApprovals.filter((approval) => approval.status === 'PENDING').length;
  const hasApprovalFilters = Boolean(approvalKeyword || approvalStatus || approvalPendingOnly);
  const selectedApproval = selectedApprovalId
    ? filteredApprovals.find((approval) => approval.id === selectedApprovalId) ??
      approvals.find((approval) => approval.id === selectedApprovalId) ??
      null
    : filteredApprovals[0] ?? null;
  const activeApprovalId = selectedApproval?.id ?? null;
  const approvalDetailQuery = useQuery({
    enabled: Boolean(activeApprovalId),
    queryKey: ['security-operation-alert-sla-dead-letter-audit-archive-approval', activeApprovalId],
    queryFn: () => getSecurityOperationAlertSlaDeadLetterAuditArchiveApproval(activeApprovalId ?? ''),
  });

  useEffect(() => {
    if (selectedApprovalId && !approvals.some((approval) => approval.id === selectedApprovalId)) {
      setSelectedApprovalId(null);
    }
  }, [approvals, selectedApprovalId]);

  useEffect(() => {
    if (selectedApprovalId && filteredApprovals.length > 0 && !filteredApprovals.some((approval) => approval.id === selectedApprovalId)) {
      setSelectedApprovalId(filteredApprovals[0]?.id ?? null);
    }
  }, [filteredApprovals, selectedApprovalId]);

  const handleDelete = (archive: SecurityOperationAlertSlaDeadLetterAuditArchiveItem) => {
    const confirmed = window.confirm(`确认申请删除归档 ${archive.file_name}？该操作需要审批后生效。`);
    if (confirmed) {
      onDelete(archive);
    }
  };
  const resetApprovalFilters = () => {
    setApprovalKeyword('');
    setApprovalStatus('');
    setApprovalPendingOnly(false);
  };
  const exportFilteredApprovals = () => {
    const header = ['审批ID', '状态', '归档文件', '对象路径', '大小', '申请人', '申请时间', '审批人', '审批时间', '审批意见'];
    const rows = filteredApprovals.map((approval) => [
      approval.id,
      archiveApprovalStatusLabel(approval.status),
      approval.archive_file_name,
      approval.archive_key,
      String(approval.archive_size_bytes),
      approval.requested_by?.name ?? '系统',
      approval.requested_at,
      approval.reviewed_by?.name ?? '',
      approval.reviewed_at ?? '',
      approval.reason ?? '',
    ]);
    const csv = [header, ...rows].map((row) => row.map(csvCell).join(',')).join('\n');
    downloadBlob(new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8' }), `SLA死信归档删除审批-${new Date().toISOString().slice(0, 10)}.csv`);
  };

  return (
    <Card className="mt-4 border-border/70 bg-background/80 p-4 shadow-none">
      <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-start">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge tone="ready">M94</StatusBadge>
            <StatusBadge tone="planned">MinIO 归档</StatusBadge>
            <StatusBadge tone={(approvalOverview?.pending_count ?? 0) > 0 ? 'degraded' : 'healthy'}>
              M95 删除审批
            </StatusBadge>
          </div>
          <h5 className="mt-3 text-sm font-semibold">SLA 死信审计归档下载</h5>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">
            将当前筛选条件下的处置审计生成 CSV 归档，保存到对象存储；归档删除需要先提交审批，通过后才会删除对象文件。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button disabled={isCreating} onClick={onCreate} type="button">
            <Archive className="size-4" />
            {isCreating ? '正在生成' : '生成归档'}
          </Button>
          <Button disabled={loading} onClick={onRefresh} type="button" variant="outline">
            <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} />
            刷新归档
          </Button>
        </div>
      </div>

      {message ? (
        <div className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {message}
        </div>
      ) : null}
      {errorMessage ? (
        <div className="mt-4 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {errorMessage}
        </div>
      ) : null}

      <div className="mt-4 grid gap-4 xl:grid-cols-[240px_1fr]">
        <div className="grid gap-3">
          <ArchiveMetric helper="对象存储文件" label="归档文件" value={`${summary?.archive_count ?? 0}`} />
          <ArchiveMetric helper="CSV 总容量" label="归档容量" value={formatBytes(summary?.total_size_bytes ?? 0)} />
          <ArchiveMetric helper="等待安全管理员处理" label="删除待审" value={`${approvalOverview?.pending_count ?? 0}`} />
          <ArchiveMetric helper="审批通过且已删除" label="删除生效" value={`${approvalOverview?.applied_count ?? 0}`} />
        </div>

        {loading ? (
          <div className="rounded-md border bg-muted/20 p-5 text-sm text-muted-foreground">正在加载 SLA 死信审计归档...</div>
        ) : archives.length === 0 ? (
          <EmptyState
            className="rounded-md border bg-slate-50/60 p-5"
            description="点击生成归档后，当前筛选结果会保存为 CSV 文件。"
            title="暂无 SLA 死信审计归档"
          />
        ) : (
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full min-w-[760px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  {['文件名', '目录', '大小', '更新时间', '对象路径', '操作'].map((column) => (
                    <th className="px-3 py-2 font-medium text-muted-foreground" key={column}>{column}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {archives.map((archive) => (
                  <tr className="border-b last:border-0" key={archive.id}>
                    <td className="px-3 py-2 font-medium">{archive.file_name}</td>
                    <td className="px-3 py-2 text-muted-foreground">{archive.folder}</td>
                    <td className="px-3 py-2 text-muted-foreground">{formatBytes(archive.size_bytes)}</td>
                    <td className="px-3 py-2 text-muted-foreground">{formatDateTime(archive.last_modified)}</td>
                    <td className="px-3 py-2 font-mono text-xs text-muted-foreground">{archive.key}</td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap gap-2">
                        <Button disabled={isDownloading} onClick={() => onDownload(archive)} size="sm" type="button" variant="outline">
                          <Download className="size-4" />
                          下载
                        </Button>
                        <Button disabled={isDeleting} onClick={() => handleDelete(archive)} size="sm" type="button" variant="outline">
                          <Trash2 className="size-4" />
                          {isDeleting ? '提交中' : '申请删除'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mt-4 rounded-md border bg-background/70 p-4">
        <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-start">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge tone="ready">M95</StatusBadge>
              <StatusBadge tone={pendingApprovals.length > 0 ? 'degraded' : 'planned'}>
                {pendingApprovals.length > 0 ? `${pendingApprovals.length} 个待审批` : '删除审批'}
              </StatusBadge>
            </div>
            <h6 className="mt-3 text-sm font-semibold">归档删除审批</h6>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">
              删除申请写入平台事件审计；审批通过会立即删除对象存储文件，拒绝会保留归档。
            </p>
          </div>
          <Button disabled={approvalsLoading} onClick={onApprovalRefresh} type="button" variant="outline">
            <RefreshCw className={`size-4 ${approvalsLoading ? 'animate-spin' : ''}`} />
            刷新审批
          </Button>
          <Button disabled={approvalsLoading || filteredApprovals.length === 0} onClick={exportFilteredApprovals} type="button" variant="outline">
            <Download className="size-4" />
            导出当前筛选
          </Button>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <ArchiveMetric helper="等待处理" label="待审批" value={`${approvalOverview?.pending_count ?? 0}`} />
          <ArchiveMetric helper="已通过申请" label="已批准" value={`${approvalOverview?.approved_count ?? 0}`} />
          <ArchiveMetric helper="申请被拒绝" label="已拒绝" value={`${approvalOverview?.rejected_count ?? 0}`} />
          <ArchiveMetric helper="对象已删除" label="已生效" value={`${approvalOverview?.applied_count ?? 0}`} />
        </div>

        <div className="mt-4 grid gap-2 lg:grid-cols-[1fr_150px_auto_auto]">
          <label className="flex h-9 min-w-0 items-center gap-2 rounded-md border bg-background/70 px-3 text-sm">
            <Search className="size-4 shrink-0 text-muted-foreground" />
            <input
              className="min-w-0 flex-1 bg-transparent outline-none"
              onChange={(event) => setApprovalKeyword(event.target.value)}
              placeholder="搜索审批 ID、文件名、对象路径、申请人、意见"
              value={approvalKeyword}
            />
          </label>
          <select
            className="h-9 rounded-md border bg-background/80 px-3 text-sm"
            onChange={(event) => setApprovalStatus(event.target.value as SecurityOperationAlertSlaDeadLetterAuditArchiveApprovalItem['status'] | '')}
            value={approvalStatus}
          >
            <option value="">全部状态</option>
            <option value="PENDING">待审批</option>
            <option value="APPROVED">已批准</option>
            <option value="REJECTED">已拒绝</option>
            <option value="APPLIED">已生效</option>
          </select>
          <Button
            onClick={() => setApprovalPendingOnly((current) => !current)}
            type="button"
            variant={approvalPendingOnly ? 'default' : 'outline'}
          >
            只看待办
          </Button>
          <Button disabled={!hasApprovalFilters} onClick={resetApprovalFilters} type="button" variant="outline">
            重置筛选
          </Button>
        </div>

        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <ArchiveMetric helper={`全部 ${approvals.length} 条`} label="当前筛选" value={`${filteredApprovals.length}`} />
          <ArchiveMetric helper="当前筛选内待处理" label="筛选待办" value={`${filteredPendingCount}`} />
          <ArchiveMetric helper={hasApprovalFilters ? '已应用筛选条件' : '未设置筛选'} label="筛选状态" value={hasApprovalFilters ? '已筛选' : '全部'} />
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,320px)_1fr]">
          <div className="rounded-md border bg-background/70 p-3">
            <div className="mb-2 text-sm font-semibold">审批意见</div>
            <Input
              maxLength={1000}
              onChange={(event) => onNoteChange(event.target.value)}
              placeholder="填写审批意见"
              value={approvalNote}
            />
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              批准或拒绝待审批项时会带上当前意见，并进入审计时间线。
            </p>
          </div>

          {approvalsLoading ? (
            <div className="rounded-md border bg-muted/20 p-5 text-sm text-muted-foreground">正在加载归档删除审批...</div>
          ) : approvals.length === 0 ? (
            <EmptyState
              className="rounded-md border bg-slate-50/60 p-5"
              description="点击归档列表中的申请删除后，这里会出现待审批记录。"
              title="暂无归档删除审批"
            />
          ) : filteredApprovals.length === 0 ? (
            <EmptyState
              className="rounded-md border bg-slate-50/60 p-5"
              description="当前筛选条件下没有匹配的归档删除审批。"
              title="未找到审批记录"
            />
          ) : (
            <div className="grid gap-3">
              {filteredApprovals.map((approval) => (
                <SlaDeadLetterAuditArchiveApprovalRow
                  approval={approval}
                  isApproving={isApproving}
                  isRejecting={isRejecting}
                  key={approval.id}
                  onApprove={onApprove}
                  onReject={onReject}
                  onSelect={setSelectedApprovalId}
                  selected={approval.id === activeApprovalId}
                />
              ))}
            </div>
          )}
        </div>

        <SlaDeadLetterAuditArchiveApprovalDetailPanel
          detail={approvalDetailQuery.data ?? null}
          errorMessage={approvalDetailQuery.error instanceof Error ? approvalDetailQuery.error.message : null}
          fallbackApproval={selectedApproval}
          loading={approvalDetailQuery.isLoading || approvalDetailQuery.isFetching}
        />
      </div>
    </Card>
  );
}

function SlaDeadLetterAuditArchiveApprovalRow({
  approval,
  isApproving,
  isRejecting,
  onApprove,
  onReject,
  onSelect,
  selected,
}: {
  approval: SecurityOperationAlertSlaDeadLetterAuditArchiveApprovalItem;
  isApproving: boolean;
  isRejecting: boolean;
  onApprove: (approvalId: string) => void;
  onReject: (approvalId: string) => void;
  onSelect: (approvalId: string) => void;
  selected: boolean;
}) {
  const pending = approval.status === 'PENDING';

  return (
    <div className={`rounded-md border bg-background/75 p-3 ${selected ? 'border-blue-200 bg-blue-50/40' : ''}`}>
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge tone={archiveApprovalStatusTone(approval.status)}>
              {archiveApprovalStatusLabel(approval.status)}
            </StatusBadge>
            <span className="font-mono text-xs text-muted-foreground">{shortId(approval.id)}</span>
            <span className="text-xs text-muted-foreground">{formatBytes(approval.archive_size_bytes)}</span>
          </div>
          <div className="mt-2 truncate text-sm font-medium">{approval.archive_file_name}</div>
          <div className="mt-1 truncate font-mono text-xs text-muted-foreground">{approval.archive_key}</div>
          {approval.reason ? (
            <div className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">意见：{approval.reason}</div>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Button onClick={() => onSelect(approval.id)} size="sm" type="button" variant="outline">
            {selected ? '当前详情' : '查看详情'}
          </Button>
          {pending ? (
            <>
            <Button disabled={isApproving || isRejecting} onClick={() => onApprove(approval.id)} size="sm" type="button" variant="outline">
              {isApproving ? '批准中' : '批准删除'}
            </Button>
            <Button disabled={isApproving || isRejecting} onClick={() => onReject(approval.id)} size="sm" type="button" variant="outline">
              {isRejecting ? '拒绝中' : '拒绝'}
            </Button>
            </>
          ) : null}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
        <span>申请人：{approval.requested_by?.name ?? '系统'}</span>
        <span>申请时间：{formatDateTime(approval.requested_at)}</span>
        {approval.reviewed_by ? <span>审批人：{approval.reviewed_by.name}</span> : null}
        {approval.reviewed_at ? <span>审批时间：{formatDateTime(approval.reviewed_at)}</span> : null}
      </div>
    </div>
  );
}

function SlaDeadLetterAuditArchiveApprovalDetailPanel({
  detail,
  errorMessage,
  fallbackApproval,
  loading,
}: {
  detail: SecurityOperationAlertSlaDeadLetterAuditArchiveApprovalDetail | null;
  errorMessage: string | null;
  fallbackApproval: SecurityOperationAlertSlaDeadLetterAuditArchiveApprovalItem | null;
  loading: boolean;
}) {
  const current = detail ?? fallbackApproval;

  return (
    <div className="mt-4 rounded-md border bg-background/70 p-4">
      <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-start">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge tone="ready">M96</StatusBadge>
            {current ? (
              <StatusBadge tone={archiveApprovalStatusTone(current.status)}>
                {archiveApprovalStatusLabel(current.status)}
              </StatusBadge>
            ) : null}
          </div>
          <h6 className="mt-3 text-sm font-semibold">审批详情与审计时间线</h6>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">
            查看归档删除从申请、审批到生效的完整事件链路，并可通过请求 ID 和 Trace ID 跳转定位。
          </p>
        </div>
        {current ? (
          <div className="rounded-md border bg-background/80 px-3 py-2 text-xs text-muted-foreground">
            审批 ID：<span className="font-mono">{shortId(current.id)}</span>
          </div>
        ) : null}
      </div>

      {loading ? (
        <div className="mt-4 rounded-md border bg-muted/20 p-5 text-sm text-muted-foreground">正在加载审批详情...</div>
      ) : errorMessage ? (
        <div className="mt-4 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {errorMessage}
        </div>
      ) : !current ? (
        <EmptyState
          className="mt-4 rounded-md border bg-slate-50/60 p-5"
          description="选择一条归档删除审批后，这里会展示审批详情和事件时间线。"
          title="暂无审批详情"
        />
      ) : (
        <div className="mt-4 grid gap-4 xl:grid-cols-[0.82fr_1.18fr]">
          <Card className="border-border/70 p-4 shadow-none">
            <div className="mb-3 text-sm font-semibold">审批摘要</div>
            <div className="grid gap-2 text-sm">
              <SummaryTile label="归档文件" value={current.archive_file_name} />
              <SummaryTile label="归档大小" value={formatBytes(current.archive_size_bytes)} />
              <SummaryTile label="对象路径" value={current.archive_key} />
              <SummaryTile label="申请人" value={current.requested_by?.name ?? '系统'} />
              <SummaryTile label="申请时间" value={formatDateTime(current.requested_at)} />
              <SummaryTile label="审批人" value={current.reviewed_by?.name ?? '未审批'} />
              <SummaryTile label="审批时间" value={formatDateTime(current.reviewed_at ?? '')} />
              <SummaryTile label="审批意见" value={current.reason ?? '未填写'} />
            </div>
          </Card>

          <Card className="border-border/70 p-4 shadow-none">
            <div className="mb-3 flex items-center justify-between gap-3">
              <span className="text-sm font-semibold">事件时间线</span>
              <StatusBadge tone={(detail?.audit_timeline.length ?? 0) > 0 ? 'mock' : 'planned'}>
                {detail?.audit_timeline.length ?? 0} 条事件
              </StatusBadge>
            </div>
            {!detail ? (
              <div className="rounded-md border bg-muted/20 p-4 text-sm text-muted-foreground">
                详情加载后会显示申请、审批、拒绝或删除生效事件。
              </div>
            ) : detail.audit_timeline.length === 0 ? (
              <EmptyState
                className="rounded-md border bg-slate-50/60 p-5"
                description="当前审批还没有可展示的事件时间线。"
                title="暂无时间线事件"
              />
            ) : (
              <div className="grid gap-3">
                {detail.audit_timeline.map((event) => (
                  <SlaDeadLetterAuditArchiveApprovalTimelineRow event={event} key={event.event_id} />
                ))}
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}

function SlaDeadLetterAuditArchiveApprovalTimelineRow({
  event,
}: {
  event: SecurityOperationAlertSlaDeadLetterAuditArchiveApprovalTimelineItem;
}) {
  return (
    <div className="rounded-md border bg-background/75 p-3">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge tone={archiveApprovalEventTone(event.event_type)}>
              {archiveApprovalEventLabel(event.event_type)}
            </StatusBadge>
            <StatusBadge tone={archiveApprovalEventStatusTone(event.status)}>{event.status}</StatusBadge>
            <span className="font-mono text-xs text-muted-foreground">{shortId(event.event_id)}</span>
          </div>
          <div className="mt-2 truncate text-sm font-medium">{event.title}</div>
          {event.note ? <div className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">备注：{event.note}</div> : null}
        </div>
        <div className="shrink-0 text-xs text-muted-foreground md:text-right">
          <div>{formatDateTime(event.occurred_at)}</div>
          <div className="mt-1">{event.actor ? `操作人：${event.actor.name}` : '操作人：系统'}</div>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
        <span className="truncate font-mono">对象：{event.archive_key}</span>
        {event.request_id ? <span>请求 {shortId(event.request_id)}</span> : null}
        {event.trace_id ? <span>Trace {shortId(event.trace_id)}</span> : null}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {event.request_id ? (
          <Button asChild size="sm" type="button" variant="outline">
            <Link href={`/audit?keyword=${encodeURIComponent(event.request_id)}`}>审计中心</Link>
          </Button>
        ) : null}
        {event.trace_id ? (
          <Button asChild size="sm" type="button" variant="outline">
            <Link href={`/monitor?keyword=${encodeURIComponent(event.trace_id)}`}>查看 Trace</Link>
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function OperationAlertSlaDeadLetterAuditRow({ item }: { item: SecurityOperationAlertSlaDeadLetterAuditItem }) {
  const identifiers = [
    item.notification_event_id ? `通知 ${shortId(item.notification_event_id)}` : null,
    item.delivery_event_id ? `投递 ${shortId(item.delivery_event_id)}` : null,
    item.request_id ? `请求 ${shortId(item.request_id)}` : null,
    item.trace_id ? `Trace ${shortId(item.trace_id)}` : null,
  ].filter(Boolean);

  return (
    <div className="rounded-md border bg-background/75 p-3">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge tone={deadLetterDispositionTone(item.disposition_status)}>
              {deadLetterDispositionLabel(item.disposition_status)}
            </StatusBadge>
            <StatusBadge tone="mock">{deadLetterActionLabel(item.action)}</StatusBadge>
            <span className="font-mono text-xs text-muted-foreground">{shortId(item.event_id)}</span>
          </div>
          <div className="mt-2 truncate text-sm font-medium">{item.title}</div>
          {item.note ? <div className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">备注：{item.note}</div> : null}
        </div>
        <div className="shrink-0 text-xs text-muted-foreground md:text-right">
          <div>{formatDateTime(item.occurred_at)}</div>
          <div className="mt-1">{item.handled_by ? `操作人：${item.handled_by}` : '操作人：系统'}</div>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
        {item.alert_id ? <span>告警 {shortId(item.alert_id)}</span> : null}
        {identifiers.map((identifier) => (
          <span key={identifier}>{identifier}</span>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {item.request_id ? (
          <Button asChild size="sm" type="button" variant="outline">
            <Link href={`/audit?keyword=${encodeURIComponent(item.request_id)}`}>审计中心</Link>
          </Button>
        ) : null}
        {item.trace_id ? (
          <Button asChild size="sm" type="button" variant="outline">
            <Link href={`/monitor?keyword=${encodeURIComponent(item.trace_id)}`}>查看 Trace</Link>
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function ArchiveMetric({ helper, label, value }: { helper: string; label: string; value: string }) {
  return (
    <div className="rounded-md border bg-background/70 p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-lg font-semibold">{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{helper}</div>
    </div>
  );
}

function OperationAlertSlaDeadLetterRow({ item }: { item: SecurityOperationAlertSlaNotificationItem | SecurityOperationAlertSlaDeadLetterItem }) {
  const disposition = 'disposition_status' in item ? item.disposition_status : null;

  return (
    <div className="rounded-md border border-destructive/25 bg-destructive/5 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge tone="unavailable">死信</StatusBadge>
        {disposition ? (
          <StatusBadge tone={deadLetterDispositionTone(disposition)}>{deadLetterDispositionLabel(disposition)}</StatusBadge>
        ) : null}
        <StatusBadge tone={notificationStatusTone(item.status)}>{notificationStatusLabel(item.status)}</StatusBadge>
        <span className="text-xs text-muted-foreground">重试 {item.retry_count} 次</span>
      </div>
      <div className="mt-2 truncate text-sm font-medium">{item.title}</div>
      <div className="mt-1 text-xs leading-5 text-destructive">
        {item.dead_letter_reason ?? '已达到最大重试次数，需要人工处理。'}
      </div>
      <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
        <span>最近投递：{formatDateTime(item.delivered_at)}</span>
        <span>Webhook：{item.webhook_status ?? '未配置'}</span>
        {'handled_at' in item && item.handled_at ? <span>处置：{formatDateTime(item.handled_at)}</span> : null}
      </div>
    </div>
  );
}

function OperationAlertSlaNotificationRetryResultCard({
  result,
}: {
  result: SecurityOperationAlertSlaNotificationRetryTaskRunResult | null;
}) {
  if (!result) {
    return (
      <div className="rounded-md border bg-background/70 p-4">
        <div className="mb-2 flex items-center justify-between gap-3">
          <span className="text-sm font-semibold">最近重试扫描</span>
          <StatusBadge tone="planned">暂无结果</StatusBadge>
        </div>
        <p className="text-sm leading-6 text-muted-foreground">执行 SLA 通知自动重试后会显示最近一次扫描摘要。</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border bg-background/70 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="text-sm font-semibold">最近重试扫描</span>
        <StatusBadge tone={slaTaskRunTone(result.status)}>{taskRunLabel(result.status)}</StatusBadge>
      </div>
      <div className="grid gap-2 text-sm md:grid-cols-4">
        <SummaryTile label="扫描" value={`${result.scanned_count}`} />
        <SummaryTile label="重试" value={`${result.retried_count}`} />
        <SummaryTile label="成功" value={`${result.success_count}`} />
        <SummaryTile label="失败" value={`${result.failed_count}`} />
        <SummaryTile label="跳过" value={`${result.skipped_count}`} />
        <SummaryTile label="死信" value={`${result.dead_letter_count}`} />
        <SummaryTile label="完成时间" value={formatDateTime(result.finished_at)} />
      </div>
      {result.error_message ? (
        <div className="mt-3 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
          {result.error_message}
        </div>
      ) : null}
    </div>
  );
}

function OperationAlertSlaNotificationRow({ item }: { item: SecurityOperationAlertSlaNotificationItem }) {
  return (
    <div className="rounded-md border bg-background/75 p-3">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge tone={notificationStatusTone(item.status)}>{notificationStatusLabel(item.status)}</StatusBadge>
            <span className="text-xs text-muted-foreground">{item.channels.map(notificationChannelLabel).join('、')}</span>
          </div>
          <div className="mt-2 truncate text-sm font-medium">{item.title}</div>
          <div className="mt-1 line-clamp-1 text-xs text-muted-foreground">{item.message}</div>
        </div>
        <div className="shrink-0 text-xs text-muted-foreground md:text-right">
          <div>{formatDateTime(item.delivered_at)}</div>
          <div>Webhook：{item.webhook_status ?? '未配置'}</div>
        </div>
      </div>
      <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
        <span>目标：{item.targets.join('、') || '无目标'}</span>
        {item.webhook_error ? <span className="text-destructive">{item.webhook_error}</span> : null}
      </div>
    </div>
  );
}

function OperationAlertSlaNotificationResultCard({
  result,
}: {
  result: SecurityOperationAlertSlaNotificationResult | null;
}) {
  if (!result) {
    return (
      <div className="rounded-md border bg-background/70 p-4">
        <div className="mb-2 flex items-center justify-between gap-3">
          <span className="text-sm font-semibold">最近通知结果</span>
          <StatusBadge tone="planned">暂无结果</StatusBadge>
        </div>
        <p className="text-sm leading-6 text-muted-foreground">执行 SLA 超时通知后会显示最近一次投递摘要。</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border bg-background/70 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="text-sm font-semibold">最近通知结果</span>
        <StatusBadge tone={slaTaskRunTone(result.status)}>{taskRunLabel(result.status)}</StatusBadge>
      </div>
      <div className="grid gap-2 text-sm md:grid-cols-4">
        <SummaryTile label="扫描" value={`${result.scanned_count}`} />
        <SummaryTile label="通知" value={`${result.notified_count}`} />
        <SummaryTile label="成功" value={`${result.sent_count}`} />
        <SummaryTile label="失败" value={`${result.failed_count}`} />
      </div>
      {result.error_message ? (
        <div className="mt-3 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
          {result.error_message}
        </div>
      ) : null}
    </div>
  );
}

function OperationAlertSlaRow({ item }: { item: SecurityOperationAlertSlaItem }) {
  const progress = slaProgressPercent(item);

  return (
    <div className="rounded-md border bg-background/75 p-3">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge tone={slaStatusTone(item.sla_status)}>{slaStatusLabel(item.sla_status)}</StatusBadge>
            <StatusBadge tone={operationAlertStatusTone(item.status)}>{operationAlertStatusLabel(item.status)}</StatusBadge>
            <StatusBadge tone={securityRiskTone(item.severity)}>{securityRiskLevelLabel(item.severity)}</StatusBadge>
          </div>
          <div className="mt-2 truncate text-sm font-medium">{item.title}</div>
          <div className="mt-1 line-clamp-1 text-xs text-muted-foreground">{item.metric}</div>
        </div>
        <div className="shrink-0 text-xs text-muted-foreground md:text-right">
          <div>触发：{formatDateTime(item.triggered_at)}</div>
          <div>到期：{formatDateTime(item.due_at)}</div>
        </div>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full ${slaProgressClass(item.sla_status)}`} style={{ width: `${progress}%` }} />
      </div>
      <div className="mt-2 flex flex-wrap justify-between gap-2 text-xs text-muted-foreground">
        <span>{item.sla_status === 'OVERDUE' ? `已超时 ${item.overdue_minutes} 分钟` : `剩余 ${item.minutes_remaining} 分钟`}</span>
        <span>{item.auto_escalated ? `已自动升级 · ${formatDateTime(item.auto_escalated_at)}` : '未自动升级'}</span>
      </div>
    </div>
  );
}

function OperationAlertSlaTaskResult({
  result,
}: {
  result: SecurityOperationAlertSlaTaskRunResult | null;
}) {
  if (!result) {
    return (
      <div className="rounded-md border bg-background/70 p-4">
        <div className="mb-2 flex items-center justify-between gap-3">
          <span className="text-sm font-semibold">最近 SLA 扫描</span>
          <StatusBadge tone="planned">暂无结果</StatusBadge>
        </div>
        <p className="text-sm leading-6 text-muted-foreground">执行自动升级扫描后会显示最近一次处理结果。</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border bg-background/70 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="text-sm font-semibold">最近 SLA 扫描</span>
        <StatusBadge tone={slaTaskRunTone(result.status)}>{taskRunLabel(result.status)}</StatusBadge>
      </div>
      <div className="grid gap-2 text-sm md:grid-cols-4">
        <SummaryTile label="扫描" value={`${result.scanned_count}`} />
        <SummaryTile label="升级" value={`${result.escalated_count}`} />
        <SummaryTile label="跳过" value={`${result.skipped_count}`} />
        <SummaryTile label="完成时间" value={formatDateTime(result.finished_at)} />
      </div>
      {result.error_message ? (
        <div className="mt-3 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
          {result.error_message}
        </div>
      ) : null}
    </div>
  );
}

function OperationMetricTile({ helper, label, value }: { helper: string; label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-background/70 p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-2 truncate text-2xl font-semibold">{value}</div>
      <div className="mt-2 text-xs text-muted-foreground">{helper}</div>
    </div>
  );
}

function SecurityDenialCard({
  denial,
  onOpenDetail,
}: {
  denial: SecurityCenterDenialItem;
  onOpenDetail: (eventId: string) => void;
}) {
  return (
    <div className="rounded-lg border bg-background/70 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge tone="degraded">{securityDenialSourceLabel(denial.source)}</StatusBadge>
            <span className="text-xs text-muted-foreground">{denial.status_code}</span>
            <span className="text-xs text-muted-foreground">{formatDateTime(denial.occurred_at)}</span>
          </div>
          <h3 className="mt-2 truncate text-sm font-semibold">{denial.title}</h3>
          <p className="mt-1 line-clamp-2 text-sm leading-6 text-muted-foreground">{denial.reason}</p>
          <div className="mt-2 grid gap-1 text-xs text-muted-foreground">
            <span className="truncate">{denial.method} {denial.path}</span>
            <span className="truncate">资源：{denial.resource_type ?? '未知'} / {denial.resource_id ?? '未记录'}</span>
            <span className="truncate">链路：{denial.trace_id ?? denial.request_id}</span>
          </div>
        </div>
      </div>
      <div className="mt-3 flex justify-end">
        <Button onClick={() => onOpenDetail(denial.id)} size="sm" type="button" variant="outline">
          <Eye className="size-4" />
          查看详情
        </Button>
      </div>
    </div>
  );
}

function PaginationBar({
  onPageChange,
  page,
  pageCount,
  total,
}: {
  onPageChange: (value: number) => void;
  page: number;
  pageCount: number;
  total: number;
}) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div className="text-sm text-muted-foreground">
        第 {page} / {pageCount} 页 · 共 {total} 条
      </div>
      <div className="flex items-center gap-2">
        <Button
          disabled={page <= 1}
          onClick={() => onPageChange(Math.max(1, page - 1))}
          size="sm"
          type="button"
          variant="outline"
        >
          <ChevronLeft className="size-4" />
          上一页
        </Button>
        <Button
          disabled={page >= pageCount}
          onClick={() => onPageChange(Math.min(pageCount, page + 1))}
          size="sm"
          type="button"
          variant="outline"
        >
          下一页
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}

function RiskSignalCard({ risk }: { risk: SecurityCenterRiskSignal }) {
  return (
    <Link className="group rounded-lg border bg-background/70 p-3 transition-colors hover:bg-muted/25" href={risk.href}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge tone={securityRiskTone(risk.severity)}>{securityRiskLevelLabel(risk.severity)}</StatusBadge>
            <span className="text-xs text-muted-foreground">{risk.metric}</span>
          </div>
          <h3 className="mt-2 text-sm font-semibold">{risk.title}</h3>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">{risk.description}</p>
        </div>
        <ArrowRight className="mt-1 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
      </div>
    </Link>
  );
}

function securityDenialSourceLabel(source: SecurityCenterDenialItem['source']) {
  if (source === 'DATA_SCOPE') return '数据权限';
  if (source === 'RESOURCE_ACL') return '资源授权';
  if (source === 'SECURITY_POLICY') return '安全策略';
  return '操作拒绝';
}

function securityRiskLevelLabel(level: SecurityCenterRiskLevel) {
  if (level === 'LOW') return '低风险';
  if (level === 'MEDIUM') return '中风险';
  return '高风险';
}

function securityRiskTone(level: SecurityCenterRiskLevel) {
  if (level === 'LOW') return 'healthy';
  if (level === 'MEDIUM') return 'degraded';
  return 'unavailable';
}

function moduleStatusLabel(status: SecurityCenterModuleSummary['status']) {
  if (status === 'healthy') return '正常';
  if (status === 'degraded') return '需关注';
  return '未配置';
}

function storageStatusLabel(status: SecurityCenterOverview['approval_operations']['archive_storage_status']) {
  if (status === 'CONNECTED') return '归档正常';
  if (status === 'DEGRADED') return '归档降级';
  if (status === 'UNAVAILABLE') return '归档不可用';
  return '归档未知';
}

function notificationStatusTone(status: SecurityOperationAlertNotificationResult['status']) {
  if (status === 'SENT') return 'healthy';
  if (status === 'PARTIAL' || status === 'SKIPPED') return 'degraded';
  return 'unavailable';
}

function notificationStatusLabel(status: SecurityOperationAlertNotificationResult['status']) {
  if (status === 'SENT') return '已投递';
  if (status === 'PARTIAL') return '部分成功';
  if (status === 'SKIPPED') return '已跳过';
  return '投递失败';
}

function notificationChannelLabel(channel: SecurityOperationAlertNotificationResult['channels'][number]) {
  if (channel === 'IN_APP') return '站内记录';
  return 'Webhook';
}

function operationAlertNotificationCategoryLabel(category: string) {
  if (category === 'NOTIFICATION_TASK') return '通知任务风险';
  if (category === 'NOTIFICATION_TASK_MIXED_FAILURE_SOURCE') return '双来源失败';
  if (category === 'NOTIFICATION_TASK_RECOVERY_AUDIT_ARCHIVE_DELETE') return '自愈归档删除';
  if (category === 'SLA_DEAD_LETTER_ARCHIVE_DELETE') return 'SLA 死信归档删除';
  if (category === 'ARCHIVE_OPERATION') return '归档运营';
  if (category === 'NOTIFICATION_POLICY') return '通知策略';
  if (category === 'RUNTIME_APPROVAL') return '运行时审批';
  return '运营告警';
}

function operationAlertNotificationCategoryRisk(category: string | null) {
  return (
    category === 'SLA_DEAD_LETTER_ARCHIVE_DELETE' ||
    category === 'NOTIFICATION_TASK' ||
    category === 'NOTIFICATION_TASK_MIXED_FAILURE_SOURCE' ||
    category === 'NOTIFICATION_TASK_RECOVERY_AUDIT_ARCHIVE_DELETE'
  );
}

function operationAlertCategory(alertId: string) {
  if (alertId === 'operation-alert-notification-task-sla-dead-letter-failure-source') {
    return 'SLA_DEAD_LETTER_ARCHIVE_DELETE';
  }
  if (alertId === 'operation-alert-notification-task-recovery-archive-failure-source') {
    return 'NOTIFICATION_TASK_RECOVERY_AUDIT_ARCHIVE_DELETE';
  }
  if (alertId === 'operation-alert-notification-task-mixed-failure-source') {
    return 'NOTIFICATION_TASK_MIXED_FAILURE_SOURCE';
  }
  if (
    alertId === 'operation-alert-notification-task-failure-risk' ||
    alertId === 'operation-alert-notification-task-consecutive-failure'
  ) {
    return 'NOTIFICATION_TASK';
  }
  if (alertId === 'sla-dead-letter-archive-delete-pending' || alertId === 'sla-dead-letter-archive-delete-rejected-risk') {
    return 'SLA_DEAD_LETTER_ARCHIVE_DELETE';
  }
  if (
    alertId === 'notification-task-recovery-audit-archive-delete-pending' ||
    alertId === 'notification-task-recovery-audit-archive-delete-rejected-risk'
  ) {
    return 'NOTIFICATION_TASK_RECOVERY_AUDIT_ARCHIVE_DELETE';
  }
  if (alertId.includes('archive')) return 'ARCHIVE_OPERATION';
  if (alertId.includes('notification')) return 'NOTIFICATION_POLICY';
  if (alertId.includes('runtime')) return 'RUNTIME_APPROVAL';
  return 'SECURITY_OPERATION';
}

function notificationTaskNameLabel(task: SecurityOperationAlertNotificationTaskRunResult['task']) {
  if (task === 'AUTO_NOTIFY') return '首发自动通知';
  return '失败自动重试';
}

function notificationTaskRecoveryReasonLabel(
  reason: SecurityOperationAlertNotificationTaskRecoverySuggestion['reason_code'],
) {
  if (reason === 'WEBHOOK_NOT_CONFIGURED') return 'Webhook 未配置';
  if (reason === 'WEBHOOK_DELIVERY_FAILED') return 'Webhook 投递失败';
  if (reason === 'AUTO_NOTIFY_DISABLED') return '自动通知关闭';
  if (reason === 'AUTO_RETRY_DISABLED') return '自动重试关闭';
  if (reason === 'CONSECUTIVE_FAILURES') return '连续失败';
  return '失败率偏高';
}

function notificationTaskRecoveryFailureSourceLabel(source: SecurityOperationAlertNotificationTaskRecoveryFailureSource) {
  if (source === 'SLA_DEAD_LETTER_ARCHIVE_DELETE') return 'SLA 死信归档';
  if (source === 'NOTIFICATION_TASK_RECOVERY_AUDIT_ARCHIVE_DELETE') return '自愈归档删除';
  if (source === 'MIXED') return '混合来源';
  return '未知来源';
}

function notificationTaskRecoveryFailureSourceTone(source: SecurityOperationAlertNotificationTaskRecoveryFailureSource) {
  if (source === 'MIXED') return 'degraded';
  if (source === 'UNKNOWN') return 'planned';
  return 'ready';
}

function notificationTaskRecoveryStatusTone(status: SecurityOperationAlertNotificationTaskRecoveryStatus) {
  if (status === 'OPEN') return 'planned';
  if (status === 'ACKNOWLEDGED') return 'degraded';
  if (status === 'IGNORED') return 'mock';
  return 'healthy';
}

function notificationTaskRecoveryStatusLabel(status: SecurityOperationAlertNotificationTaskRecoveryStatus) {
  if (status === 'OPEN') return '待处理';
  if (status === 'ACKNOWLEDGED') return '已确认';
  if (status === 'IGNORED') return '已忽略';
  return '已处理';
}

function notificationTaskRecoveryActionVerb(action: SecurityOperationAlertNotificationTaskRecoveryAction) {
  if (action === 'ACKNOWLEDGE') return '确认';
  if (action === 'IGNORE') return '忽略';
  return '标记已处理';
}

function taskTriggerLabel(trigger: SecurityOperationAlertNotificationTaskRunItem['trigger_type']) {
  if (trigger === 'MANUAL') return '手动';
  return '调度';
}

function formatDuration(value: number) {
  if (value < 1000) return `${value} ms`;
  return `${(value / 1000).toFixed(1)} 秒`;
}

function notificationTaskPolicySourceLabel(source?: SecurityOperationAlertNotificationTaskOverview['policy']['source']) {
  if (source === 'SYSTEM_SETTING') return '系统设置';
  if (source === 'ENVIRONMENT') return '环境变量';
  return '未配置';
}

function taskRunTone(status: SecurityOperationAlertNotificationTaskRunResult['status']) {
  if (status === 'SUCCESS') return 'healthy';
  if (status === 'SKIPPED') return 'planned';
  return 'unavailable';
}

function taskRunLabel(status: SecurityOperationAlertNotificationTaskRunResult['status']) {
  if (status === 'SUCCESS') return '成功';
  if (status === 'SKIPPED') return '跳过';
  return '失败';
}

function slaStatusTone(status: SecurityOperationAlertSlaStatus) {
  if (status === 'WITHIN_SLA') return 'healthy';
  if (status === 'WARNING') return 'degraded';
  if (status === 'OVERDUE') return 'unavailable';
  return 'ready';
}

function slaStatusLabel(status: SecurityOperationAlertSlaStatus) {
  if (status === 'WITHIN_SLA') return 'SLA 内';
  if (status === 'WARNING') return '临近超时';
  if (status === 'OVERDUE') return '已超时';
  return '已关闭';
}

function slaTaskRunTone(status: SecurityOperationAlertSlaTaskRunResult['status']) {
  if (status === 'SUCCESS') return 'healthy';
  if (status === 'SKIPPED') return 'planned';
  return 'unavailable';
}

function deadLetterDispositionTone(status: SecurityOperationAlertSlaDeadLetterDispositionStatus) {
  if (status === 'OPEN') return 'unavailable';
  if (status === 'CLAIMED') return 'degraded';
  if (status === 'REQUEUED') return 'healthy';
  return 'ready';
}

function deadLetterDispositionLabel(status: SecurityOperationAlertSlaDeadLetterDispositionStatus) {
  if (status === 'OPEN') return '待处理';
  if (status === 'CLAIMED') return '已认领';
  if (status === 'REQUEUED') return '已重投';
  return '已关闭';
}

function deadLetterActionLabel(action: SecurityOperationAlertSlaDeadLetterAction) {
  if (action === 'CLAIM') return '认领';
  if (action === 'REQUEUE') return '重新投递';
  return '关闭';
}

function archiveApprovalStatusTone(status: SecurityOperationAlertSlaDeadLetterAuditArchiveApprovalItem['status']) {
  if (status === 'PENDING') return 'degraded';
  if (status === 'APPROVED') return 'mock';
  if (status === 'REJECTED') return 'unavailable';
  return 'healthy';
}

function archiveApprovalStatusLabel(status: SecurityOperationAlertSlaDeadLetterAuditArchiveApprovalItem['status']) {
  if (status === 'PENDING') return '待审批';
  if (status === 'APPROVED') return '已批准';
  if (status === 'REJECTED') return '已拒绝';
  return '已生效';
}

function archiveApprovalEventTone(eventType: string) {
  if (eventType === 'DELETE_REQUESTED') return 'degraded';
  if (eventType === 'APPROVED') return 'mock';
  if (eventType === 'REJECTED') return 'unavailable';
  if (eventType === 'DELETE_APPLIED') return 'healthy';
  return 'planned';
}

function archiveApprovalEventLabel(eventType: string) {
  if (eventType === 'DELETE_REQUESTED') return '申请删除';
  if (eventType === 'APPROVED') return '批准删除';
  if (eventType === 'REJECTED') return '拒绝删除';
  if (eventType === 'DELETE_APPLIED') return '删除生效';
  return eventType || '归档事件';
}

function archiveApprovalEventStatusTone(status: string) {
  if (status === 'SUCCESS') return 'healthy';
  if (status === 'WARNING' || status === 'PENDING') return 'degraded';
  if (status === 'FAILED' || status === 'ERROR') return 'unavailable';
  return 'planned';
}

function securityApprovalWorkbenchTypeLabel(type: SecurityApprovalWorkbenchType) {
  return approvalWorkbenchTypes.find((item) => item.value === type)?.label ?? type;
}

function securityApprovalWorkbenchRiskDomainLabel(riskDomain: SecurityApprovalWorkbenchRiskDomain) {
  return approvalWorkbenchRiskDomains.find((item) => item.value === riskDomain)?.label ?? riskDomain;
}

function securityApprovalWorkbenchRiskLevelLabel(riskLevel: SecurityApprovalWorkbenchRiskLevel) {
  if (riskLevel === 'CRITICAL') return '极高风险';
  if (riskLevel === 'HIGH') return '高风险';
  if (riskLevel === 'MEDIUM') return '中风险';
  return '低风险';
}

function securityApprovalWorkbenchRiskTone(riskLevel: SecurityApprovalWorkbenchRiskLevel) {
  if (riskLevel === 'CRITICAL') return 'unavailable';
  if (riskLevel === 'HIGH') return 'degraded';
  if (riskLevel === 'MEDIUM') return 'mock';
  return 'healthy';
}

function securityApprovalMetadataLabel(key: string) {
  const labels: Record<string, string> = {
    action: '动作',
    agent_name: 'Agent',
    archive_file_name: '归档文件',
    archive_id: '归档 ID',
    archive_key: '对象路径',
    archive_size_bytes: '归档大小',
    conversation_title: '会话',
    execution_status: '执行状态',
    impact_level: '影响等级',
    next_status: '变更后状态',
    next_value: '变更后值',
    previous_status: '变更前状态',
    previous_value: '变更前值',
    request_method: '请求方法',
    request_url: '请求地址',
    run_id: '运行 ID',
    run_objective: '运行目标',
    setting_key: '配置键',
    team_id: '团队 ID',
    team_name: '团队名称',
    tool_code: '工具编码',
    trigger_source: '触发来源',
    version: '版本',
  };

  return labels[key] ?? key;
}

function formatSecurityApprovalMetadataValue(value: unknown) {
  if (value === null || value === undefined || value === '') return '-';
  if (typeof value === 'number' && Number.isFinite(value)) return value > 1024 ? formatBytes(value) : value.toString();
  if (typeof value === 'string') return value;
  if (typeof value === 'boolean') return value ? '是' : '否';
  return JSON.stringify(value);
}

function slaProgressPercent(item: SecurityOperationAlertSlaItem) {
  if (item.sla_status === 'CLOSED') return 100;
  const totalMinutes = item.minutes_remaining + item.overdue_minutes;
  if (item.sla_status === 'OVERDUE') return 100;
  if (totalMinutes <= 0) return item.sla_status === 'WITHIN_SLA' ? 25 : 80;
  return Math.min(100, Math.max(8, 100 - Math.round((item.minutes_remaining / totalMinutes) * 100)));
}

function slaProgressClass(status: SecurityOperationAlertSlaStatus) {
  if (status === 'WITHIN_SLA') return 'bg-emerald-500';
  if (status === 'WARNING') return 'bg-amber-500';
  if (status === 'OVERDUE') return 'bg-red-500';
  return 'bg-slate-400';
}

function shortId(value: string) {
  return value.length > 12 ? `${value.slice(0, 8)}...` : value;
}

function downloadBlob(blob: Blob, fileName: string) {
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(objectUrl);
}

function csvCell(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}

function operationAlertStatusTone(status: SecurityOperationAlertActionResult['status']) {
  if (status === 'OPEN') return 'planned';
  if (status === 'ACKNOWLEDGED') return 'healthy';
  if (status === 'ESCALATED') return 'degraded';
  return 'ready';
}

function operationAlertStatusLabel(status: SecurityOperationAlertActionResult['status']) {
  if (status === 'OPEN') return '待处理';
  if (status === 'ACKNOWLEDGED') return '已确认';
  if (status === 'ESCALATED') return '已升级';
  return '已关闭';
}

function approvalClosureRate(closed: number, total: number) {
  if (total <= 0) return '100%';
  return `${Math.round((closed / total) * 100)}%`;
}

function securityOperationActionVerb(action: SecurityOperationAlertAction) {
  if (action === 'ACKNOWLEDGE') return '确认';
  if (action === 'ESCALATE') return '升级';
  return '关闭';
}

function formatBytes(value: number) {
  if (value <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = value;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }
  return `${size.toFixed(size >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}
