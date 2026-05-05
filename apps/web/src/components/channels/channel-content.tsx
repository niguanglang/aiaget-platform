'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  hasPermission,
  type AgentListItem,
  type ChannelAccountItem,
  type ChannelDeliveryItem,
  type ChannelOperationsListResult,
  type ChannelProviderItem,
  type CreateChannelAccountInput,
  type CreateChannelProviderInput,
  type CreateChannelRouteRuleInput,
  type CreateChannelTemplateInput,
  type ChannelPublishApprovalInput,
  type ChannelPublishControl,
  type ChannelPublishRolloutInput,
  type ChannelPublishApprovalStatus,
  type ChannelPublishRolloutStatus,
  type ChannelReleaseBatchInput,
  type ChannelReleaseBatchStatus,
  type ChannelReleaseAutomationDecision,
  type ChannelReleaseAutomationOverview,
  type ChannelReleaseAutomationPolicy,
  type ChannelReleaseAutomationPolicyInput,
  type ChannelReleaseGateDecision,
  type ChannelReleaseGateOverview,
  type ChannelReleaseGatePolicy,
  type ChannelReleaseGatePolicyInput,
  type ChannelReleasePipeline,
  type ChannelReleaseReport,
  type ChannelReleaseReportSnapshotCompareResult,
  type ChannelReleaseReportSnapshotDetail,
  type ChannelReleaseReportSnapshotOverview,
  type ChannelReleaseSchedulerOverview,
  type ChannelReleaseSchedulerRunResult,
  type ChannelReleasePipelineStepStatus,
  type ChannelReleaseSelfHealingDecision,
  type ChannelReleaseSelfHealingOverview,
  type ChannelReleaseSelfHealingPolicy,
  type ChannelReleaseSelfHealingPolicyInput,
  type ChannelPublishJobItem,
  type ChannelReplyItem,
  type ChannelRouteRuleItem,
  type ChannelTemplateItem,
  type ChannelRolloutGateOverview,
  type ChannelRolloutGateDecisionReason,
  type ChannelRolloutGateStatus,
  type ChannelCallbackProvider,
  type ChannelSenderDeliveryDetail,
  type ChannelSenderDeliveryListItem,
  type ChannelSenderDeliveryStatus,
  type ChannelSenderPolicy,
  type ChannelSenderTaskOverview,
  type ChannelSenderTaskRunResult,
  type PlatformEventListItem,
  type PublishChannelListItem,
  type PublishChannelStatus,
  type PublishChannelType,
  type UpdateChannelAccountInput,
  type UpdateChannelProviderInput,
  type UpdateChannelRouteRuleInput,
  type UpdateChannelTemplateInput,
  type UpdateChannelPublishControlInput,
  type UpdateChannelSenderPolicyInput,
} from '@aiaget/shared-types';
import {
  Activity,
  CheckCircle2,
  ClipboardCheck,
  Copy,
  Edit,
  Gauge,
  GitBranch,
  Inbox,
  ListRestart,
  MessageSquareReply,
  Network,
  Plus,
  Power,
  PowerOff,
  RadioTower,
  RefreshCw,
  Reply,
  RotateCcw,
  Save,
  Search,
  Signal,
  Trash2,
  X,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useMemo, useState } from 'react';

import { useAuth } from '@/components/auth/auth-provider';
import { formatDateTime } from '@/components/agents/agent-status';
import { ChannelCenterBackground } from '@/components/channels/channel-center-background';
import {
  ChannelAccountForm,
  ChannelProviderForm,
  type ChannelAccountFormValues,
  type ChannelProviderFormValues,
} from '@/components/channels/channel-provider-account-forms';
import {
  formatChannelDateTime,
  publishChannelHealthLabel,
  publishChannelHealthStatuses,
  publishChannelHealthTone,
  publishChannelStatusLabel,
  publishChannelStatuses,
  publishChannelStatusTone,
  publishChannelTypeLabel,
  publishChannelTypes,
} from '@/components/channels/channel-status';
import {
  ChannelRouteRuleForm,
  ChannelTemplateForm,
  type ChannelRouteRuleFormValues,
  type ChannelTemplateFormValues,
} from '@/components/channels/channel-template-route-forms';
import { parseJsonObjectText, stringifyJson } from '@/components/tools/tool-json';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { MetricCard } from '@/components/ui/metric-card';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  approveChannelPublish,
  abortChannelReleaseBatch,
  cancelChannelPublishJob,
  checkPublishChannel,
  createChannelAccount,
  createChannelProvider,
  createChannelRouteRule,
  createChannelTemplate,
  deleteChannelAccount,
  deleteChannelProvider,
  deleteChannelRouteRule,
  deleteChannelTemplate,
  disableChannelAccount,
  disableChannelProvider,
  disableChannelRouteRule,
  disableChannelTemplate,
  compareChannelReleaseReportSnapshots,
  createChannelReleaseReportSnapshot,
  disablePublishChannel,
  enableChannelAccount,
  enableChannelProvider,
  enableChannelRouteRule,
  enableChannelTemplate,
  enablePublishChannel,
  evaluateChannelReleaseGate,
  getChannelPublishControl,
  getChannelPublishJob,
  getChannelReleaseAutomation,
  getChannelReleaseGate,
  getChannelReleasePipeline,
  getChannelReleaseReport,
  getChannelReleaseReportSnapshot,
  getChannelReleaseSchedulerOverview,
  getChannelReleaseSelfHealing,
  getChannelRolloutGateOverview,
  getChannelSenderDelivery,
  getChannelSenderPolicy,
  getChannelSenderTaskOverview,
  getExternalChannelCallbackEndpoint,
  getExternalChannelChatEndpoint,
  getExternalChannelStreamEndpoint,
  getPublishChannelOverview,
  listChannelAccounts,
  listChannelDeliveries,
  listChannelProviders,
  listChannelPublishJobs,
  listChannelReplies,
  listChannelRouteRules,
  listChannelReleaseReportSnapshots,
  listAgents,
  listChannelSenderDeliveries,
  listChannelTemplates,
  rejectChannelPublish,
  requestChannelPublishApproval,
  markChannelReleaseFull,
  rollbackChannelPublish,
  retryChannelSenderDelivery,
  retryChannelPublishJob,
  runChannelSenderAutoRetry,
  runChannelSenderCleanup,
  runChannelReleaseAutomation,
  runChannelReleaseSchedulerOnce,
  runChannelReleaseSelfHealing,
  startChannelReleaseBatch,
  updateChannelAccount,
  updateChannelPublishControl,
  updateChannelProvider,
  updateChannelReleaseAutomation,
  updateChannelReleaseGate,
  updateChannelRouteRule,
  updateChannelReleaseSelfHealing,
  updateChannelRollout,
  updateChannelSenderPolicy,
  updateChannelTemplate,
  updatePublishChannel,
  upsertPublishChannel,
  type ApiClientError,
} from '@/lib/api-client';
import { cn } from '@/lib/utils';

interface ChannelFormValues {
  id?: string;
  agent_id: string;
  channel: PublishChannelType;
  name: string;
  description: string;
  endpoint_url: string;
  callback_url: string;
  secret: string;
  config_text: string;
  status: PublishChannelStatus;
}

type ActionKind = 'enable' | 'disable' | 'check';
type ChannelOperationsModule = 'overview' | 'publish' | 'providers' | 'accounts' | 'templates' | 'route-rules' | 'jobs' | 'deliveries' | 'replies';
type ChannelOperationsEditableModule = Extract<ChannelOperationsModule, 'providers' | 'accounts' | 'templates' | 'route-rules'>;
type ChannelOperationsEditMode = 'create' | 'edit' | null;
type ChannelOperationsItem =
  | ChannelProviderItem
  | ChannelAccountItem
  | ChannelTemplateItem
  | ChannelRouteRuleItem
  | ChannelPublishJobItem
  | ChannelDeliveryItem
  | ChannelReplyItem;
type ChannelOperationsSubmitPayload =
  | {
      itemId?: string;
      mode: Exclude<ChannelOperationsEditMode, null>;
      module: 'providers';
      values: ChannelProviderFormValues;
    }
  | {
      itemId?: string;
      mode: Exclude<ChannelOperationsEditMode, null>;
      module: 'accounts';
      values: ChannelAccountFormValues;
    }
  | {
      itemId?: string;
      mode: Exclude<ChannelOperationsEditMode, null>;
      module: 'templates';
      values: ChannelTemplateFormValues;
    }
  | {
      itemId?: string;
      mode: Exclude<ChannelOperationsEditMode, null>;
      module: 'route-rules';
      values: ChannelRouteRuleFormValues;
    };
type ChannelOperationsItemActionPayload = {
  itemId: string;
  module: ChannelOperationsEditableModule;
};

const channelSenderDeliveryStatuses: ChannelSenderDeliveryStatus[] = ['PENDING', 'SUCCESS', 'FAILED', 'SKIPPED', 'RETRYING'];
const channelSenderProviders: ChannelCallbackProvider[] = ['WECHAT_WORK', 'DINGTALK', 'FEISHU', 'SLACK', 'CUSTOM_WEBHOOK'];
const channelOperationsModules: Array<{ description: string; label: string; value: ChannelOperationsModule }> = [
  { description: '关键指标与运营态势', label: '总览', value: 'overview' },
  { description: '已发布 Agent 入口', label: '发布渠道', value: 'publish' },
  { description: '企业微信、飞书等平台', label: '渠道提供方', value: 'providers' },
  { description: '平台账号与凭证状态', label: '账号', value: 'accounts' },
  { description: '消息模板与版本', label: '模板', value: 'templates' },
  { description: '入站/出站匹配规则', label: '路由规则', value: 'route-rules' },
  { description: '发布与推送任务', label: '发布任务', value: 'jobs' },
  { description: '统一投递流水', label: '投递记录', value: 'deliveries' },
  { description: '入站回复与关联链路', label: '回复记录', value: 'replies' },
];

export function ChannelContent() {
  const queryClient = useQueryClient();
  const auth = useAuthPermissions();
  const [keyword, setKeyword] = useState('');
  const [channelFilter, setChannelFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [healthFilter, setHealthFilter] = useState('');
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  const [senderStatusFilter, setSenderStatusFilter] = useState('');
  const [senderProviderFilter, setSenderProviderFilter] = useState('');
  const [senderAllChannels, setSenderAllChannels] = useState(false);
  const [selectedDeliveryId, setSelectedDeliveryId] = useState<string | null>(null);
  const [operationsModule, setOperationsModule] = useState<ChannelOperationsModule>('overview');
  const [operationsKeyword, setOperationsKeyword] = useState('');
  const [operationsStatusFilter, setOperationsStatusFilter] = useState('');
  const [operationsProviderFilter, setOperationsProviderFilter] = useState('');
  const [selectedOperationsItemId, setSelectedOperationsItemId] = useState<string | null>(null);
  const [operationsEditMode, setOperationsEditMode] = useState<ChannelOperationsEditMode>(null);
  const [selectedSnapshotId, setSelectedSnapshotId] = useState<string | null>(null);
  const [baseSnapshotId, setBaseSnapshotId] = useState<string | null>(null);
  const [targetSnapshotId, setTargetSnapshotId] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<ChannelFormValues | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const canView = auth.canView;
  const canManage = auth.canManage;
  const canDeploy = auth.canDeploy;
  const canDisable = auth.canDisable;

  const overviewQuery = useQuery({
    enabled: canView,
    queryKey: ['publish-channel-overview'],
    queryFn: getPublishChannelOverview,
  });

  const agentsQuery = useQuery({
    enabled: canView,
    queryKey: ['publish-channel-agent-options'],
    queryFn: () => listAgents({ page: 1, page_size: 100, status: 'PUBLISHED' }),
  });

  const channels = overviewQuery.data?.channels ?? [];
  const agents = agentsQuery.data?.items ?? [];

  const filteredChannels = useMemo(() => {
    return channels.filter((channel) => {
      if (!matchesChannelKeyword(channel, keyword)) return false;
      if (channelFilter && channel.channel !== channelFilter) return false;
      if (statusFilter && channel.status !== statusFilter) return false;
      if (healthFilter && channel.health_status !== healthFilter) return false;

      return true;
    });
  }, [channelFilter, channels, healthFilter, keyword, statusFilter]);

  const selectedChannel = useMemo(() => {
    if (selectedChannelId) {
      const existing = channels.find((channel) => channel.id === selectedChannelId);
      if (existing) return existing;
    }

    return filteredChannels[0] ?? channels[0] ?? null;
  }, [channels, filteredChannels, selectedChannelId]);

  useEffect(() => {
    setSelectedOperationsItemId(null);
    setOperationsEditMode(null);
  }, [operationsKeyword, operationsModule, operationsProviderFilter, operationsStatusFilter, selectedChannel?.id, senderAllChannels]);

  useEffect(() => {
    setSelectedSnapshotId(null);
    setBaseSnapshotId(null);
    setTargetSnapshotId(null);
  }, [selectedChannel?.id]);

  const senderDeliveriesQuery = useQuery({
    enabled: canView,
    queryKey: ['channel-sender-deliveries', senderAllChannels ? 'all' : selectedChannel?.id ?? 'none', senderStatusFilter, senderProviderFilter],
    queryFn: () =>
      listChannelSenderDeliveries({
        channel_id: senderAllChannels ? undefined : selectedChannel?.id,
        status: senderStatusFilter || undefined,
        provider: senderProviderFilter || undefined,
      }),
  });

  const selectedDeliveryQuery = useQuery({
    enabled: Boolean(selectedDeliveryId) && canView,
    queryKey: ['channel-sender-delivery', selectedDeliveryId],
    queryFn: () => getChannelSenderDelivery(selectedDeliveryId ?? ''),
  });

  const senderPolicyQuery = useQuery({
    enabled: Boolean(selectedChannel?.id) && canView,
    queryKey: ['channel-sender-policy', selectedChannel?.id ?? 'none'],
    queryFn: () => getChannelSenderPolicy(selectedChannel?.id ?? ''),
  });

  const senderTaskOverviewQuery = useQuery({
    enabled: canView,
    queryKey: ['channel-sender-task-overview'],
    queryFn: getChannelSenderTaskOverview,
  });

  const operationsParams = {
    keyword: operationsKeyword || undefined,
    status: operationsStatusFilter || undefined,
    provider: operationsProviderFilter || undefined,
    channel_id: operationsModule === 'overview' || senderAllChannels ? undefined : selectedChannel?.id,
    page: 1,
    page_size: 50,
  };

  const providersQuery = useQuery({
    enabled: canView,
    queryKey: ['channel-providers', operationsKeyword, operationsStatusFilter, operationsProviderFilter],
    queryFn: () => listChannelProviders(operationsParams),
  });

  const accountsQuery = useQuery({
    enabled: canView,
    queryKey: ['channel-accounts', operationsKeyword, operationsStatusFilter, operationsProviderFilter, senderAllChannels ? 'all' : selectedChannel?.id ?? 'none'],
    queryFn: () => listChannelAccounts(operationsParams),
  });

  const templatesQuery = useQuery({
    enabled: canView,
    queryKey: ['channel-templates', operationsKeyword, operationsStatusFilter, operationsProviderFilter, senderAllChannels ? 'all' : selectedChannel?.id ?? 'none'],
    queryFn: () => listChannelTemplates(operationsParams),
  });

  const routeRulesQuery = useQuery({
    enabled: canView,
    queryKey: ['channel-route-rules', operationsKeyword, operationsStatusFilter, operationsProviderFilter, senderAllChannels ? 'all' : selectedChannel?.id ?? 'none'],
    queryFn: () => listChannelRouteRules(operationsParams),
  });

  const publishJobsQuery = useQuery({
    enabled: canView,
    queryKey: ['channel-publish-jobs', operationsKeyword, operationsStatusFilter, operationsProviderFilter, senderAllChannels ? 'all' : selectedChannel?.id ?? 'none'],
    queryFn: () => listChannelPublishJobs(operationsParams),
  });

  const selectedPublishJobId = operationsModule === 'jobs' ? selectedOperationsItemId : null;
  const selectedPublishJobQuery = useQuery({
    enabled: Boolean(canView && selectedPublishJobId),
    queryKey: ['channel-publish-job-detail', selectedPublishJobId ?? 'none'],
    queryFn: () => getChannelPublishJob(selectedPublishJobId ?? ''),
  });

  const deliveriesQuery = useQuery({
    enabled: canView,
    queryKey: ['channel-deliveries', operationsKeyword, operationsStatusFilter, operationsProviderFilter, senderAllChannels ? 'all' : selectedChannel?.id ?? 'none'],
    queryFn: () => listChannelDeliveries(operationsParams),
  });

  const repliesQuery = useQuery({
    enabled: canView,
    queryKey: ['channel-replies', operationsKeyword, operationsStatusFilter, operationsProviderFilter, senderAllChannels ? 'all' : selectedChannel?.id ?? 'none'],
    queryFn: () => listChannelReplies(operationsParams),
  });

  const operationsOverviewItems = [
    buildOperationsSummaryItem('providers', '渠道提供方', providersQuery.data, providersQuery.isLoading, providersQuery.isError, '平台适配与健康'),
    buildOperationsSummaryItem('accounts', '账号', accountsQuery.data, accountsQuery.isLoading, accountsQuery.isError, '凭证与归属'),
    buildOperationsSummaryItem('templates', '模板', templatesQuery.data, templatesQuery.isLoading, templatesQuery.isError, '消息模板版本'),
    buildOperationsSummaryItem('route-rules', '路由规则', routeRulesQuery.data, routeRulesQuery.isLoading, routeRulesQuery.isError, '匹配与兜底'),
    buildOperationsSummaryItem('jobs', '发布任务', publishJobsQuery.data, publishJobsQuery.isLoading, publishJobsQuery.isError, '任务执行状态'),
    buildOperationsSummaryItem('deliveries', '投递记录', deliveriesQuery.data, deliveriesQuery.isLoading, deliveriesQuery.isError, '统一发送流水'),
    buildOperationsSummaryItem('replies', '回复记录', repliesQuery.data, repliesQuery.isLoading, repliesQuery.isError, '入站回复链路'),
  ];
  const activeOperationsResult = getOperationsResult(operationsModule, {
    accounts: accountsQuery.data,
    deliveries: deliveriesQuery.data,
    jobs: publishJobsQuery.data,
    providers: providersQuery.data,
    replies: repliesQuery.data,
    routeRules: routeRulesQuery.data,
    templates: templatesQuery.data,
  });
  const activeOperationsLoading = getOperationsLoading(operationsModule, {
    accounts: accountsQuery.isLoading,
    deliveries: deliveriesQuery.isLoading,
    jobs: publishJobsQuery.isLoading,
    providers: providersQuery.isLoading,
    replies: repliesQuery.isLoading,
    routeRules: routeRulesQuery.isLoading,
    templates: templatesQuery.isLoading,
  });
  const activeOperationsError = getOperationsError(operationsModule, {
    accounts: accountsQuery.isError,
    deliveries: deliveriesQuery.isError,
    jobs: publishJobsQuery.isError,
    providers: providersQuery.isError,
    replies: repliesQuery.isError,
    routeRules: routeRulesQuery.isError,
    templates: templatesQuery.isError,
  });
  const activeOperationsItems = activeOperationsResult?.items ?? [];
  const activeOperationsSelectedItem =
    operationsModule === 'jobs' && selectedPublishJobQuery.data
      ? selectedPublishJobQuery.data
      : activeOperationsItems.find((item) => item.id === selectedOperationsItemId) ?? activeOperationsItems[0] ?? null;
  const editableOperationsModule = getEditableOperationsModule(operationsModule);
  const providerFilterOptions = buildProviderFilterOptions(providersQuery.data?.items ?? []);

  async function refreshOperations() {
    await Promise.all([
      providersQuery.refetch(),
      accountsQuery.refetch(),
      templatesQuery.refetch(),
      routeRulesQuery.refetch(),
      publishJobsQuery.refetch(),
      deliveriesQuery.refetch(),
      repliesQuery.refetch(),
    ]);
  }

  const releaseSchedulerOverviewQuery = useQuery({
    enabled: canView,
    queryKey: ['channel-release-scheduler-overview'],
    queryFn: getChannelReleaseSchedulerOverview,
  });

  const publishControlQuery = useQuery({
    enabled: Boolean(selectedChannel?.id) && canView,
    queryKey: ['channel-publish-control', selectedChannel?.id ?? 'none'],
    queryFn: () => getChannelPublishControl(selectedChannel?.id ?? ''),
  });

  const rolloutGateOverviewQuery = useQuery({
    enabled: Boolean(selectedChannel?.id) && canView,
    queryKey: ['channel-rollout-gate-overview', selectedChannel?.id ?? 'none'],
    queryFn: () => getChannelRolloutGateOverview(selectedChannel?.id ?? ''),
  });

  const releasePipelineQuery = useQuery({
    enabled: Boolean(selectedChannel?.id) && canView,
    queryKey: ['channel-release-pipeline', selectedChannel?.id ?? 'none'],
    queryFn: () => getChannelReleasePipeline(selectedChannel?.id ?? ''),
  });

  const releaseReportQuery = useQuery({
    enabled: Boolean(selectedChannel?.id) && canView,
    queryKey: ['channel-release-report', selectedChannel?.id ?? 'none'],
    queryFn: () => getChannelReleaseReport(selectedChannel?.id ?? ''),
  });

  const releaseReportSnapshotsQuery = useQuery({
    enabled: Boolean(selectedChannel?.id) && canView,
    queryKey: ['channel-release-report-snapshots', selectedChannel?.id ?? 'none'],
    queryFn: () => listChannelReleaseReportSnapshots(selectedChannel?.id ?? ''),
  });

  const selectedReportSnapshotQuery = useQuery({
    enabled: Boolean(selectedChannel?.id && selectedSnapshotId) && canView,
    queryKey: ['channel-release-report-snapshot', selectedChannel?.id ?? 'none', selectedSnapshotId ?? 'none'],
    queryFn: () => getChannelReleaseReportSnapshot(selectedChannel?.id ?? '', selectedSnapshotId ?? ''),
  });

  const releaseReportSnapshotCompareQuery = useQuery({
    enabled: Boolean(selectedChannel?.id && baseSnapshotId && targetSnapshotId && baseSnapshotId !== targetSnapshotId) && canView,
    queryKey: [
      'channel-release-report-snapshot-compare',
      selectedChannel?.id ?? 'none',
      baseSnapshotId ?? 'none',
      targetSnapshotId ?? 'none',
    ],
    queryFn: () => compareChannelReleaseReportSnapshots(selectedChannel?.id ?? '', baseSnapshotId ?? '', targetSnapshotId ?? ''),
  });

  const releaseGateQuery = useQuery({
    enabled: Boolean(selectedChannel?.id) && canView,
    queryKey: ['channel-release-gate', selectedChannel?.id ?? 'none'],
    queryFn: () => getChannelReleaseGate(selectedChannel?.id ?? ''),
  });

  const releaseAutomationQuery = useQuery({
    enabled: Boolean(selectedChannel?.id) && canView,
    queryKey: ['channel-release-automation', selectedChannel?.id ?? 'none'],
    queryFn: () => getChannelReleaseAutomation(selectedChannel?.id ?? ''),
  });

  const releaseSelfHealingQuery = useQuery({
    enabled: Boolean(selectedChannel?.id) && canView,
    queryKey: ['channel-release-self-healing', selectedChannel?.id ?? 'none'],
    queryFn: () => getChannelReleaseSelfHealing(selectedChannel?.id ?? ''),
  });

  const metrics = [
    {
      helper: '租户渠道配置',
      label: '发布渠道',
      value: `${overviewQuery.data?.summary.total_channels ?? channels.length}`,
    },
    {
      helper: '当前可对外服务',
      label: '启用渠道',
      value: `${overviewQuery.data?.summary.active_channels ?? 0}`,
    },
    {
      helper: 'ERROR 或不可用',
      label: '异常渠道',
      value: `${overviewQuery.data?.summary.error_channels ?? 0}`,
    },
    {
      helper: '最近 24 小时',
      label: '渠道请求',
      value: formatNumber(overviewQuery.data?.summary.total_requests_24h ?? 0),
    },
    {
      helper: '按请求量加权',
      label: '成功率',
      value: `${overviewQuery.data?.summary.success_rate_24h ?? 0}%`,
    },
    {
      helper: '已绑定启用渠道',
      label: '覆盖 Agent',
      value: `${overviewQuery.data?.summary.active_agent_count ?? 0}`,
    },
  ];

  const saveMutation = useMutation({
    mutationFn: (values: ChannelFormValues) => {
      const parsedConfig = parseJsonObjectText(values.config_text, '渠道配置', { allowEmpty: true });
      if (!parsedConfig.ok) {
        throw new Error(parsedConfig.message);
      }
      if (!values.name.trim()) {
        throw new Error('渠道名称不能为空。');
      }
      if (!values.id && !values.agent_id) {
        throw new Error('请选择要发布的 Agent。');
      }

      const payload = {
        name: values.name.trim(),
        description: toNullable(values.description),
        endpoint_url: toNullable(values.endpoint_url),
        callback_url: toNullable(values.callback_url),
        secret: toNullable(values.secret),
        config: parsedConfig.value,
        status: values.status,
      };

      if (values.id) {
        return updatePublishChannel(values.id, payload);
      }

      return upsertPublishChannel({
        agent_id: values.agent_id,
        channel: values.channel,
        ...payload,
      });
    },
    onSuccess: async (channel) => {
      setNotice(`${channel.name} 已保存。`);
      setErrorMessage(null);
      setFormError(null);
      setFormValues(null);
      setSelectedChannelId(channel.id);
      await refreshChannels();
    },
    onError: (error: Error) => {
      setNotice(null);
      setFormError(error.message);
    },
  });

  const actionMutation = useMutation({
    mutationFn: ({ channelId, action }: { channelId: string; action: ActionKind }) => {
      if (action === 'enable') return enablePublishChannel(channelId);
      if (action === 'disable') return disablePublishChannel(channelId);

      return checkPublishChannel(channelId);
    },
    onSuccess: async (channel) => {
      setNotice(`${channel.name} 已更新。`);
      setErrorMessage(null);
      setSelectedChannelId(channel.id);
      await refreshChannels();
    },
    onError: (error: ApiClientError) => {
      setNotice(null);
      setErrorMessage(error.message);
    },
  });

  const retryDeliveryMutation = useMutation({
    mutationFn: retryChannelSenderDelivery,
    onSuccess: async (result) => {
      setNotice(`主动回复投递 ${result.item.delivery_id} 已重试。`);
      setErrorMessage(null);
      setSelectedDeliveryId(result.item.delivery_id);
      await Promise.all([
        senderDeliveriesQuery.refetch(),
        queryClient.invalidateQueries({ queryKey: ['publish-channel-overview'] }),
      ]);
    },
    onError: (error: ApiClientError) => {
      setNotice(null);
      setErrorMessage(error.message);
    },
  });

  const publishJobActionMutation = useMutation({
    mutationFn: ({ action, jobId }: { action: 'cancel' | 'retry'; jobId: string }) =>
      action === 'cancel' ? cancelChannelPublishJob(jobId) : retryChannelPublishJob(jobId),
    onSuccess: async (result) => {
      setNotice(result.message);
      setErrorMessage(null);
      setSelectedOperationsItemId(result.job.id);
      await Promise.all([
        publishJobsQuery.refetch(),
        queryClient.invalidateQueries({ queryKey: ['channel-publish-job-detail'] }),
        queryClient.invalidateQueries({ queryKey: ['publish-channel-overview'] }),
      ]);
    },
    onError: (error: ApiClientError) => {
      setNotice(null);
      setErrorMessage(error.message);
    },
  });

  const operationsSubmitMutation = useMutation<ChannelOperationsItem, Error, ChannelOperationsSubmitPayload>({
    mutationFn: async (payload) => {
      if (payload.module === 'providers') {
        const input = normalizeProviderFormValues(payload.values);
        if (payload.mode === 'edit') {
          if (!payload.itemId) throw new Error('请选择要编辑的渠道提供方。');
          return updateChannelProvider(payload.itemId, toUpdateChannelProviderInput(input));
        }

        return createChannelProvider(input);
      }

      if (payload.module === 'accounts') {
        const input = normalizeAccountFormValues(payload.values);
        if (payload.mode === 'edit') {
          if (!payload.itemId) throw new Error('请选择要编辑的渠道账号。');
          return updateChannelAccount(payload.itemId, toUpdateChannelAccountInput(input));
        }

        return createChannelAccount(input);
      }

      if (payload.module === 'templates') {
        const input = normalizeTemplateFormValues(payload.values);
        if (payload.mode === 'edit') {
          if (!payload.itemId) throw new Error('请选择要编辑的渠道模板。');
          return updateChannelTemplate(payload.itemId, toUpdateChannelTemplateInput(input));
        }

        return createChannelTemplate(input);
      }

      const input = normalizeRouteRuleFormValues(payload.values);
      if (payload.mode === 'edit') {
        if (!payload.itemId) throw new Error('请选择要编辑的路由规则。');
        return updateChannelRouteRule(payload.itemId, toUpdateChannelRouteRuleInput(input));
      }

      return createChannelRouteRule(input);
    },
    onSuccess: async (item, variables) => {
      setNotice(`${getOperationsEditableModuleLabel(variables.module)}已${variables.mode === 'edit' ? '保存' : '创建'}。`);
      setErrorMessage(null);
      setOperationsEditMode(null);
      setSelectedOperationsItemId(item.id);
      await refreshOperations();
    },
    onError: (error: Error) => {
      setNotice(null);
      setErrorMessage(error.message);
    },
  });

  const operationsEnableMutation = useMutation<ChannelOperationsItem, ApiClientError, ChannelOperationsItemActionPayload>({
    mutationFn: async ({ itemId, module }) => runOperationsStatusAction(module, itemId, 'enable'),
    onSuccess: async (item, variables) => {
      setNotice(`${getOperationsEditableModuleLabel(variables.module)}已启用。`);
      setErrorMessage(null);
      setSelectedOperationsItemId(item.id);
      await refreshOperations();
    },
    onError: (error: ApiClientError) => {
      setNotice(null);
      setErrorMessage(error.message);
    },
  });

  const operationsDisableMutation = useMutation<ChannelOperationsItem, ApiClientError, ChannelOperationsItemActionPayload>({
    mutationFn: async ({ itemId, module }) => runOperationsStatusAction(module, itemId, 'disable'),
    onSuccess: async (item, variables) => {
      setNotice(`${getOperationsEditableModuleLabel(variables.module)}已停用。`);
      setErrorMessage(null);
      setSelectedOperationsItemId(item.id);
      await refreshOperations();
    },
    onError: (error: ApiClientError) => {
      setNotice(null);
      setErrorMessage(error.message);
    },
  });

  const operationsDeleteMutation = useMutation<{ success: boolean }, ApiClientError, ChannelOperationsItemActionPayload>({
    mutationFn: async ({ itemId, module }) => runOperationsDeleteAction(module, itemId),
    onSuccess: async (_, variables) => {
      setNotice(`${getOperationsEditableModuleLabel(variables.module)}已删除。`);
      setErrorMessage(null);
      setOperationsEditMode(null);
      setSelectedOperationsItemId(null);
      await refreshOperations();
    },
    onError: (error: ApiClientError) => {
      setNotice(null);
      setErrorMessage(error.message);
    },
  });

  const updateSenderPolicyMutation = useMutation({
    mutationFn: ({ channelId, input }: { channelId: string; input: UpdateChannelSenderPolicyInput }) =>
      updateChannelSenderPolicy(channelId, input),
    onSuccess: async (policy) => {
      setNotice(`渠道投递策略已保存，最大重试次数 ${policy.max_retry_count} 次。`);
      setErrorMessage(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['channel-sender-policy'] }),
        queryClient.invalidateQueries({ queryKey: ['publish-channel-overview'] }),
      ]);
    },
    onError: (error: ApiClientError) => {
      setNotice(null);
      setErrorMessage(error.message);
    },
  });

  const runAutoRetryMutation = useMutation({
    mutationFn: runChannelSenderAutoRetry,
    onSuccess: async (result) => {
      setNotice(`自动重试扫描完成：重试 ${result.retried_count} 条，成功 ${result.success_count} 条。`);
      setErrorMessage(null);
      await Promise.all([
        senderTaskOverviewQuery.refetch(),
        senderDeliveriesQuery.refetch(),
        queryClient.invalidateQueries({ queryKey: ['publish-channel-overview'] }),
      ]);
    },
    onError: (error: ApiClientError) => {
      setNotice(null);
      setErrorMessage(error.message);
    },
  });

  const runCleanupMutation = useMutation({
    mutationFn: runChannelSenderCleanup,
    onSuccess: async (result) => {
      setNotice(`投递清理完成：删除 ${result.deleted_count} 条过期记录。`);
      setErrorMessage(null);
      await Promise.all([
        senderTaskOverviewQuery.refetch(),
        senderDeliveriesQuery.refetch(),
      ]);
    },
    onError: (error: ApiClientError) => {
      setNotice(null);
      setErrorMessage(error.message);
    },
  });

  const updatePublishControlMutation = useMutation({
    mutationFn: ({ channelId, input }: { channelId: string; input: UpdateChannelPublishControlInput }) =>
      updateChannelPublishControl(channelId, input),
    onSuccess: async () => {
      setNotice('渠道发布控制已保存。');
      setErrorMessage(null);
      await refreshPublishControl();
    },
    onError: (error: ApiClientError) => {
      setNotice(null);
      setErrorMessage(error.message);
    },
  });

  const publishApprovalMutation = useMutation({
    mutationFn: ({ channelId, action, input }: { channelId: string; action: 'request' | 'approve' | 'reject' | 'rollback'; input: ChannelPublishApprovalInput }) => {
      if (action === 'request') return requestChannelPublishApproval(channelId, input);
      if (action === 'approve') return approveChannelPublish(channelId, input);
      if (action === 'reject') return rejectChannelPublish(channelId, input);

      return rollbackChannelPublish(channelId, input);
    },
    onSuccess: async (_, variables) => {
      const actionLabels = {
        request: '发布审批已发起。',
        approve: '发布审批已通过。',
        reject: '发布审批已拒绝。',
        rollback: '渠道发布已回滚。',
      };
      setNotice(actionLabels[variables.action]);
      setErrorMessage(null);
      await refreshPublishControl();
    },
    onError: (error: ApiClientError) => {
      setNotice(null);
      setErrorMessage(error.message);
    },
  });

  const updateRolloutMutation = useMutation({
    mutationFn: ({ channelId, input }: { channelId: string; input: ChannelPublishRolloutInput }) =>
      updateChannelRollout(channelId, input),
    onSuccess: async (control) => {
      setNotice(`渠道灰度比例已更新为 ${control.rollout_percentage}%。`);
      setErrorMessage(null);
      await refreshPublishControl();
    },
    onError: (error: ApiClientError) => {
      setNotice(null);
      setErrorMessage(error.message);
    },
  });

  const releasePipelineMutation = useMutation({
    mutationFn: ({ channelId, action, input }: { channelId: string; action: 'start' | 'full' | 'abort'; input: ChannelReleaseBatchInput }) => {
      if (action === 'start') return startChannelReleaseBatch(channelId, input);
      if (action === 'full') return markChannelReleaseFull(channelId, input);

      return abortChannelReleaseBatch(channelId, input);
    },
    onSuccess: async (_, variables) => {
      const actionLabels = {
        start: '渠道发布批次已创建。',
        full: '渠道发布批次已标记为全量。',
        abort: '渠道发布批次已终止。',
      };
      setNotice(actionLabels[variables.action]);
      setErrorMessage(null);
      await refreshReleasePipeline();
    },
    onError: (error: ApiClientError) => {
      setNotice(null);
      setErrorMessage(error.message);
    },
  });

  const updateReleaseGateMutation = useMutation({
    mutationFn: ({ channelId, input }: { channelId: string; input: ChannelReleaseGatePolicyInput }) =>
      updateChannelReleaseGate(channelId, input),
    onSuccess: async (overview) => {
      setNotice(`渠道发布观测门禁已保存，当前结论：${releaseGateDecisionLabel(overview.evaluation.decision)}。`);
      setErrorMessage(null);
      await refreshReleaseGate();
    },
    onError: (error: ApiClientError) => {
      setNotice(null);
      setErrorMessage(error.message);
    },
  });

  const evaluateReleaseGateMutation = useMutation({
    mutationFn: evaluateChannelReleaseGate,
    onSuccess: async (overview) => {
      setNotice(`渠道发布观测门禁已评估：${releaseGateDecisionLabel(overview.evaluation.decision)}。`);
      setErrorMessage(null);
      await refreshReleaseGate();
    },
    onError: (error: ApiClientError) => {
      setNotice(null);
      setErrorMessage(error.message);
    },
  });

  const updateReleaseAutomationMutation = useMutation({
    mutationFn: ({ channelId, input }: { channelId: string; input: ChannelReleaseAutomationPolicyInput }) =>
      updateChannelReleaseAutomation(channelId, input),
    onSuccess: async () => {
      setNotice('渠道自动推进执行器策略已保存。');
      setErrorMessage(null);
      await refreshReleaseAutomation();
    },
    onError: (error: ApiClientError) => {
      setNotice(null);
      setErrorMessage(error.message);
    },
  });

  const runReleaseAutomationMutation = useMutation({
    mutationFn: runChannelReleaseAutomation,
    onSuccess: async (overview) => {
      const decision = overview.last_run ? releaseAutomationDecisionLabel(overview.last_run.decision) : '已完成';
      setNotice(`渠道自动推进执行完成：${decision}。`);
      setErrorMessage(null);
      await refreshReleaseAutomation();
    },
    onError: (error: ApiClientError) => {
      setNotice(null);
      setErrorMessage(error.message);
    },
  });

  const updateReleaseSelfHealingMutation = useMutation({
    mutationFn: ({ channelId, input }: { channelId: string; input: ChannelReleaseSelfHealingPolicyInput }) =>
      updateChannelReleaseSelfHealing(channelId, input),
    onSuccess: async () => {
      setNotice('渠道发布自愈策略已保存。');
      setErrorMessage(null);
      await refreshReleaseSelfHealing();
    },
    onError: (error: ApiClientError) => {
      setNotice(null);
      setErrorMessage(error.message);
    },
  });

  const runReleaseSelfHealingMutation = useMutation({
    mutationFn: runChannelReleaseSelfHealing,
    onSuccess: async (overview) => {
      const decision = overview.last_run ? releaseSelfHealingDecisionLabel(overview.last_run.decision) : '已完成';
      setNotice(`渠道发布自愈执行完成：${decision}。`);
      setErrorMessage(null);
      await refreshReleaseSelfHealing();
    },
    onError: (error: ApiClientError) => {
      setNotice(null);
      setErrorMessage(error.message);
    },
  });

  const runReleaseSchedulerMutation = useMutation({
    mutationFn: runChannelReleaseSchedulerOnce,
    onSuccess: async (result) => {
      setNotice(`渠道发布巡检完成：派发 ${result.dispatched_count} 个任务，失败 ${result.failed_count} 个。`);
      setErrorMessage(null);
      await refreshReleaseScheduler();
    },
    onError: (error: ApiClientError) => {
      setNotice(null);
      setErrorMessage(error.message);
    },
  });

  const createReleaseReportSnapshotMutation = useMutation({
    mutationFn: createChannelReleaseReportSnapshot,
    onSuccess: async (snapshot) => {
      setSelectedSnapshotId(snapshot.snapshot_id);
      setTargetSnapshotId(snapshot.snapshot_id);
      setNotice('渠道发布复盘报告已归档为快照。');
      setErrorMessage(null);
      await refreshReleaseReportSnapshots();
    },
    onError: (error: ApiClientError) => {
      setNotice(null);
      setErrorMessage(error.message);
    },
  });

  async function refreshChannels() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['publish-channel-overview'] }),
      queryClient.invalidateQueries({ queryKey: ['resource-acl-overview'] }),
      queryClient.invalidateQueries({ queryKey: ['channel-sender-deliveries'] }),
    ]);
  }

  async function refreshPublishControl() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['channel-publish-control'] }),
      queryClient.invalidateQueries({ queryKey: ['channel-rollout-gate-overview'] }),
      queryClient.invalidateQueries({ queryKey: ['channel-release-gate'] }),
      queryClient.invalidateQueries({ queryKey: ['channel-release-automation'] }),
      queryClient.invalidateQueries({ queryKey: ['channel-release-self-healing'] }),
      queryClient.invalidateQueries({ queryKey: ['publish-channel-overview'] }),
      queryClient.invalidateQueries({ queryKey: ['channel-sender-task-overview'] }),
    ]);
  }

  async function refreshReleasePipeline() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['channel-release-pipeline'] }),
      queryClient.invalidateQueries({ queryKey: ['channel-release-report'] }),
      queryClient.invalidateQueries({ queryKey: ['channel-release-gate'] }),
      queryClient.invalidateQueries({ queryKey: ['channel-release-automation'] }),
      queryClient.invalidateQueries({ queryKey: ['channel-release-self-healing'] }),
      queryClient.invalidateQueries({ queryKey: ['channel-publish-control'] }),
      queryClient.invalidateQueries({ queryKey: ['channel-rollout-gate-overview'] }),
      queryClient.invalidateQueries({ queryKey: ['publish-channel-overview'] }),
    ]);
  }

  async function refreshReleaseGate() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['channel-release-gate'] }),
      queryClient.invalidateQueries({ queryKey: ['channel-release-report'] }),
      queryClient.invalidateQueries({ queryKey: ['channel-release-automation'] }),
      queryClient.invalidateQueries({ queryKey: ['channel-release-self-healing'] }),
      queryClient.invalidateQueries({ queryKey: ['channel-release-pipeline'] }),
      queryClient.invalidateQueries({ queryKey: ['channel-rollout-gate-overview'] }),
      queryClient.invalidateQueries({ queryKey: ['publish-channel-overview'] }),
    ]);
  }

  async function refreshReleaseAutomation() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['channel-release-automation'] }),
      queryClient.invalidateQueries({ queryKey: ['channel-release-self-healing'] }),
      queryClient.invalidateQueries({ queryKey: ['channel-release-scheduler-overview'] }),
      queryClient.invalidateQueries({ queryKey: ['channel-release-report'] }),
      queryClient.invalidateQueries({ queryKey: ['channel-release-gate'] }),
      queryClient.invalidateQueries({ queryKey: ['channel-release-pipeline'] }),
      queryClient.invalidateQueries({ queryKey: ['channel-publish-control'] }),
      queryClient.invalidateQueries({ queryKey: ['channel-rollout-gate-overview'] }),
      queryClient.invalidateQueries({ queryKey: ['publish-channel-overview'] }),
    ]);
  }

  async function refreshReleaseSelfHealing() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['channel-release-self-healing'] }),
      queryClient.invalidateQueries({ queryKey: ['channel-release-automation'] }),
      queryClient.invalidateQueries({ queryKey: ['channel-release-scheduler-overview'] }),
      queryClient.invalidateQueries({ queryKey: ['channel-release-report'] }),
      queryClient.invalidateQueries({ queryKey: ['channel-release-gate'] }),
      queryClient.invalidateQueries({ queryKey: ['channel-release-pipeline'] }),
      queryClient.invalidateQueries({ queryKey: ['channel-publish-control'] }),
      queryClient.invalidateQueries({ queryKey: ['channel-rollout-gate-overview'] }),
      queryClient.invalidateQueries({ queryKey: ['publish-channel-overview'] }),
    ]);
  }

  async function refreshReleaseScheduler() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['channel-release-scheduler-overview'] }),
      queryClient.invalidateQueries({ queryKey: ['channel-release-report'] }),
      queryClient.invalidateQueries({ queryKey: ['channel-release-automation'] }),
      queryClient.invalidateQueries({ queryKey: ['channel-release-self-healing'] }),
      queryClient.invalidateQueries({ queryKey: ['channel-release-gate'] }),
      queryClient.invalidateQueries({ queryKey: ['channel-release-pipeline'] }),
      queryClient.invalidateQueries({ queryKey: ['channel-publish-control'] }),
      queryClient.invalidateQueries({ queryKey: ['publish-channel-overview'] }),
    ]);
  }

  async function refreshReleaseReportSnapshots() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['channel-release-report-snapshots'] }),
      queryClient.invalidateQueries({ queryKey: ['channel-release-report-snapshot'] }),
      queryClient.invalidateQueries({ queryKey: ['channel-release-report-snapshot-compare'] }),
      queryClient.invalidateQueries({ queryKey: ['channel-release-report'] }),
    ]);
  }

  function openCreateForm() {
    setFormError(null);
    setFormValues({
      agent_id: agents[0]?.id ?? '',
      channel: 'WEB_WIDGET',
      name: '',
      description: '',
      endpoint_url: '',
      callback_url: '',
      secret: '',
      config_text: '{\n  "entry": "default"\n}',
      status: 'DRAFT',
    });
  }

  function openEditForm(channel: PublishChannelListItem) {
    setFormError(null);
    setFormValues({
      id: channel.id,
      agent_id: channel.agent_id,
      channel: channel.channel,
      name: channel.name,
      description: channel.description ?? '',
      endpoint_url: channel.endpoint_url ?? '',
      callback_url: channel.callback_url ?? '',
      secret: '',
      config_text: stringifyJson(channel.config, ''),
      status: channel.status,
    });
  }

  function openOperationsCreateForm() {
    if (!editableOperationsModule) return;
    setOperationsEditMode('create');
    setSelectedOperationsItemId(null);
    setNotice(null);
    setErrorMessage(null);
  }

  function openOperationsEditForm() {
    if (!editableOperationsModule || !activeOperationsSelectedItem) return;
    setOperationsEditMode('edit');
    setSelectedOperationsItemId(activeOperationsSelectedItem.id);
    setNotice(null);
    setErrorMessage(null);
  }

  function closeOperationsForm() {
    setOperationsEditMode(null);
  }

  function submitProviderForm(values: ChannelProviderFormValues) {
    operationsSubmitMutation.mutate({
      itemId: activeOperationsSelectedItem?.id,
      mode: operationsEditMode ?? 'create',
      module: 'providers',
      values,
    });
  }

  function submitAccountForm(values: ChannelAccountFormValues) {
    operationsSubmitMutation.mutate({
      itemId: activeOperationsSelectedItem?.id,
      mode: operationsEditMode ?? 'create',
      module: 'accounts',
      values,
    });
  }

  function submitTemplateForm(values: ChannelTemplateFormValues) {
    operationsSubmitMutation.mutate({
      itemId: activeOperationsSelectedItem?.id,
      mode: operationsEditMode ?? 'create',
      module: 'templates',
      values,
    });
  }

  function submitRouteRuleForm(values: ChannelRouteRuleFormValues) {
    operationsSubmitMutation.mutate({
      itemId: activeOperationsSelectedItem?.id,
      mode: operationsEditMode ?? 'create',
      module: 'route-rules',
      values,
    });
  }

  function runSelectedOperationsAction(action: 'enable' | 'disable' | 'delete') {
    if (!editableOperationsModule || !activeOperationsSelectedItem) return;
    const payload = {
      itemId: activeOperationsSelectedItem.id,
      module: editableOperationsModule,
    };
    if (action === 'enable') {
      operationsEnableMutation.mutate(payload);
      return;
    }
    if (action === 'disable') {
      operationsDisableMutation.mutate(payload);
      return;
    }

    operationsDeleteMutation.mutate(payload);
  }

  if (!canView) {
    return (
      <main className="relative mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:px-6">
        <ChannelCenterBackground />
        <Card>
          <EmptyState
            description="当前账号缺少 channel:publish:view 权限，无法查看全渠道发布中心。请在角色权限中心或资源授权中心补充授权。"
            title="无权访问发布渠道"
          />
        </Card>
      </main>
    );
  }

  return (
    <main className="relative mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:px-6">
      <ChannelCenterBackground />

      <motion.section
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col justify-between gap-4 md:flex-row md:items-start"
        initial={{ opacity: 0, y: 10 }}
        transition={{ duration: 0.28, ease: 'easeOut' }}
      >
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <StatusBadge tone="ready">M63-4</StatusBadge>
            <StatusBadge tone="ready">M63-6</StatusBadge>
            <StatusBadge tone="healthy">发布中心</StatusBadge>
            <StatusBadge tone="healthy">IM 回调适配</StatusBadge>
            <StatusBadge tone="planned">Resource ACL</StatusBadge>
            {overviewQuery.data?.generated_at ? (
              <StatusBadge tone="loading">生成 {formatChannelDateTime(overviewQuery.data.generated_at)}</StatusBadge>
            ) : null}
          </div>
          <h1 className="text-2xl font-semibold">全渠道发布中心</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            将已发布 Agent 绑定到 Web 组件、开放 API、企业微信、钉钉、飞书和 Webhook，集中管理发布状态、入口地址、健康检查和 24 小时用量。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            disabled={overviewQuery.isFetching || agentsQuery.isFetching}
            onClick={() => {
              void overviewQuery.refetch();
              void agentsQuery.refetch();
            }}
            type="button"
            variant="outline"
          >
            <RefreshCw className={cn('size-4', overviewQuery.isFetching && 'animate-spin')} />
            刷新
          </Button>
          <Button disabled={!canManage || agents.length === 0} onClick={openCreateForm} type="button">
            <Plus className="size-4" />
            新建渠道
          </Button>
        </div>
      </motion.section>

      {notice ? (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {notice}
        </div>
      ) : null}
      {errorMessage || overviewQuery.isError ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {errorMessage ?? '发布渠道概览加载失败。'}
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        {metrics.map((metric) => (
          <MetricCard helper={metric.helper} key={metric.label} label={metric.label} value={metric.value} />
        ))}
      </section>

      <ChannelOperationsNav activeModule={operationsModule} modules={channelOperationsModules} onChange={setOperationsModule} />

      <ChannelOperationsPanel
        accounts={accountsQuery.data?.items ?? []}
        agents={agents}
        allChannels={senderAllChannels}
        canDisable={canDisable}
        canManage={canManage}
        editMode={operationsEditMode}
        error={activeOperationsError}
        formActionLoading={operationsSubmitMutation.isPending}
        items={activeOperationsItems}
        itemActionLoading={operationsEnableMutation.isPending || operationsDisableMutation.isPending || operationsDeleteMutation.isPending}
        jobActionLoading={publishJobActionMutation.isPending}
        jobDetailLoading={selectedPublishJobQuery.isLoading}
        loading={activeOperationsLoading}
        module={operationsModule}
        onAllChannelsChange={setSenderAllChannels}
        onCancelJob={(jobId) => publishJobActionMutation.mutate({ action: 'cancel', jobId })}
        onCancelOperationsEdit={closeOperationsForm}
        onCreateOperationsItem={openOperationsCreateForm}
        onDeleteOperationsItem={() => runSelectedOperationsAction('delete')}
        onDisableOperationsItem={() => runSelectedOperationsAction('disable')}
        onEditOperationsItem={openOperationsEditForm}
        onEnableOperationsItem={() => runSelectedOperationsAction('enable')}
        onKeywordChange={setOperationsKeyword}
        onModuleChange={setOperationsModule}
        onProviderChange={setOperationsProviderFilter}
        onRefresh={() => void refreshOperations()}
        onRefreshJob={(jobId) => {
          setSelectedOperationsItemId(jobId);
          void queryClient.invalidateQueries({ queryKey: ['channel-publish-job-detail', jobId] });
        }}
        onRetryJob={(jobId) => publishJobActionMutation.mutate({ action: 'retry', jobId })}
        onSelectItem={setSelectedOperationsItemId}
        onStatusChange={setOperationsStatusFilter}
        onSubmitAccount={submitAccountForm}
        onSubmitProvider={submitProviderForm}
        onSubmitRouteRule={submitRouteRuleForm}
        onSubmitTemplate={submitTemplateForm}
        overviewItems={operationsOverviewItems}
        provider={operationsProviderFilter}
        providers={providersQuery.data?.items ?? []}
        providerOptions={providerFilterOptions}
        selectedChannel={selectedChannel}
        selectedItem={activeOperationsSelectedItem}
        status={operationsStatusFilter}
        keyword={operationsKeyword}
        total={activeOperationsResult?.total ?? activeOperationsItems.length}
      />

      <section className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
        <Card className="overflow-hidden">
          <div className="border-b p-4">
            <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
              <div>
                <h2 className="text-sm font-semibold">渠道清单</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  显示 {filteredChannels.length} / {channels.length} 个发布渠道，列表受数据权限和资源授权约束。
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    className="w-full pl-9 lg:w-64"
                    onChange={(event) => setKeyword(event.target.value)}
                    placeholder="搜索渠道、Agent、地址"
                    value={keyword}
                  />
                </div>
                <SelectFilter
                  label="渠道类型"
                  onChange={setChannelFilter}
                  value={channelFilter}
                  values={publishChannelTypes.map((type) => ({ label: publishChannelTypeLabel(type), value: type }))}
                />
                <SelectFilter
                  label="发布状态"
                  onChange={setStatusFilter}
                  value={statusFilter}
                  values={publishChannelStatuses.map((status) => ({
                    label: publishChannelStatusLabel(status),
                    value: status,
                  }))}
                />
                <SelectFilter
                  label="健康状态"
                  onChange={setHealthFilter}
                  value={healthFilter}
                  values={publishChannelHealthStatuses.map((status) => ({
                    label: publishChannelHealthLabel(status),
                    value: status,
                  }))}
                />
              </div>
            </div>
          </div>

          <div className="divide-y">
            {overviewQuery.isLoading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <div className="animate-pulse p-4" key={index}>
                  <div className="h-4 w-1/3 rounded bg-slate-100" />
                  <div className="mt-3 h-3 w-2/3 rounded bg-slate-100" />
                </div>
              ))
            ) : filteredChannels.length === 0 ? (
              <EmptyState
                action={
                  canManage ? (
                    <Button disabled={agents.length === 0} onClick={openCreateForm} type="button">
                      <Plus className="size-4" />
                      新建发布渠道
                    </Button>
                  ) : null
                }
                description={channels.length === 0 ? '选择已发布 Agent 后创建第一个发布渠道。' : '当前筛选条件下没有匹配的发布渠道。'}
                title={channels.length === 0 ? '暂无发布渠道' : '没有匹配结果'}
              />
            ) : (
              filteredChannels.map((channel, index) => (
                <motion.button
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    'grid w-full gap-3 p-4 text-left transition-colors hover:bg-slate-50/80 lg:grid-cols-[1fr_180px_150px]',
                    selectedChannel?.id === channel.id && 'bg-blue-50/55',
                  )}
                  initial={{ opacity: 0, y: 8 }}
                  key={channel.id}
                  onClick={() => setSelectedChannelId(channel.id)}
                  transition={{ delay: index * 0.025, duration: 0.18 }}
                  type="button"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="truncate text-sm font-semibold">{channel.name}</span>
                      <StatusBadge tone="ready">{publishChannelTypeLabel(channel.channel)}</StatusBadge>
                      <StatusBadge tone={publishChannelStatusTone(channel.status)}>
                        {publishChannelStatusLabel(channel.status)}
                      </StatusBadge>
                    </div>
                    <div className="mt-2 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      <span className="truncate">Agent：{channel.agent?.name ?? '未知 Agent'}</span>
                      <span>版本 v{channel.agent?.version ?? 0}</span>
                      <span className="truncate">入口：{channel.endpoint_url ?? channel.callback_url ?? '未配置'}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs lg:block lg:space-y-1">
                    <div className="text-muted-foreground">24h 请求</div>
                    <div className="font-medium">{formatNumber(channel.request_count_24h)}</div>
                  </div>
                  <div className="flex items-center justify-between gap-2 lg:justify-end">
                    <StatusBadge tone={publishChannelHealthTone(channel.health_status)}>
                      {publishChannelHealthLabel(channel.health_status)}
                    </StatusBadge>
                    <span className="text-xs text-muted-foreground">{channel.success_rate_24h}%</span>
                  </div>
                </motion.button>
              ))
            )}
          </div>
        </Card>

        <div className="grid gap-4">
          {formValues ? (
            <ChannelFormPanel
              agents={agents}
              canEditIdentity={!formValues.id}
              error={formError}
              isSaving={saveMutation.isPending}
              onCancel={() => {
                setFormValues(null);
                setFormError(null);
              }}
              onChange={setFormValues}
              onSubmit={() => saveMutation.mutate(formValues)}
              values={formValues}
            />
          ) : (
            <ChannelDetailPanel
              canDeploy={canDeploy}
              canDisable={canDisable}
              canManage={canManage}
              channel={selectedChannel}
              isActing={actionMutation.isPending}
              onAction={(channelId, action) => actionMutation.mutate({ channelId, action })}
              onEdit={openEditForm}
            />
          )}

          <ChannelMixPanel mix={overviewQuery.data?.channel_mix ?? []} />
          <RecentEventsPanel events={overviewQuery.data?.recent_events ?? []} />
        </div>
      </section>

      <SenderDeliveryCenter
        allChannels={senderAllChannels}
        canManage={canManage}
        detail={selectedDeliveryQuery.data ?? null}
        detailLoading={selectedDeliveryQuery.isLoading}
        error={senderDeliveriesQuery.isError ? '主动回复投递记录加载失败。' : null}
        isRetrying={retryDeliveryMutation.isPending}
        loading={senderDeliveriesQuery.isLoading}
        onAllChannelsChange={setSenderAllChannels}
        onProviderChange={setSenderProviderFilter}
        onRefresh={() => void senderDeliveriesQuery.refetch()}
        onRetry={(deliveryId) => retryDeliveryMutation.mutate(deliveryId)}
        onSelectDelivery={setSelectedDeliveryId}
        onStatusChange={setSenderStatusFilter}
        provider={senderProviderFilter}
        selectedChannel={selectedChannel}
        selectedDeliveryId={selectedDeliveryId}
        status={senderStatusFilter}
        total={senderDeliveriesQuery.data?.total ?? 0}
        deliveries={senderDeliveriesQuery.data?.items ?? []}
      />

      <SenderPolicyPanel
        canManage={canManage}
        channel={selectedChannel}
        error={senderPolicyQuery.isError ? '渠道投递策略加载失败。' : null}
        isSaving={updateSenderPolicyMutation.isPending}
        loading={senderPolicyQuery.isLoading}
        onRefresh={() => void senderPolicyQuery.refetch()}
        onSave={(input) => {
          if (!selectedChannel) return;
          updateSenderPolicyMutation.mutate({ channelId: selectedChannel.id, input });
        }}
        policy={senderPolicyQuery.data ?? null}
      />

      <PublishControlPanel
        canApprove={canDeploy}
        canManage={canManage}
        canReject={canDisable}
        channel={selectedChannel}
        control={publishControlQuery.data ?? null}
        error={publishControlQuery.isError ? '渠道发布控制加载失败。' : null}
        isMutating={updatePublishControlMutation.isPending || publishApprovalMutation.isPending || updateRolloutMutation.isPending}
        loading={publishControlQuery.isLoading}
        onApprovalAction={(action, input) => {
          if (!selectedChannel) return;
          publishApprovalMutation.mutate({ channelId: selectedChannel.id, action, input });
        }}
        onRefresh={() => void publishControlQuery.refetch()}
        onSave={(input) => {
          if (!selectedChannel) return;
          updatePublishControlMutation.mutate({ channelId: selectedChannel.id, input });
        }}
        onUpdateRollout={(input) => {
          if (!selectedChannel) return;
          updateRolloutMutation.mutate({ channelId: selectedChannel.id, input });
        }}
      />

      <RolloutGatePanel
        channel={selectedChannel}
        error={rolloutGateOverviewQuery.isError ? '渠道灰度执行概览加载失败。' : null}
        loading={rolloutGateOverviewQuery.isLoading}
        onRefresh={() => void rolloutGateOverviewQuery.refetch()}
        overview={rolloutGateOverviewQuery.data ?? null}
      />

      <ReleasePipelinePanel
        canAbort={canDisable}
        canDeploy={canDeploy}
        canManage={canManage}
        channel={selectedChannel}
        error={releasePipelineQuery.isError ? '渠道发布流水线加载失败。' : null}
        isMutating={releasePipelineMutation.isPending}
        loading={releasePipelineQuery.isLoading}
        onAction={(action, input) => {
          if (!selectedChannel) return;
          releasePipelineMutation.mutate({ channelId: selectedChannel.id, action, input });
        }}
        onRefresh={() => void releasePipelineQuery.refetch()}
        pipeline={releasePipelineQuery.data ?? null}
      />

      <ReleaseGatePanel
        canManage={canManage}
        channel={selectedChannel}
        error={releaseGateQuery.isError ? '渠道发布观测门禁加载失败。' : null}
        isMutating={updateReleaseGateMutation.isPending || evaluateReleaseGateMutation.isPending}
        loading={releaseGateQuery.isLoading}
        onEvaluate={() => {
          if (!selectedChannel) return;
          evaluateReleaseGateMutation.mutate(selectedChannel.id);
        }}
        onRefresh={() => void releaseGateQuery.refetch()}
        onSave={(input) => {
          if (!selectedChannel) return;
          updateReleaseGateMutation.mutate({ channelId: selectedChannel.id, input });
        }}
        overview={releaseGateQuery.data ?? null}
      />

      <ReleaseAutomationPanel
        canDeploy={canDeploy}
        canManage={canManage}
        channel={selectedChannel}
        error={releaseAutomationQuery.isError ? '渠道自动推进执行器加载失败。' : null}
        isMutating={updateReleaseAutomationMutation.isPending || runReleaseAutomationMutation.isPending}
        loading={releaseAutomationQuery.isLoading}
        onRefresh={() => void releaseAutomationQuery.refetch()}
        onRun={() => {
          if (!selectedChannel) return;
          runReleaseAutomationMutation.mutate(selectedChannel.id);
        }}
        onSave={(input) => {
          if (!selectedChannel) return;
          updateReleaseAutomationMutation.mutate({ channelId: selectedChannel.id, input });
        }}
        overview={releaseAutomationQuery.data ?? null}
      />

      <ReleaseSelfHealingPanel
        canDeploy={canDeploy}
        canManage={canManage}
        channel={selectedChannel}
        error={releaseSelfHealingQuery.isError ? '渠道发布自愈加载失败。' : null}
        isMutating={updateReleaseSelfHealingMutation.isPending || runReleaseSelfHealingMutation.isPending}
        loading={releaseSelfHealingQuery.isLoading}
        onRefresh={() => void releaseSelfHealingQuery.refetch()}
        onRun={() => {
          if (!selectedChannel) return;
          runReleaseSelfHealingMutation.mutate(selectedChannel.id);
        }}
        onSave={(input) => {
          if (!selectedChannel) return;
          updateReleaseSelfHealingMutation.mutate({ channelId: selectedChannel.id, input });
        }}
        overview={releaseSelfHealingQuery.data ?? null}
      />

      <SenderTaskPanel
        canManage={canManage}
        error={senderTaskOverviewQuery.isError ? '渠道投递任务概览加载失败。' : null}
        isRunningAutoRetry={runAutoRetryMutation.isPending}
        isRunningCleanup={runCleanupMutation.isPending}
        loading={senderTaskOverviewQuery.isLoading}
        onRefresh={() => void senderTaskOverviewQuery.refetch()}
        onRunAutoRetry={() => runAutoRetryMutation.mutate()}
        onRunCleanup={() => runCleanupMutation.mutate()}
        overview={senderTaskOverviewQuery.data ?? null}
      />

      <ReleaseSchedulerPanel
        canDeploy={canDeploy}
        error={releaseSchedulerOverviewQuery.isError ? '渠道发布巡检加载失败。' : null}
        isRunning={runReleaseSchedulerMutation.isPending}
        loading={releaseSchedulerOverviewQuery.isLoading}
        onRefresh={() => void releaseSchedulerOverviewQuery.refetch()}
        onRun={() => runReleaseSchedulerMutation.mutate()}
        overview={releaseSchedulerOverviewQuery.data ?? null}
      />

      <ReleaseReportPanel
        baseSnapshotId={baseSnapshotId}
        canManage={canManage}
        channel={selectedChannel}
        compare={releaseReportSnapshotCompareQuery.data ?? null}
        compareError={releaseReportSnapshotCompareQuery.isError ? '报告快照版本对比加载失败。' : null}
        compareLoading={releaseReportSnapshotCompareQuery.isLoading || releaseReportSnapshotCompareQuery.isFetching}
        detail={selectedReportSnapshotQuery.data ?? null}
        error={releaseReportQuery.isError ? '渠道发布复盘报告加载失败。' : null}
        isArchiving={createReleaseReportSnapshotMutation.isPending}
        loading={releaseReportQuery.isLoading}
        onArchive={() => {
          if (!selectedChannel) return;
          createReleaseReportSnapshotMutation.mutate(selectedChannel.id);
        }}
        onRefresh={() => void releaseReportQuery.refetch()}
        onSelectBaseSnapshot={setBaseSnapshotId}
        onSelectSnapshot={setSelectedSnapshotId}
        onSelectTargetSnapshot={setTargetSnapshotId}
        report={releaseReportQuery.data ?? null}
        snapshotError={releaseReportSnapshotsQuery.isError ? '报告快照列表加载失败。' : selectedReportSnapshotQuery.isError ? '报告快照详情加载失败。' : null}
        snapshots={releaseReportSnapshotsQuery.data ?? null}
        snapshotsLoading={releaseReportSnapshotsQuery.isLoading || selectedReportSnapshotQuery.isLoading}
        selectedSnapshotId={selectedSnapshotId}
        targetSnapshotId={targetSnapshotId}
      />
    </main>
  );
}

function useAuthPermissions() {
  const { currentUser } = useAuth();
  const roles = currentUser?.user.roles ?? [];
  const permissions = currentUser?.user.permissions ?? [];
  const isTenantAdmin = roles.some((role) => role.code === 'tenant_admin');

  return {
    currentUser,
    canView: isTenantAdmin || hasPermission(permissions, 'channel:publish:view'),
    canManage: isTenantAdmin || hasPermission(permissions, 'channel:publish:manage'),
    canDeploy: isTenantAdmin || hasPermission(permissions, 'channel:publish:deploy'),
    canDisable: isTenantAdmin || hasPermission(permissions, 'channel:publish:disable'),
  };
}

function ChannelDetailPanel({
  canDeploy,
  canDisable,
  canManage,
  channel,
  isActing,
  onAction,
  onEdit,
}: {
  canDeploy: boolean;
  canDisable: boolean;
  canManage: boolean;
  channel: PublishChannelListItem | null;
  isActing: boolean;
  onAction: (channelId: string, action: ActionKind) => void;
  onEdit: (channel: PublishChannelListItem) => void;
}) {
  if (!channel) {
    return (
      <Card>
        <EmptyState
          description="创建发布渠道后，可以查看入口地址、回调、健康检查、脱敏密钥和配置 JSON。"
          title="请选择发布渠道"
        />
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="border-b p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <RadioTower className="size-4 text-blue-600" />
              <h2 className="truncate text-sm font-semibold">{channel.name}</h2>
            </div>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {channel.description || '该渠道暂无描述。'}
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap justify-end gap-2">
            <Button disabled={!canManage} onClick={() => onEdit(channel)} size="sm" type="button" variant="outline">
              <Edit className="size-4" />
              编辑
            </Button>
            <Button
              disabled={!canDeploy || channel.status === 'ACTIVE' || isActing}
              onClick={() => onAction(channel.id, 'enable')}
              size="sm"
              type="button"
              variant="outline"
            >
              <Power className="size-4" />
              启用
            </Button>
            <Button
              disabled={!canDisable || channel.status === 'DISABLED' || isActing}
              onClick={() => onAction(channel.id, 'disable')}
              size="sm"
              type="button"
              variant="outline"
            >
              <PowerOff className="size-4" />
              停用
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 p-4">
        <div className="flex flex-wrap gap-2">
          <StatusBadge tone="ready">{publishChannelTypeLabel(channel.channel)}</StatusBadge>
          <StatusBadge tone={publishChannelStatusTone(channel.status)}>
            {publishChannelStatusLabel(channel.status)}
          </StatusBadge>
          <StatusBadge tone={publishChannelHealthTone(channel.health_status)}>
            {publishChannelHealthLabel(channel.health_status)}
          </StatusBadge>
        </div>

        <div className="grid gap-3 text-sm">
          <InfoRow label="关联 Agent" value={`${channel.agent?.name ?? '未知 Agent'} / ${channel.agent?.code ?? '-'}`} />
          <InfoRow label="渠道调用地址" value={getExternalChannelChatEndpoint(channel.id)} />
          <InfoRow label="渠道流式地址" value={getExternalChannelStreamEndpoint(channel.id)} />
          <InfoRow label="平台回调地址" value={getExternalChannelCallbackEndpoint(channel.id)} />
          <InfoRow label="入口地址" value={channel.endpoint_url ?? '未配置'} />
          <InfoRow label="回调地址" value={channel.callback_url ?? '未配置'} />
          <InfoRow label="脱敏密钥" value={channel.secret_masked ?? '未配置'} />
          <InfoRow label="最近发布" value={formatChannelDateTime(channel.last_published_at)} />
          <InfoRow label="最近检查" value={formatChannelDateTime(channel.last_checked_at)} />
          <InfoRow label="最近请求" value={formatChannelDateTime(channel.last_request_at)} />
        </div>

        <div className="rounded-md border bg-slate-50/70 p-3 text-sm">
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="font-medium">健康检查</span>
            <Button
              disabled={isActing}
              onClick={() => onAction(channel.id, 'check')}
              size="sm"
              type="button"
              variant="outline"
            >
              <ClipboardCheck className="size-4" />
              检查
            </Button>
          </div>
          <p className="leading-6 text-muted-foreground">{channel.health_message ?? '尚未产生健康检查信息。'}</p>
        </div>

        <ChannelCallbackAdapterPanel channel={channel} />

        <div className="grid grid-cols-2 gap-3">
          <MiniMetric label="24h 请求" value={formatNumber(channel.request_count_24h)} />
          <MiniMetric label="24h 成功率" value={`${channel.success_rate_24h}%`} />
        </div>

        <div className="rounded-md border bg-slate-950 p-3 text-xs text-slate-100">
          <div className="mb-2 text-slate-300">渠道配置 JSON</div>
          <pre className="max-h-52 overflow-auto whitespace-pre-wrap break-words">
            {stringifyJson(channel.config, '{}')}
          </pre>
        </div>
      </div>
    </Card>
  );
}

function ChannelCallbackAdapterPanel({ channel }: { channel: PublishChannelListItem }) {
  const adapter = getCallbackAdapterInfo(channel);

  return (
    <div className="rounded-md border bg-white/80 p-3 text-sm shadow-sm shadow-slate-200/50">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 font-medium">
            <GitBranch className="size-4 text-blue-600" />
            企业 IM 回调适配
          </div>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">{adapter.description}</p>
        </div>
        <StatusBadge tone={adapter.supported ? (channel.status === 'ACTIVE' ? 'healthy' : 'planned') : 'mock'}>
          {adapter.statusLabel}
        </StatusBadge>
      </div>

      <div className="grid gap-2">
        <InfoRow label="统一回调入口" value={getExternalChannelCallbackEndpoint(channel.id)} />
        <div className="grid gap-2 md:grid-cols-2">
          <MiniMetric label="消息解析" value={adapter.parserLabel} />
          <MiniMetric label="签名状态" value={adapter.signatureLabel} />
        </div>
        <div className="grid gap-2 md:grid-cols-2">
          <MiniMetric label="主动回复" value={adapter.senderLabel} />
          <MiniMetric label="回复模式" value={adapter.replyModeLabel} />
        </div>
        <div className="rounded-md border bg-slate-50/80 p-3 text-xs leading-5 text-muted-foreground">
          入站消息会标准化为统一文本消息，然后转交当前渠道绑定的 Agent 执行；同步模式会按平台格式直接返回，异步模式会快速 ACK 并由 Channel Sender 主动发送结果。
        </div>
      </div>
    </div>
  );
}

function ChannelFormPanel({
  agents,
  canEditIdentity,
  error,
  isSaving,
  onCancel,
  onChange,
  onSubmit,
  values,
}: {
  agents: AgentListItem[];
  canEditIdentity: boolean;
  error: string | null;
  isSaving: boolean;
  onCancel: () => void;
  onChange: (values: ChannelFormValues) => void;
  onSubmit: () => void;
  values: ChannelFormValues;
}) {
  const update = <K extends keyof ChannelFormValues>(key: K, value: ChannelFormValues[K]) => {
    onChange({ ...values, [key]: value });
  };

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b p-4">
        <div>
          <h2 className="text-sm font-semibold">{values.id ? '编辑发布渠道' : '新建发布渠道'}</h2>
          <p className="mt-1 text-sm text-muted-foreground">渠道配置保存后会写入控制面，并接受数据权限与资源授权校验。</p>
        </div>
        <Button onClick={onCancel} size="icon" type="button" variant="ghost">
          <X className="size-4" />
        </Button>
      </div>

      <div className="grid gap-4 p-4">
        {error ? (
          <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        <label className="grid gap-1.5 text-sm">
          <span className="font-medium">关联 Agent</span>
          <select
            className="h-10 rounded-md border bg-background/80 px-3 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring disabled:bg-muted disabled:opacity-70"
            disabled={!canEditIdentity}
            onChange={(event) => update('agent_id', event.target.value)}
            value={values.agent_id}
          >
            <option value="">请选择已发布 Agent</option>
            {agents.map((agent) => (
              <option key={agent.id} value={agent.id}>
                {agent.name} / {agent.code}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-1.5 text-sm">
          <span className="font-medium">渠道类型</span>
          <select
            className="h-10 rounded-md border bg-background/80 px-3 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring disabled:bg-muted disabled:opacity-70"
            disabled={!canEditIdentity}
            onChange={(event) => update('channel', event.target.value as PublishChannelType)}
            value={values.channel}
          >
            {publishChannelTypes.map((type) => (
              <option key={type} value={type}>
                {publishChannelTypeLabel(type)}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-1.5 text-sm">
          <span className="font-medium">渠道名称</span>
          <Input onChange={(event) => update('name', event.target.value)} placeholder="例如：官网 Web 组件" value={values.name} />
        </label>

        <label className="grid gap-1.5 text-sm">
          <span className="font-medium">描述</span>
          <textarea
            className="min-h-20 rounded-md border bg-background/80 px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
            onChange={(event) => update('description', event.target.value)}
            placeholder="说明渠道用途、接入系统或审批边界"
            value={values.description}
          />
        </label>

        <label className="grid gap-1.5 text-sm">
          <span className="font-medium">入口地址</span>
          <Input onChange={(event) => update('endpoint_url', event.target.value)} placeholder="https://example.com/agent" value={values.endpoint_url} />
        </label>

        <label className="grid gap-1.5 text-sm">
          <span className="font-medium">回调地址</span>
          <Input onChange={(event) => update('callback_url', event.target.value)} placeholder="https://example.com/webhook" value={values.callback_url} />
        </label>

        <label className="grid gap-1.5 text-sm">
          <span className="font-medium">渠道密钥</span>
          <Input
            onChange={(event) => update('secret', event.target.value)}
            placeholder={values.id ? '留空表示不更新密钥' : '用于渠道回调或签名校验'}
            type="password"
            value={values.secret}
          />
        </label>

        <label className="grid gap-1.5 text-sm">
          <span className="font-medium">发布状态</span>
          <select
            className="h-10 rounded-md border bg-background/80 px-3 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring"
            onChange={(event) => update('status', event.target.value as PublishChannelStatus)}
            value={values.status}
          >
            {publishChannelStatuses.map((status) => (
              <option key={status} value={status}>
                {publishChannelStatusLabel(status)}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-1.5 text-sm">
          <span className="font-medium">配置 JSON</span>
          <textarea
            className="min-h-36 rounded-md border bg-slate-950 px-3 py-2 font-mono text-xs text-slate-100 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring"
            onChange={(event) => update('config_text', event.target.value)}
            spellCheck={false}
            value={values.config_text}
          />
        </label>

        <div className="flex flex-wrap justify-end gap-2">
          <Button onClick={onCancel} type="button" variant="outline">
            取消
          </Button>
          <Button disabled={isSaving} onClick={onSubmit} type="button">
            <CheckCircle2 className="size-4" />
            保存渠道
          </Button>
        </div>
      </div>
    </Card>
  );
}

function SenderPolicyPanel({
  canManage,
  channel,
  error,
  isSaving,
  loading,
  onRefresh,
  onSave,
  policy,
}: {
  canManage: boolean;
  channel: PublishChannelListItem | null;
  error: string | null;
  isSaving: boolean;
  loading: boolean;
  onRefresh: () => void;
  onSave: (input: UpdateChannelSenderPolicyInput) => void;
  policy: ChannelSenderPolicy | null;
}) {
  const [draft, setDraft] = useState<SenderPolicyFormState>(() => policyToFormState(policy ?? defaultSenderPolicy()));
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    setDraft(policyToFormState(policy ?? defaultSenderPolicy()));
    setValidationError(null);
  }, [channel?.id, policy]);

  const metrics = [
    {
      label: '手动重试',
      value: draft.manual_retry_enabled ? '允许' : '关闭',
      helper: draft.manual_retry_enabled ? '控制台可重试失败投递' : '失败投递只能查看，不可手动重试',
    },
    {
      label: '最大重试',
      value: `${draft.max_retry_count} 次`,
      helper: draft.max_retry_count === 0 ? '禁止重试' : `达到 ${draft.max_retry_count} 次后拦截`,
    },
    {
      label: '退避时间',
      value: `${draft.retry_backoff_seconds}s`,
      helper: draft.auto_retry_enabled ? '后续自动任务使用' : '当前仅保存策略',
    },
    {
      label: '记录保留',
      value: `${draft.retention_days} 天`,
      helper: '用于后续清理任务边界',
    },
  ];

  function update<K extends keyof SenderPolicyFormState>(key: K, value: SenderPolicyFormState[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
    setValidationError(null);
  }

  function handleSave() {
    const parsed = parseStatusCodes(draft.retry_on_statuses_text);
    if (!parsed.ok) {
      setValidationError(parsed.message);
      return;
    }

    onSave({
      auto_retry_enabled: draft.auto_retry_enabled,
      manual_retry_enabled: draft.manual_retry_enabled,
      max_retry_count: clampNumber(draft.max_retry_count, 0, 10),
      retry_backoff_seconds: clampNumber(draft.retry_backoff_seconds, 1, 3600),
      retry_on_statuses: parsed.value,
      alert_on_failure: draft.alert_on_failure,
      retention_days: clampNumber(draft.retention_days, 1, 365),
    });
  }

  return (
    <section className="grid gap-4">
      <Card className="overflow-hidden border-slate-200/80 bg-white/85 shadow-sm backdrop-blur">
        <div className="border-b p-4">
          <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge tone="ready">M63-10</StatusBadge>
                <StatusBadge tone="healthy">投递策略中心</StatusBadge>
                {policy?.updated_at ? <StatusBadge tone="loading">更新 {formatChannelDateTime(policy.updated_at)}</StatusBadge> : null}
              </div>
              <h2 className="mt-3 text-base font-semibold">渠道投递策略</h2>
              <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">
                为当前发布渠道配置主动回复投递的重试边界、失败告警和记录保留策略；手动重试会在后端按策略实时拦截。
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button disabled={loading || !channel} onClick={onRefresh} type="button" variant="outline">
                <RefreshCw className={cn('size-4', loading && 'animate-spin')} />
                刷新策略
              </Button>
              <Button disabled={!canManage || !channel || loading || isSaving} onClick={handleSave} type="button">
                <Save className={cn('size-4', isSaving && 'animate-pulse')} />
                保存策略
              </Button>
            </div>
          </div>
        </div>

        <div className="grid gap-4 p-4">
          {!channel ? (
            <EmptyState description="请选择一个发布渠道后配置投递策略。" title="未选择渠道" />
          ) : (
            <>
              {error || validationError ? (
                <div className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                  {validationError ?? error}
                </div>
              ) : null}

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {loading
                  ? Array.from({ length: 4 }).map((_, index) => <div className="h-24 rounded-md border bg-slate-50" key={index} />)
                  : metrics.map((metric) => (
                      <MetricCard helper={metric.helper} key={metric.label} label={metric.label} value={metric.value} />
                    ))}
              </div>

              <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
                <Card className="border-slate-200/80 p-4">
                  <div className="mb-4">
                    <h3 className="text-sm font-semibold">策略开关</h3>
                    <p className="mt-1 text-sm text-muted-foreground">控制失败投递是否可以自动或手动进入重试链路。</p>
                  </div>
                  <div className="grid gap-3">
                    <PolicyToggle
                      checked={draft.auto_retry_enabled}
                      disabled={!canManage || loading}
                      helper="第一版仅保存自动重试策略，后台调度会在后续工作流模块接入。"
                      label="自动重试"
                      onChange={(value) => update('auto_retry_enabled', value)}
                    />
                    <PolicyToggle
                      checked={draft.manual_retry_enabled}
                      disabled={!canManage || loading}
                      helper="关闭后，投递中心里的失败记录不能通过控制台手动重试。"
                      label="允许手动重试"
                      onChange={(value) => update('manual_retry_enabled', value)}
                    />
                    <PolicyToggle
                      checked={draft.alert_on_failure}
                      disabled={!canManage || loading}
                      helper="失败投递继续写入平台事件，后续告警通道按此策略过滤。"
                      label="失败告警"
                      onChange={(value) => update('alert_on_failure', value)}
                    />
                  </div>
                </Card>

                <Card className="border-slate-200/80 p-4">
                  <div className="mb-4">
                    <h3 className="text-sm font-semibold">重试与保留边界</h3>
                    <p className="mt-1 text-sm text-muted-foreground">数值会在保存时归一化，并由后端重试接口再次校验。</p>
                  </div>
                  <div className="grid gap-4 md:grid-cols-3">
                    <NumberField
                      disabled={!canManage || loading}
                      label="最大重试次数"
                      max={10}
                      min={0}
                      onChange={(value) => update('max_retry_count', value)}
                      suffix="次"
                      value={draft.max_retry_count}
                    />
                    <NumberField
                      disabled={!canManage || loading}
                      label="退避秒数"
                      max={3600}
                      min={1}
                      onChange={(value) => update('retry_backoff_seconds', value)}
                      suffix="秒"
                      value={draft.retry_backoff_seconds}
                    />
                    <NumberField
                      disabled={!canManage || loading}
                      label="记录保留"
                      max={365}
                      min={1}
                      onChange={(value) => update('retention_days', value)}
                      suffix="天"
                      value={draft.retention_days}
                    />
                  </div>

                  <label className="mt-4 grid gap-1.5 text-sm">
                    <span className="font-medium">允许重试的响应码</span>
                    <Input
                      disabled={!canManage || loading}
                      onChange={(event) => update('retry_on_statuses_text', event.target.value)}
                      placeholder="408,429,500,502,503,504"
                      value={draft.retry_on_statuses_text}
                    />
                    <span className="text-xs leading-5 text-muted-foreground">
                      使用英文逗号分隔，范围 400-599；如果失败记录有响应码且不在列表中，后端会拒绝重试。
                    </span>
                  </label>
                </Card>
              </div>

              {!canManage ? (
                <div className="rounded-md border bg-slate-50/80 px-4 py-3 text-sm text-muted-foreground">
                  当前账号缺少 channel:publish:manage 权限，只能查看策略，不能保存修改。
                </div>
              ) : null}
            </>
          )}
        </div>
      </Card>
    </section>
  );
}

function PublishControlPanel({
  canApprove,
  canManage,
  canReject,
  channel,
  control,
  error,
  isMutating,
  loading,
  onApprovalAction,
  onRefresh,
  onSave,
  onUpdateRollout,
}: {
  canApprove: boolean;
  canManage: boolean;
  canReject: boolean;
  channel: PublishChannelListItem | null;
  control: ChannelPublishControl | null;
  error: string | null;
  isMutating: boolean;
  loading: boolean;
  onApprovalAction: (action: 'request' | 'approve' | 'reject' | 'rollback', input: ChannelPublishApprovalInput) => void;
  onRefresh: () => void;
  onSave: (input: UpdateChannelPublishControlInput) => void;
  onUpdateRollout: (input: ChannelPublishRolloutInput) => void;
}) {
  const [approvalRequired, setApprovalRequired] = useState(false);
  const [approvalNote, setApprovalNote] = useState('');
  const [decisionNote, setDecisionNote] = useState('');
  const [rolloutEnabled, setRolloutEnabled] = useState(false);
  const [rolloutPercentage, setRolloutPercentage] = useState(0);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    setApprovalRequired(control?.approval_required ?? false);
    setApprovalNote(control?.approval_note ?? '');
    setDecisionNote('');
    setRolloutEnabled(control?.rollout_enabled ?? false);
    setRolloutPercentage(control?.rollout_percentage ?? 0);
    setValidationError(null);
  }, [channel?.id, control]);

  const canChangeRollout = Boolean(control && (!control.approval_required || control.approval_status === 'APPROVED'));
  const pendingApproval = control?.approval_status === 'PENDING';
  const approvalMetrics = [
    {
      helper: control?.approval_required ? '发布必须经过审批' : '当前允许直接发布',
      label: '审批策略',
      value: control?.approval_required ? '需要审批' : '免审批',
    },
    {
      helper: control?.requested_at ? `发起 ${formatChannelDateTime(control.requested_at)}` : '暂无审批请求',
      label: '审批状态',
      value: control ? publishApprovalStatusLabel(control.approval_status) : '-',
    },
    {
      helper: control?.rollout_enabled ? '流量按比例开放' : '灰度入口关闭',
      label: '灰度比例',
      value: control ? `${control.rollout_percentage}%` : '-',
    },
    {
      helper: control?.last_rollback_at ? `最近 ${formatChannelDateTime(control.last_rollback_at)}` : '尚未执行回滚',
      label: '回滚状态',
      value: control?.rollback_available ? '可回滚' : '无稳定点',
    },
  ];

  function handleSaveControl() {
    onSave({
      approval_required: approvalRequired,
      approval_note: toNullable(approvalNote),
    });
  }

  function handleApprovalAction(action: 'request' | 'approve' | 'reject' | 'rollback') {
    if (action === 'request' && !approvalRequired) {
      setValidationError('开启发布审批后才能发起审批。');
      return;
    }
    setValidationError(null);
    onApprovalAction(action, {
      note: toNullable(action === 'request' ? approvalNote : decisionNote),
    });
  }

  function handleRolloutSave(nextEnabled = rolloutEnabled, nextPercentage = rolloutPercentage) {
    const percentage = clampNumber(nextPercentage, 0, 100);
    setRolloutEnabled(nextEnabled);
    setRolloutPercentage(nextEnabled ? percentage : 0);
    onUpdateRollout({
      rollout_enabled: nextEnabled,
      rollout_percentage: nextEnabled ? percentage : 0,
    });
  }

  return (
    <section className="grid gap-4">
      <Card className="overflow-hidden border-slate-200/80 bg-white/85 shadow-sm backdrop-blur">
        <div className="border-b p-4">
          <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge tone="ready">M63-12</StatusBadge>
                <StatusBadge tone={control ? publishApprovalStatusTone(control.approval_status) : 'planned'}>
                  {control ? publishApprovalStatusLabel(control.approval_status) : '未加载'}
                </StatusBadge>
                <StatusBadge tone={control ? publishRolloutStatusTone(control.rollout_status) : 'planned'}>
                  {control ? publishRolloutStatusLabel(control.rollout_status) : '灰度未知'}
                </StatusBadge>
                {control?.updated_at ? <StatusBadge tone="loading">更新 {formatChannelDateTime(control.updated_at)}</StatusBadge> : null}
              </div>
              <h2 className="mt-3 text-base font-semibold">渠道发布审批与灰度发布</h2>
              <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">
                为当前发布渠道配置审批门禁、灰度比例和稳定配置回滚点；所有动作都会写入平台事件，后续可接入审批中心与发布流水线。
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button disabled={loading || !channel} onClick={onRefresh} type="button" variant="outline">
                <RefreshCw className={cn('size-4', loading && 'animate-spin')} />
                刷新控制
              </Button>
              <Button disabled={!canManage || !channel || loading || isMutating} onClick={handleSaveControl} type="button">
                <Save className={cn('size-4', isMutating && 'animate-pulse')} />
                保存控制
              </Button>
            </div>
          </div>
        </div>

        <div className="grid gap-4 p-4">
          {!channel ? (
            <EmptyState description="请选择一个发布渠道后配置审批、灰度和回滚策略。" title="未选择渠道" />
          ) : (
            <>
              {error || validationError ? (
                <div className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                  {validationError ?? error}
                </div>
              ) : null}

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {loading
                  ? Array.from({ length: 4 }).map((_, index) => <div className="h-24 rounded-md border bg-slate-50" key={index} />)
                  : approvalMetrics.map((metric) => (
                      <MetricCard helper={metric.helper} key={metric.label} label={metric.label} value={metric.value} />
                    ))}
              </div>

              <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
                <Card className="border-slate-200/80 p-4">
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold">发布审批</h3>
                      <p className="mt-1 text-sm text-muted-foreground">开启后，渠道进入正式发布前需要先发起审批并通过。</p>
                    </div>
                    <ClipboardCheck className="size-4 text-blue-600" />
                  </div>
                  <div className="grid gap-3">
                    <PolicyToggle
                      checked={approvalRequired}
                      disabled={!canManage || loading}
                      helper="关闭审批时，渠道发布控制会回到免审批状态。"
                      label="启用发布审批"
                      onChange={(value) => {
                        setApprovalRequired(value);
                        setValidationError(null);
                      }}
                    />
                    <label className="grid gap-1.5 text-sm">
                      <span className="font-medium">审批说明</span>
                      <textarea
                        className="min-h-24 rounded-md border bg-background/80 px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:bg-muted disabled:opacity-70"
                        disabled={!canManage || loading}
                        onChange={(event) => {
                          setApprovalNote(event.target.value);
                          setValidationError(null);
                        }}
                        placeholder="说明发布范围、接入渠道、影响用户和回滚预案"
                        value={approvalNote}
                      />
                    </label>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        disabled={!canManage || !approvalRequired || loading || isMutating}
                        onClick={() => handleApprovalAction('request')}
                        type="button"
                        variant="outline"
                      >
                        <ClipboardCheck className="size-4" />
                        发起审批
                      </Button>
                      <Button
                        disabled={!canApprove || !pendingApproval || loading || isMutating}
                        onClick={() => handleApprovalAction('approve')}
                        type="button"
                        variant="outline"
                      >
                        <CheckCircle2 className="size-4" />
                        通过
                      </Button>
                      <Button
                        disabled={!canReject || !pendingApproval || loading || isMutating}
                        onClick={() => handleApprovalAction('reject')}
                        type="button"
                        variant="outline"
                      >
                        <X className="size-4" />
                        拒绝
                      </Button>
                    </div>
                  </div>
                </Card>

                <Card className="border-slate-200/80 p-4">
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold">灰度发布</h3>
                      <p className="mt-1 text-sm text-muted-foreground">审批通过后按比例开放渠道流量，比例为 100% 时视为全量发布。</p>
                    </div>
                    <Gauge className="size-4 text-blue-600" />
                  </div>
                  <div className="grid gap-4">
                    <PolicyToggle
                      checked={rolloutEnabled}
                      disabled={!canManage || !canChangeRollout || loading}
                      helper={canChangeRollout ? '关闭后灰度比例会保存为 0%。' : '当前审批未通过，不能调整灰度。'}
                      label="启用灰度"
                      onChange={(value) => {
                        setRolloutEnabled(value);
                        if (!value) setRolloutPercentage(0);
                      }}
                    />
                    <NumberField
                      disabled={!canManage || !canChangeRollout || !rolloutEnabled || loading}
                      label="灰度比例"
                      max={100}
                      min={0}
                      onChange={setRolloutPercentage}
                      suffix="%"
                      value={rolloutPercentage}
                    />
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-blue-500 transition-all"
                        style={{ width: `${rolloutEnabled ? clampNumber(rolloutPercentage, 0, 100) : 0}%` }}
                      />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        disabled={!canManage || !canChangeRollout || loading || isMutating}
                        onClick={() => handleRolloutSave()}
                        type="button"
                        variant="outline"
                      >
                        <Save className="size-4" />
                        保存灰度
                      </Button>
                      <Button
                        disabled={!canManage || !canChangeRollout || loading || isMutating}
                        onClick={() => handleRolloutSave(true, 100)}
                        type="button"
                        variant="outline"
                      >
                        <RadioTower className="size-4" />
                        全量发布
                      </Button>
                      <Button
                        disabled={!canManage || !control?.rollout_enabled || loading || isMutating}
                        onClick={() => handleRolloutSave(false, 0)}
                        type="button"
                        variant="outline"
                      >
                        <PowerOff className="size-4" />
                        关闭灰度
                      </Button>
                    </div>
                  </div>
                </Card>
              </div>

              <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
                <Card className="border-slate-200/80 p-4">
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold">审批记录</h3>
                      <p className="mt-1 text-sm text-muted-foreground">记录最近一次审批请求、审批人和决策说明。</p>
                    </div>
                    <ListRestart className="size-4 text-blue-600" />
                  </div>
                  <div className="grid gap-3 text-sm">
                    <InfoRow label="发起人" value={control?.requested_by ?? '无'} />
                    <InfoRow label="发起时间" value={formatChannelDateTime(control?.requested_at ?? null)} />
                    <InfoRow label="审批人" value={control?.reviewed_by ?? '无'} />
                    <InfoRow label="审批时间" value={formatChannelDateTime(control?.reviewed_at ?? null)} />
                    <InfoRow label="决策说明" value={control?.decision_note ?? '无'} />
                  </div>
                </Card>

                <Card className="border-slate-200/80 p-4">
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold">稳定版本与回滚</h3>
                      <p className="mt-1 text-sm text-muted-foreground">审批发起、审批通过或灰度变更时会记录最近稳定配置。</p>
                    </div>
                    <Reply className="size-4 text-blue-600" />
                  </div>
                  <div className="grid gap-4">
                    <div className="grid gap-3 text-sm md:grid-cols-2">
                      <InfoRow
                        label="稳定状态"
                        value={control?.last_stable_status ? publishChannelStatusLabel(control.last_stable_status) : '未记录'}
                      />
                      <InfoRow label="最近回滚" value={formatChannelDateTime(control?.last_rollback_at ?? null)} />
                    </div>
                    <label className="grid gap-1.5 text-sm">
                      <span className="font-medium">决策或回滚说明</span>
                      <textarea
                        className="min-h-20 rounded-md border bg-background/80 px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:bg-muted disabled:opacity-70"
                        disabled={loading || isMutating}
                        onChange={(event) => setDecisionNote(event.target.value)}
                        placeholder="填写审批通过、拒绝或回滚原因"
                        value={decisionNote}
                      />
                    </label>
                    <Button
                      disabled={!canManage || !control?.rollback_available || loading || isMutating}
                      onClick={() => handleApprovalAction('rollback')}
                      type="button"
                      variant="outline"
                    >
                      <RotateCcw className={cn('size-4', isMutating && 'animate-spin')} />
                      回滚到稳定配置
                    </Button>
                  </div>
                </Card>
              </div>

              {!canManage ? (
                <div className="rounded-md border bg-slate-50/80 px-4 py-3 text-sm text-muted-foreground">
                  当前账号缺少 channel:publish:manage 权限，只能查看发布控制，不能发起审批、调整灰度或回滚。
                </div>
              ) : null}
            </>
          )}
        </div>
      </Card>
    </section>
  );
}

function RolloutGatePanel({
  channel,
  error,
  loading,
  onRefresh,
  overview,
}: {
  channel: PublishChannelListItem | null;
  error: string | null;
  loading: boolean;
  onRefresh: () => void;
  overview: ChannelRolloutGateOverview | null;
}) {
  const metrics = [
    {
      helper: overview ? `执行状态：${channelRolloutGateStatusLabel(overview.status)}` : '等待选择渠道',
      label: '门控状态',
      value: overview ? channelRolloutGateStatusLabel(overview.status) : '-',
    },
    {
      helper: overview?.rollout_enabled ? '按稳定桶位判断放行' : '灰度关闭时全部放行',
      label: '配置比例',
      value: overview ? `${overview.rollout_percentage}%` : '-',
    },
    {
      helper: `放行 ${formatNumber(overview?.allowed_count_24h ?? 0)}，拦截 ${formatNumber(overview?.blocked_count_24h ?? 0)}`,
      label: '24h 评估',
      value: formatNumber(overview?.evaluated_count_24h ?? 0),
    },
    {
      helper: `免灰度放行 ${formatNumber(overview?.bypass_count_24h ?? 0)} 次`,
      label: '实测放行率',
      value: overview ? `${overview.allowed_rate_24h}%` : '-',
    },
  ];
  const configured = overview?.rollout_percentage ?? 0;
  const observed = overview?.allowed_rate_24h ?? 0;

  return (
    <section className="grid gap-4">
      <Card className="overflow-hidden border-slate-200/80 bg-white/85 shadow-sm backdrop-blur">
        <div className="border-b p-4">
          <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge tone="ready">M63-13</StatusBadge>
                <StatusBadge tone={overview ? channelRolloutGateStatusTone(overview.status) : 'planned'}>
                  {overview ? channelRolloutGateStatusLabel(overview.status) : '未加载'}
                </StatusBadge>
                {overview?.last_decision ? (
                  <StatusBadge tone={overview.last_decision.allowed ? 'healthy' : 'unavailable'}>
                    最近{overview.last_decision.allowed ? '放行' : '拦截'}
                  </StatusBadge>
                ) : null}
                {overview?.generated_at ? <StatusBadge tone="loading">生成 {formatChannelDateTime(overview.generated_at)}</StatusBadge> : null}
              </div>
              <h2 className="mt-3 text-base font-semibold">渠道灰度执行闭环</h2>
              <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">
                外部 API、流式调用、会话续聊和企业 IM 回调都会经过同一套灰度门控；这里展示最近 24 小时放行、拦截和稳定桶位决策。
              </p>
            </div>
            <Button disabled={loading || !channel} onClick={onRefresh} type="button" variant="outline">
              <RefreshCw className={cn('size-4', loading && 'animate-spin')} />
              刷新门控
            </Button>
          </div>
        </div>

        <div className="grid gap-4 p-4">
          {!channel ? (
            <EmptyState description="请选择一个发布渠道后查看灰度门控执行结果。" title="未选择渠道" />
          ) : (
            <>
              {error ? (
                <div className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                  {error}
                </div>
              ) : null}

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {loading
                  ? Array.from({ length: 4 }).map((_, index) => <div className="h-24 rounded-md border bg-slate-50" key={index} />)
                  : metrics.map((metric) => (
                      <MetricCard helper={metric.helper} key={metric.label} label={metric.label} value={metric.value} />
                    ))}
              </div>

              <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
                <Card className="border-slate-200/80 p-4">
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold">最近门控决策</h3>
                      <p className="mt-1 text-sm text-muted-foreground">稳定桶位会根据渠道和外部会话标识计算，保证同一来源尽量落入同一灰度组。</p>
                    </div>
                    <Gauge className="size-4 text-blue-600" />
                  </div>
                  {overview?.last_decision ? (
                    <div className="grid gap-3 text-sm">
                      <InfoRow label="决策结果" value={overview.last_decision.allowed ? '放行' : '拦截'} />
                      <InfoRow label="决策原因" value={channelRolloutDecisionReasonLabel(overview.last_decision.reason)} />
                      <InfoRow label="稳定桶位" value={overview.last_decision.bucket === null ? '未计算' : `${overview.last_decision.bucket}`} />
                      <InfoRow label="调用来源" value={channelRolloutSourceLabel(overview.last_decision.source)} />
                      <InfoRow label="评估时间" value={formatChannelDateTime(overview.last_decision.evaluated_at)} />
                      <InfoRow label="Trace" value={overview.last_decision.trace_id ?? '无'} />
                    </div>
                  ) : (
                    <EmptyState
                      className="rounded-md border bg-slate-50/60 p-6"
                      description="渠道产生一次外部调用或回调后，这里会展示最近一次门控决策。"
                      title="暂无门控决策"
                    />
                  )}
                </Card>

                <Card className="border-slate-200/80 p-4">
                  <div className="mb-4">
                    <h3 className="text-sm font-semibold">配置比例与实测放行率</h3>
                    <p className="mt-1 text-sm text-muted-foreground">灰度样本少时实测比例会有波动，样本增长后会逐步接近配置比例。</p>
                  </div>
                  <div className="grid gap-4">
                    <RolloutProgress label="配置灰度比例" tone="bg-blue-500" value={configured} />
                    <RolloutProgress label="24h 实测放行率" tone="bg-emerald-500" value={observed} />
                    <div className="grid gap-3 rounded-md border bg-slate-50/70 p-3 text-sm md:grid-cols-2">
                      <DetailRow label="灰度状态" value={overview ? publishRolloutStatusLabel(overview.rollout_status) : '-'} />
                      <DetailRow label="放行请求" value={formatNumber(overview?.allowed_count_24h ?? 0)} />
                      <DetailRow label="拦截请求" value={formatNumber(overview?.blocked_count_24h ?? 0)} />
                      <DetailRow label="免灰度" value={formatNumber(overview?.bypass_count_24h ?? 0)} />
                    </div>
                    <div className="rounded-md border bg-blue-50/70 px-4 py-3 text-sm leading-6 text-blue-700">
                      灰度关闭表示渠道仍可正常服务，但不会按比例拦截；灰度开启且小于 100% 时，未命中稳定桶位的外部调用会被门控拦截。
                    </div>
                  </div>
                </Card>
              </div>
            </>
          )}
        </div>
      </Card>
    </section>
  );
}

function ReleasePipelinePanel({
  canAbort,
  canDeploy,
  canManage,
  channel,
  error,
  isMutating,
  loading,
  onAction,
  onRefresh,
  pipeline,
}: {
  canAbort: boolean;
  canDeploy: boolean;
  canManage: boolean;
  channel: PublishChannelListItem | null;
  error: string | null;
  isMutating: boolean;
  loading: boolean;
  onAction: (action: 'start' | 'full' | 'abort', input: ChannelReleaseBatchInput) => void;
  onRefresh: () => void;
  pipeline: ChannelReleasePipeline | null;
}) {
  const [title, setTitle] = useState('');
  const [targetPercentage, setTargetPercentage] = useState(30);
  const [note, setNote] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    setTitle('');
    setTargetPercentage(pipeline?.current_batch?.target_rollout_percentage ?? 30);
    setNote('');
    setValidationError(null);
  }, [channel?.id, pipeline?.current_batch?.batch_id, pipeline?.current_batch?.target_rollout_percentage]);

  const currentBatch = pipeline?.current_batch ?? null;
  const hasOpenBatch = Boolean(currentBatch && !isReleaseBatchClosedClient(currentBatch.status));
  const metrics = [
    {
      helper: currentBatch ? currentBatch.batch_id : '尚未创建发布批次',
      label: '当前批次',
      value: currentBatch ? channelReleaseBatchStatusLabel(currentBatch.status) : '空闲',
    },
    {
      helper: currentBatch?.title ?? '创建批次后显示目标',
      label: '目标灰度',
      value: currentBatch ? `${currentBatch.target_rollout_percentage}%` : '-',
    },
    {
      helper: `最近保留 ${pipeline?.recent_batches.length ?? 0} 个批次`,
      label: '最近批次',
      value: `${pipeline?.recent_batches.length ?? 0}`,
    },
    {
      helper: pipeline?.updated_at ? `更新 ${formatChannelDateTime(pipeline.updated_at)}` : '等待数据',
      label: '流水线事件',
      value: `${pipeline?.recent_events.length ?? 0}`,
    },
  ];

  function submitStart() {
    if (!title.trim()) {
      setValidationError('发布批次标题不能为空。');
      return;
    }
    setValidationError(null);
    onAction('start', {
      title: title.trim(),
      target_rollout_percentage: clampNumber(targetPercentage, 0, 100),
      note: toNullable(note),
    });
  }

  function submitDecision(action: 'full' | 'abort') {
    setValidationError(null);
    onAction(action, {
      note: toNullable(note),
    });
  }

  return (
    <section className="grid gap-4">
      <Card className="overflow-hidden border-slate-200/80 bg-white/85 shadow-sm backdrop-blur">
        <div className="border-b p-4">
          <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge tone="ready">M63-14</StatusBadge>
                <StatusBadge tone={currentBatch ? channelReleaseBatchStatusTone(currentBatch.status) : 'planned'}>
                  {currentBatch ? channelReleaseBatchStatusLabel(currentBatch.status) : '空闲'}
                </StatusBadge>
                {pipeline?.generated_at ? <StatusBadge tone="loading">生成 {formatChannelDateTime(pipeline.generated_at)}</StatusBadge> : null}
              </div>
              <h2 className="mt-3 text-base font-semibold">渠道发布流水线与发布批次</h2>
              <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">
                将发布批次、审批、灰度、全量、回滚和终止串成可追踪流水线；批次状态保存在渠道配置，关键动作写入平台事件。
              </p>
            </div>
            <Button disabled={loading || !channel} onClick={onRefresh} type="button" variant="outline">
              <RefreshCw className={cn('size-4', loading && 'animate-spin')} />
              刷新流水线
            </Button>
          </div>
        </div>

        <div className="grid gap-4 p-4">
          {!channel ? (
            <EmptyState description="请选择一个发布渠道后查看发布流水线。" title="未选择渠道" />
          ) : (
            <>
              {error || validationError ? (
                <div className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                  {validationError ?? error}
                </div>
              ) : null}

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {loading
                  ? Array.from({ length: 4 }).map((_, index) => <div className="h-24 rounded-md border bg-slate-50" key={index} />)
                  : metrics.map((metric) => (
                      <MetricCard helper={metric.helper} key={metric.label} label={metric.label} value={metric.value} />
                    ))}
              </div>

              <div className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
                <Card className="border-slate-200/80 p-4">
                  <div className="mb-4">
                    <h3 className="text-sm font-semibold">发布步骤</h3>
                    <p className="mt-1 text-sm text-muted-foreground">按照当前批次、审批和灰度状态自动生成流水线步骤。</p>
                  </div>
                  <div className="grid gap-3">
                    {(pipeline?.steps ?? []).length === 0 && !loading ? (
                      <EmptyState
                        className="rounded-md border bg-slate-50/60 p-6"
                        description="创建发布批次后会生成完整步骤。"
                        title="暂无发布步骤"
                      />
                    ) : (
                      (pipeline?.steps ?? []).map((step, index) => (
                        <div className="grid gap-3 rounded-md border bg-white/80 p-3 md:grid-cols-[28px_1fr_auto]" key={step.key}>
                          <div className={cn(
                            'flex size-7 items-center justify-center rounded-full border text-xs font-semibold',
                            releaseStepCircleClass(step.status),
                          )}>
                            {index + 1}
                          </div>
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-sm font-semibold">{step.name}</span>
                              <StatusBadge tone={releaseStepStatusTone(step.status)}>
                                {releaseStepStatusLabel(step.status)}
                              </StatusBadge>
                            </div>
                            <p className="mt-1 text-sm leading-6 text-muted-foreground">{step.description}</p>
                          </div>
                          <div className="text-xs text-muted-foreground md:text-right">
                            <div>{formatChannelDateTime(step.occurred_at)}</div>
                            <div className="mt-1 font-mono">{step.event_type ?? '-'}</div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </Card>

                <Card className="border-slate-200/80 p-4">
                  <div className="mb-4">
                    <h3 className="text-sm font-semibold">批次操作</h3>
                    <p className="mt-1 text-sm text-muted-foreground">创建批次后，继续使用发布审批和灰度控制推进流水线。</p>
                  </div>
                  <div className="grid gap-4">
                    <label className="grid gap-1.5 text-sm">
                      <span className="font-medium">批次标题</span>
                      <Input
                        disabled={!canManage || hasOpenBatch || loading}
                        onChange={(event) => {
                          setTitle(event.target.value);
                          setValidationError(null);
                        }}
                        placeholder="例如：官网渠道五月灰度发布"
                        value={title}
                      />
                    </label>
                    <NumberField
                      disabled={!canManage || hasOpenBatch || loading}
                      label="目标灰度比例"
                      max={100}
                      min={0}
                      onChange={setTargetPercentage}
                      suffix="%"
                      value={targetPercentage}
                    />
                    <label className="grid gap-1.5 text-sm">
                      <span className="font-medium">发布说明</span>
                      <textarea
                        className="min-h-24 rounded-md border bg-background/80 px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:bg-muted disabled:opacity-70"
                        disabled={loading || isMutating}
                        onChange={(event) => setNote(event.target.value)}
                        placeholder="填写发布目标、风险点或终止原因"
                        value={note}
                      />
                    </label>
                    <div className="flex flex-wrap gap-2">
                      <Button disabled={!canManage || hasOpenBatch || loading || isMutating} onClick={submitStart} type="button">
                        <Plus className="size-4" />
                        创建批次
                      </Button>
                      <Button disabled={!canDeploy || !hasOpenBatch || loading || isMutating} onClick={() => submitDecision('full')} type="button" variant="outline">
                        <RadioTower className="size-4" />
                        标记全量
                      </Button>
                      <Button disabled={!canAbort || !hasOpenBatch || loading || isMutating} onClick={() => submitDecision('abort')} type="button" variant="outline">
                        <PowerOff className="size-4" />
                        终止批次
                      </Button>
                    </div>
                  </div>
                </Card>
              </div>

              <div className="grid gap-4 xl:grid-cols-2">
                <Card className="border-slate-200/80 p-4">
                  <div className="mb-4">
                    <h3 className="text-sm font-semibold">最近发布批次</h3>
                    <p className="mt-1 text-sm text-muted-foreground">保留最近 8 个渠道发布批次。</p>
                  </div>
                  <div className="grid gap-3">
                    {(pipeline?.recent_batches ?? []).length === 0 ? (
                      <EmptyState className="rounded-md border bg-slate-50/60 p-6" description="暂无发布批次。" title="无批次记录" />
                    ) : (
                      (pipeline?.recent_batches ?? []).map((batch) => (
                        <div className="rounded-md border bg-white/80 p-3" key={batch.batch_id}>
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="text-sm font-semibold">{batch.title}</span>
                            <StatusBadge tone={channelReleaseBatchStatusTone(batch.status)}>
                              {channelReleaseBatchStatusLabel(batch.status)}
                            </StatusBadge>
                          </div>
                          <div className="mt-2 grid gap-2 text-xs text-muted-foreground md:grid-cols-2">
                            <span>批次：{batch.batch_id}</span>
                            <span>目标：{batch.target_rollout_percentage}%</span>
                            <span>开始：{formatChannelDateTime(batch.started_at)}</span>
                            <span>完成：{formatChannelDateTime(batch.completed_at)}</span>
                          </div>
                          {batch.note ? <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{batch.note}</p> : null}
                        </div>
                      ))
                    )}
                  </div>
                </Card>

                <Card className="border-slate-200/80 p-4">
                  <div className="mb-4">
                    <h3 className="text-sm font-semibold">最近发布事件</h3>
                    <p className="mt-1 text-sm text-muted-foreground">发布批次、审批、灰度和回滚事件。</p>
                  </div>
                  <div className="grid gap-3">
                    {(pipeline?.recent_events ?? []).length === 0 ? (
                      <EmptyState className="rounded-md border bg-slate-50/60 p-6" description="暂无发布事件。" title="无事件记录" />
                    ) : (
                      (pipeline?.recent_events ?? []).slice(0, 6).map((event) => (
                        <div className="rounded-md border bg-white/80 p-3" key={event.id}>
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="truncate text-sm font-medium">{event.summary ?? event.event_type}</span>
                            <StatusBadge tone={event.status === 'FAILED' ? 'unavailable' : 'healthy'}>{event.status}</StatusBadge>
                          </div>
                          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                            <span>{event.event_type}</span>
                            <span>{formatChannelDateTime(event.occurred_at)}</span>
                            {event.trace_id ? <span>Trace：{event.trace_id}</span> : null}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </Card>
              </div>

              {!canManage ? (
                <div className="rounded-md border bg-slate-50/80 px-4 py-3 text-sm text-muted-foreground">
                  当前账号缺少 channel:publish:manage 权限，只能查看发布流水线，不能创建或推进批次。
                </div>
              ) : null}
            </>
          )}
        </div>
      </Card>
    </section>
  );
}

function ReleaseGatePanel({
  canManage,
  channel,
  error,
  isMutating,
  loading,
  onEvaluate,
  onRefresh,
  onSave,
  overview,
}: {
  canManage: boolean;
  channel: PublishChannelListItem | null;
  error: string | null;
  isMutating: boolean;
  loading: boolean;
  onEvaluate: () => void;
  onRefresh: () => void;
  onSave: (input: ChannelReleaseGatePolicyInput) => void;
  overview: ChannelReleaseGateOverview | null;
}) {
  const [draft, setDraft] = useState<ChannelReleaseGatePolicy>(() => overview?.policy ?? defaultReleaseGatePolicy());

  useEffect(() => {
    setDraft(overview?.policy ?? defaultReleaseGatePolicy());
  }, [channel?.id, overview?.policy]);

  const evaluation = overview?.evaluation ?? null;
  const batch = evaluation?.current_batch ?? null;
  const gateMetrics = evaluation?.metrics ?? null;
  const metrics = [
    {
      helper: evaluation?.reason ?? '等待观测门禁评估',
      label: '门禁结论',
      value: evaluation ? releaseGateDecisionLabel(evaluation.decision) : '-',
    },
    {
      helper: `阈值至少 ${formatNumber(draft.min_evaluated_count)} 次`,
      label: '样本量',
      value: formatNumber(gateMetrics?.evaluated_count ?? 0),
    },
    {
      helper: `阈值不低于 ${draft.min_allowed_rate}%`,
      label: '放行率',
      value: gateMetrics ? `${gateMetrics.allowed_rate}%` : '-',
    },
    {
      helper: `阈值最多 ${formatNumber(draft.max_blocked_count)} 次`,
      label: '拦截数',
      value: formatNumber(gateMetrics?.blocked_count ?? 0),
    },
  ];

  function update<K extends keyof ChannelReleaseGatePolicy>(key: K, value: ChannelReleaseGatePolicy[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function handleSave() {
    const input: ChannelReleaseGatePolicyInput = {
      enabled: draft.enabled,
      min_evaluated_count: clampNumber(draft.min_evaluated_count, 1, 100000),
      min_allowed_rate: clampNumber(draft.min_allowed_rate, 0, 100),
      max_blocked_count: clampNumber(draft.max_blocked_count, 0, 100000),
      auto_promote_enabled: draft.auto_promote_enabled,
      observation_window_hours: clampNumber(draft.observation_window_hours, 1, 168),
    };

    setDraft({ ...input, updated_at: draft.updated_at } as ChannelReleaseGatePolicy);
    onSave(input);
  }

  return (
    <section className="grid gap-4">
      <Card className="overflow-hidden border-slate-200/80 bg-white/85 shadow-sm backdrop-blur">
        <div className="border-b p-4">
          <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge tone="ready">M63-15</StatusBadge>
                <StatusBadge tone={evaluation ? releaseGateDecisionTone(evaluation.decision) : 'planned'}>
                  {evaluation ? releaseGateDecisionLabel(evaluation.decision) : '未加载'}
                </StatusBadge>
                <StatusBadge tone={draft.auto_promote_enabled ? 'degraded' : 'planned'}>
                  {draft.auto_promote_enabled ? '自动推进策略已开' : '仅评估建议'}
                </StatusBadge>
                {overview?.generated_at ? <StatusBadge tone="loading">生成 {formatChannelDateTime(overview.generated_at)}</StatusBadge> : null}
              </div>
              <h2 className="mt-3 text-base font-semibold">渠道发布自动推进与观测门禁</h2>
              <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">
                汇总当前发布批次在观测窗口内的灰度门控样本，给出可推进、继续观察或建议阻断的发布结论；本阶段只生成门禁结论和事件，不自动执行全量发布。
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button disabled={loading || !channel} onClick={onRefresh} type="button" variant="outline">
                <RefreshCw className={cn('size-4', loading && 'animate-spin')} />
                刷新门禁
              </Button>
              <Button disabled={!channel || loading || isMutating} onClick={onEvaluate} type="button" variant="outline">
                <Gauge className={cn('size-4', isMutating && 'animate-pulse')} />
                立即评估
              </Button>
              <Button disabled={!canManage || !channel || loading || isMutating} onClick={handleSave} type="button">
                <Save className={cn('size-4', isMutating && 'animate-pulse')} />
                保存策略
              </Button>
            </div>
          </div>
        </div>

        <div className="grid gap-4 p-4">
          {!channel ? (
            <EmptyState description="请选择一个发布渠道后查看自动推进观测门禁。" title="未选择渠道" />
          ) : (
            <>
              {error ? (
                <div className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                  {error}
                </div>
              ) : null}

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {loading
                  ? Array.from({ length: 4 }).map((_, index) => <div className="h-24 rounded-md border bg-slate-50" key={index} />)
                  : metrics.map((metric) => (
                      <MetricCard helper={metric.helper} key={metric.label} label={metric.label} value={metric.value} />
                    ))}
              </div>

              <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
                <Card className="border-slate-200/80 p-4">
                  <div className="mb-4">
                    <h3 className="text-sm font-semibold">门禁策略</h3>
                    <p className="mt-1 text-sm text-muted-foreground">调整样本量、放行率和拦截阈值，控制何时给出全量推进建议。</p>
                  </div>
                  <div className="grid gap-3">
                    <PolicyToggle
                      checked={draft.enabled}
                      disabled={!canManage || loading}
                      helper="关闭后只展示门禁关闭结论，不再给出可推进或阻断建议。"
                      label="启用观测门禁"
                      onChange={(value) => update('enabled', value)}
                    />
                    <PolicyToggle
                      checked={draft.auto_promote_enabled}
                      disabled={!canManage || loading}
                      helper="当前版本仅保存策略和生成建议，不会自动点击全量发布；后续 Temporal 工作流可读取此开关。"
                      label="允许后续自动推进"
                      onChange={(value) => update('auto_promote_enabled', value)}
                    />
                  </div>

                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <NumberField
                      disabled={!canManage || loading}
                      label="最小样本量"
                      max={100000}
                      min={1}
                      onChange={(value) => update('min_evaluated_count', value)}
                      suffix="次"
                      value={draft.min_evaluated_count}
                    />
                    <NumberField
                      disabled={!canManage || loading}
                      label="最低放行率"
                      max={100}
                      min={0}
                      onChange={(value) => update('min_allowed_rate', value)}
                      suffix="%"
                      value={draft.min_allowed_rate}
                    />
                    <NumberField
                      disabled={!canManage || loading}
                      label="最大拦截数"
                      max={100000}
                      min={0}
                      onChange={(value) => update('max_blocked_count', value)}
                      suffix="次"
                      value={draft.max_blocked_count}
                    />
                    <NumberField
                      disabled={!canManage || loading}
                      label="观测窗口"
                      max={168}
                      min={1}
                      onChange={(value) => update('observation_window_hours', value)}
                      suffix="小时"
                      value={draft.observation_window_hours}
                    />
                  </div>

                  <div className="mt-4 rounded-md border bg-slate-50/70 px-4 py-3 text-sm leading-6 text-muted-foreground">
                    策略会保存在渠道配置里，后端每次评估都会重新读取当前批次和观测窗口内的平台用量事件。
                  </div>
                </Card>

                <Card className="border-slate-200/80 p-4">
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold">评估结果</h3>
                      <p className="mt-1 text-sm text-muted-foreground">门禁结论来自当前发布批次和灰度门控实测数据。</p>
                    </div>
                    <StatusBadge tone={evaluation ? releaseGateDecisionTone(evaluation.decision) : 'planned'}>
                      {evaluation ? releaseGateDecisionLabel(evaluation.decision) : '无结论'}
                    </StatusBadge>
                  </div>

                  {!evaluation ? (
                    <EmptyState
                      className="rounded-md border bg-slate-50/60 p-6"
                      description="选择渠道后会自动读取当前门禁评估。"
                      title="暂无评估结果"
                    />
                  ) : (
                    <div className="grid gap-4">
                      <div className="grid gap-3 text-sm md:grid-cols-2">
                        <InfoRow label="当前批次" value={batch?.title ?? '无进行中批次'} />
                        <InfoRow label="批次状态" value={batch ? channelReleaseBatchStatusLabel(batch.status) : '无'} />
                        <InfoRow label="是否可全量" value={evaluation.eligible_for_full_release ? '可以推进' : '暂不建议'} />
                        <InfoRow label="评估时间" value={formatChannelDateTime(evaluation.evaluated_at)} />
                      </div>

                      <div className="rounded-md border bg-slate-50/70 p-3 text-sm leading-6">
                        <div className="font-medium">门禁原因</div>
                        <p className="mt-1 text-muted-foreground">{evaluation.reason}</p>
                      </div>

                      <div className="grid gap-3 rounded-md border bg-white/80 p-3 text-sm md:grid-cols-2">
                        <DetailRow label="评估样本" value={formatNumber(evaluation.metrics.evaluated_count)} />
                        <DetailRow label="放行请求" value={formatNumber(evaluation.metrics.allowed_count)} />
                        <DetailRow label="拦截请求" value={formatNumber(evaluation.metrics.blocked_count)} />
                        <DetailRow label="免灰度" value={formatNumber(evaluation.metrics.bypass_count)} />
                      </div>

                      <RolloutProgress label="观测放行率" tone="bg-emerald-500" value={evaluation.metrics.allowed_rate} />
                    </div>
                  )}
                </Card>
              </div>

              <Card className="border-slate-200/80 p-4">
                <div className="mb-4">
                  <h3 className="text-sm font-semibold">最近门禁事件</h3>
                  <p className="mt-1 text-sm text-muted-foreground">保存策略和手动评估会写入平台事件，便于发布审计。</p>
                </div>
                <div className="grid gap-3">
                  {(overview?.recent_events ?? []).length === 0 ? (
                    <EmptyState
                      className="rounded-md border bg-slate-50/60 p-6"
                      description="保存策略或手动评估后会生成门禁事件。"
                      title="暂无门禁事件"
                    />
                  ) : (
                    (overview?.recent_events ?? []).map((event) => (
                      <div className="rounded-md border bg-white/80 p-3" key={event.id}>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="truncate text-sm font-medium">{event.summary ?? event.event_type}</span>
                          <StatusBadge tone={event.status === 'FAILED' ? 'unavailable' : 'healthy'}>{event.status}</StatusBadge>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                          <span>{event.event_type}</span>
                          <span>{formatChannelDateTime(event.occurred_at)}</span>
                          {event.trace_id ? <span>Trace：{event.trace_id}</span> : null}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Card>

              {!canManage ? (
                <div className="rounded-md border bg-slate-50/80 px-4 py-3 text-sm text-muted-foreground">
                  当前账号缺少 channel:publish:manage 权限，只能查看观测门禁，不能保存策略。
                </div>
              ) : null}
            </>
          )}
        </div>
      </Card>
    </section>
  );
}

function ReleaseAutomationPanel({
  canDeploy,
  canManage,
  channel,
  error,
  isMutating,
  loading,
  onRefresh,
  onRun,
  onSave,
  overview,
}: {
  canDeploy: boolean;
  canManage: boolean;
  channel: PublishChannelListItem | null;
  error: string | null;
  isMutating: boolean;
  loading: boolean;
  onRefresh: () => void;
  onRun: () => void;
  onSave: (input: ChannelReleaseAutomationPolicyInput) => void;
  overview: ChannelReleaseAutomationOverview | null;
}) {
  const [draft, setDraft] = useState<ChannelReleaseAutomationPolicy>(() => overview?.policy ?? defaultReleaseAutomationPolicy());

  useEffect(() => {
    setDraft(overview?.policy ?? defaultReleaseAutomationPolicy());
  }, [channel?.id, overview?.policy]);

  const lastRun = overview?.last_run ?? null;
  const gate = overview?.gate ?? null;
  const canRunNow = Boolean(channel && overview && !overview.running && (overview.next_allowed_at === null || new Date(overview.next_allowed_at).getTime() <= Date.now()));
  const metrics = [
    {
      helper: draft.enabled ? '手动执行会先检查观测门禁' : '执行器关闭时只记录跳过',
      label: '执行器状态',
      value: draft.enabled ? '已启用' : '未启用',
    },
    {
      helper: gate?.reason ?? '等待观测门禁结论',
      label: '门禁结论',
      value: gate ? releaseGateDecisionLabel(gate.decision) : '-',
    },
    {
      helper: `每日上限 ${draft.max_runs_per_day} 次`,
      label: '今日执行',
      value: formatNumber(overview?.today_run_count ?? 0),
    },
    {
      helper: overview?.workflow_mode ? `工作流模式 ${releaseWorkflowModeLabel(overview.workflow_mode)}` : '当前没有间隔限制',
      label: '最近结果',
      value: lastRun ? releaseAutomationDecisionLabel(lastRun.decision) : overview?.workflow_backend ? releaseWorkflowBackendLabel(overview.workflow_backend) : '暂无',
    },
  ];

  function update<K extends keyof ChannelReleaseAutomationPolicy>(key: K, value: ChannelReleaseAutomationPolicy[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function handleSave() {
    const input: ChannelReleaseAutomationPolicyInput = {
      enabled: draft.enabled,
      require_auto_promote_policy: draft.require_auto_promote_policy,
      min_interval_minutes: clampNumber(draft.min_interval_minutes, 1, 1440),
      max_runs_per_day: clampNumber(draft.max_runs_per_day, 1, 100),
      dry_run: draft.dry_run,
    };
    setDraft({ ...input, updated_at: draft.updated_at } as ChannelReleaseAutomationPolicy);
    onSave(input);
  }

  return (
    <section className="grid gap-4">
      <Card className="overflow-hidden border-slate-200/80 bg-white/85 shadow-sm backdrop-blur">
        <div className="border-b p-4">
          <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge tone="ready">M63-16</StatusBadge>
                <StatusBadge tone={draft.enabled ? 'healthy' : 'planned'}>{draft.enabled ? '执行器已启用' : '执行器未启用'}</StatusBadge>
                <StatusBadge tone={draft.dry_run ? 'degraded' : 'healthy'}>{draft.dry_run ? '演练模式' : '真实推进'}</StatusBadge>
                {lastRun ? <StatusBadge tone={releaseAutomationDecisionTone(lastRun.decision)}>{releaseAutomationDecisionLabel(lastRun.decision)}</StatusBadge> : null}
                {overview?.generated_at ? <StatusBadge tone="loading">生成 {formatChannelDateTime(overview.generated_at)}</StatusBadge> : null}
              </div>
              <h2 className="mt-3 text-base font-semibold">渠道自动推进执行器</h2>
              <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">
                在观测门禁返回可推进后，按执行策略把当前发布批次推进到全量；第一版提供手动触发、演练模式、频率限制和审计事件，为后续 Temporal 定时推进预留边界。
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button disabled={loading || !channel} onClick={onRefresh} type="button" variant="outline">
                <RefreshCw className={cn('size-4', loading && 'animate-spin')} />
                刷新执行器
              </Button>
              <Button disabled={!canDeploy || !canRunNow || loading || isMutating} onClick={onRun} type="button" variant="outline">
                <RadioTower className={cn('size-4', isMutating && 'animate-pulse')} />
                执行一次
              </Button>
              <Button disabled={!canManage || !channel || loading || isMutating} onClick={handleSave} type="button">
                <Save className={cn('size-4', isMutating && 'animate-pulse')} />
                保存执行策略
              </Button>
            </div>
          </div>
        </div>

        <div className="grid gap-4 p-4">
          {!channel ? (
            <EmptyState description="请选择一个发布渠道后查看自动推进执行器。" title="未选择渠道" />
          ) : (
            <>
              {error ? (
                <div className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                  {error}
                </div>
              ) : null}

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {loading
                  ? Array.from({ length: 4 }).map((_, index) => <div className="h-24 rounded-md border bg-slate-50" key={index} />)
                  : metrics.map((metric) => (
                      <MetricCard helper={metric.helper} key={metric.label} label={metric.label} value={metric.value} />
                    ))}
              </div>

              <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
                <Card className="border-slate-200/80 p-4">
                  <div className="mb-4">
                    <h3 className="text-sm font-semibold">执行策略</h3>
                    <p className="mt-1 text-sm text-muted-foreground">策略会在每次执行前校验，避免重复全量和误触发。</p>
                  </div>
                  <div className="grid gap-3">
                    <PolicyToggle
                      checked={draft.enabled}
                      disabled={!canManage || loading}
                      helper="关闭后执行一次只会写入跳过结果，不会推进发布批次。"
                      label="启用执行器"
                      onChange={(value) => update('enabled', value)}
                    />
                    <PolicyToggle
                      checked={draft.require_auto_promote_policy}
                      disabled={!canManage || loading}
                      helper="开启后必须同时在观测门禁里允许后续自动推进。"
                      label="要求门禁允许自动推进"
                      onChange={(value) => update('require_auto_promote_policy', value)}
                    />
                    <PolicyToggle
                      checked={draft.dry_run}
                      disabled={!canManage || loading}
                      helper="演练模式会完整评估并记录事件，但不会标记全量。"
                      label="演练模式"
                      onChange={(value) => update('dry_run', value)}
                    />
                  </div>

                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <NumberField
                      disabled={!canManage || loading}
                      label="最小执行间隔"
                      max={1440}
                      min={1}
                      onChange={(value) => update('min_interval_minutes', value)}
                      suffix="分钟"
                      value={draft.min_interval_minutes}
                    />
                    <NumberField
                      disabled={!canManage || loading}
                      label="每日上限"
                      max={100}
                      min={1}
                      onChange={(value) => update('max_runs_per_day', value)}
                      suffix="次"
                      value={draft.max_runs_per_day}
                    />
                  </div>
                </Card>

                <Card className="border-slate-200/80 p-4">
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold">执行状态</h3>
                      <p className="mt-1 text-sm text-muted-foreground">展示当前门禁、批次和最近执行结果。</p>
                    </div>
                    <StatusBadge tone={lastRun ? releaseAutomationDecisionTone(lastRun.decision) : 'planned'}>
                      {lastRun ? releaseAutomationDecisionLabel(lastRun.decision) : '暂无执行'}
                    </StatusBadge>
                  </div>

                  <div className="grid gap-4">
                    <div className="grid gap-3 text-sm md:grid-cols-2">
                      <InfoRow label="当前批次" value={overview?.current_batch?.title ?? '无进行中批次'} />
                      <InfoRow label="批次状态" value={overview?.current_batch ? channelReleaseBatchStatusLabel(overview.current_batch.status) : '无'} />
                      <InfoRow label="是否可执行" value={canRunNow ? '可以执行' : overview?.next_allowed_at ? '等待间隔' : '不可执行'} />
                      <InfoRow label="下次允许" value={formatChannelDateTime(overview?.next_allowed_at ?? null)} />
                      <InfoRow label="工作流模式" value={overview?.workflow_mode ? releaseWorkflowModeLabel(overview.workflow_mode) : 'local'} />
                      <InfoRow label="执行后端" value={overview?.workflow_backend ? releaseWorkflowBackendLabel(overview.workflow_backend) : '本地'} />
                    </div>

                    {lastRun ? (
                      <div className="grid gap-3 rounded-md border bg-white/80 p-3 text-sm md:grid-cols-2">
                        <DetailRow label="运行 ID" value={lastRun.run_id} />
                        <DetailRow label="工作流 ID" value={lastRun.workflow_id ?? '无'} />
                        <DetailRow label="工作流后端" value={lastRun.workflow_backend ? releaseWorkflowBackendLabel(lastRun.workflow_backend) : '无'} />
                        <DetailRow label="模式" value={lastRun.mode === 'SCHEDULED' ? '定时' : '手动'} />
                        <DetailRow label="批次" value={lastRun.batch_id ?? '无'} />
                        <DetailRow label="门禁" value={releaseGateDecisionLabel(lastRun.gate_decision)} />
                        <DetailRow label="开始" value={formatChannelDateTime(lastRun.started_at)} />
                        <DetailRow label="完成" value={formatChannelDateTime(lastRun.finished_at)} />
                      </div>
                    ) : (
                      <EmptyState
                        className="rounded-md border bg-slate-50/60 p-6"
                        description="手动执行一次后会显示最近运行结果。"
                        title="暂无运行结果"
                      />
                    )}

                    <div className="rounded-md border bg-slate-50/70 px-4 py-3 text-sm leading-6 text-muted-foreground">
                      {lastRun?.reason ?? gate?.reason ?? '执行器会在推进前重新读取最新门禁结论和发布批次。'}
                    </div>
                  </div>
                </Card>
              </div>

              <Card className="border-slate-200/80 p-4">
                <div className="mb-4">
                  <h3 className="text-sm font-semibold">最近执行事件</h3>
                  <p className="mt-1 text-sm text-muted-foreground">执行器的策略更新、跳过、阻断和推进结果都会写入平台事件。</p>
                </div>
                <div className="grid gap-3">
                  {(overview?.recent_events ?? []).length === 0 ? (
                    <EmptyState
                      className="rounded-md border bg-slate-50/60 p-6"
                      description="保存策略或执行一次后会生成执行器事件。"
                      title="暂无执行事件"
                    />
                  ) : (
                    (overview?.recent_events ?? []).map((event) => (
                      <div className="rounded-md border bg-white/80 p-3" key={event.id}>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="truncate text-sm font-medium">{event.summary ?? event.event_type}</span>
                          <StatusBadge tone={event.status === 'FAILED' ? 'unavailable' : 'healthy'}>{event.status}</StatusBadge>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                          <span>{event.event_type}</span>
                          <span>{formatChannelDateTime(event.occurred_at)}</span>
                          {event.trace_id ? <span>Trace：{event.trace_id}</span> : null}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Card>

              {!canManage || !canDeploy ? (
                <div className="rounded-md border bg-slate-50/80 px-4 py-3 text-sm text-muted-foreground">
                  当前账号需要 channel:publish:manage 保存执行策略，需要 channel:publish:deploy 手动执行自动推进。
                </div>
              ) : null}
            </>
          )}
        </div>
      </Card>
    </section>
  );
}

function ReleaseSelfHealingPanel({
  canDeploy,
  canManage,
  channel,
  error,
  isMutating,
  loading,
  onRefresh,
  onRun,
  onSave,
  overview,
}: {
  canDeploy: boolean;
  canManage: boolean;
  channel: PublishChannelListItem | null;
  error: string | null;
  isMutating: boolean;
  loading: boolean;
  onRefresh: () => void;
  onRun: () => void;
  onSave: (input: ChannelReleaseSelfHealingPolicyInput) => void;
  overview: ChannelReleaseSelfHealingOverview | null;
}) {
  const [draft, setDraft] = useState<ChannelReleaseSelfHealingPolicy>(() => overview?.policy ?? defaultReleaseSelfHealingPolicy());

  useEffect(() => {
    setDraft(overview?.policy ?? defaultReleaseSelfHealingPolicy());
  }, [channel?.id, overview?.policy]);

  const evaluation = overview?.evaluation ?? null;
  const lastRun = overview?.last_run ?? null;
  const canRunNow = Boolean(channel && overview && (overview.next_allowed_at === null || new Date(overview.next_allowed_at).getTime() <= Date.now()));
  const metrics = [
    {
      helper: evaluation?.reason ?? '等待自愈评估',
      label: '自愈结论',
      value: evaluation ? releaseSelfHealingDecisionLabel(evaluation.decision) : '-',
    },
    {
      helper: `阈值最多 ${formatNumber(draft.max_error_requests)} 次`,
      label: '错误请求',
      value: formatNumber(evaluation?.metrics.error_request_count ?? 0),
    },
    {
      helper: `阈值不低于 ${draft.min_allowed_rate}%`,
      label: '放行率',
      value: evaluation ? `${evaluation.metrics.allowed_rate}%` : '-',
    },
    {
      helper: overview?.next_allowed_at ? `下次 ${formatChannelDateTime(overview.next_allowed_at)}` : '当前没有冷却限制',
      label: '最近结果',
      value: lastRun ? releaseSelfHealingDecisionLabel(lastRun.decision) : '暂无',
    },
  ];

  function update<K extends keyof ChannelReleaseSelfHealingPolicy>(key: K, value: ChannelReleaseSelfHealingPolicy[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function handleSave() {
    const input: ChannelReleaseSelfHealingPolicyInput = {
      enabled: draft.enabled,
      dry_run: draft.dry_run,
      auto_rollback_enabled: draft.auto_rollback_enabled,
      max_error_requests: clampNumber(draft.max_error_requests, 0, 100000),
      min_allowed_rate: clampNumber(draft.min_allowed_rate, 0, 100),
      observation_window_hours: clampNumber(draft.observation_window_hours, 1, 168),
      cooldown_minutes: clampNumber(draft.cooldown_minutes, 1, 1440),
    };
    setDraft({ ...input, updated_at: draft.updated_at } as ChannelReleaseSelfHealingPolicy);
    onSave(input);
  }

  return (
    <section className="grid gap-4">
      <Card className="overflow-hidden border-slate-200/80 bg-white/85 shadow-sm backdrop-blur">
        <div className="border-b p-4">
          <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge tone="ready">M63-19</StatusBadge>
                <StatusBadge tone={evaluation ? releaseSelfHealingDecisionTone(evaluation.decision) : 'planned'}>
                  {evaluation ? releaseSelfHealingDecisionLabel(evaluation.decision) : '未加载'}
                </StatusBadge>
                <StatusBadge tone={draft.dry_run ? 'degraded' : 'healthy'}>{draft.dry_run ? '演练模式' : '真实回滚'}</StatusBadge>
                <StatusBadge tone={draft.auto_rollback_enabled ? 'degraded' : 'planned'}>
                  {draft.auto_rollback_enabled ? '允许自动回滚' : '仅建议'}
                </StatusBadge>
                {overview?.workflow_backend ? <StatusBadge tone="loading">{releaseWorkflowBackendLabel(overview.workflow_backend)}</StatusBadge> : null}
                {overview?.generated_at ? <StatusBadge tone="loading">生成 {formatChannelDateTime(overview.generated_at)}</StatusBadge> : null}
              </div>
              <h2 className="mt-3 text-base font-semibold">渠道发布回滚与失败自愈</h2>
              <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">
                在自动推进全量后，结合渠道健康、错误请求和灰度门控数据判断是否需要回滚；执行通道已接入 Runtime workflow，可在 Temporal 未启用时使用本地兜底。
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button disabled={loading || !channel} onClick={onRefresh} type="button" variant="outline">
                <RefreshCw className={cn('size-4', loading && 'animate-spin')} />
                刷新自愈
              </Button>
              <Button disabled={!canDeploy || !canRunNow || loading || isMutating} onClick={onRun} type="button" variant="outline">
                <RotateCcw className={cn('size-4', isMutating && 'animate-spin')} />
                执行一次
              </Button>
              <Button disabled={!canManage || !channel || loading || isMutating} onClick={handleSave} type="button">
                <Save className={cn('size-4', isMutating && 'animate-pulse')} />
                保存自愈策略
              </Button>
            </div>
          </div>
        </div>

        <div className="grid gap-4 p-4">
          {!channel ? (
            <EmptyState description="请选择一个发布渠道后查看失败自愈策略。" title="未选择渠道" />
          ) : (
            <>
              {error ? (
                <div className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                  {error}
                </div>
              ) : null}

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {loading
                  ? Array.from({ length: 4 }).map((_, index) => <div className="h-24 rounded-md border bg-slate-50" key={index} />)
                  : metrics.map((metric) => (
                      <MetricCard helper={metric.helper} key={metric.label} label={metric.label} value={metric.value} />
                    ))}
              </div>

              <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
                <Card className="border-slate-200/80 p-4">
                  <div className="mb-4">
                    <h3 className="text-sm font-semibold">自愈策略</h3>
                    <p className="mt-1 text-sm text-muted-foreground">控制自愈判断阈值、冷却时间和是否允许真实回滚。</p>
                  </div>
                  <div className="grid gap-3">
                    <PolicyToggle
                      checked={draft.enabled}
                      disabled={!canManage || loading}
                      helper="关闭后只展示禁用状态，不执行回滚判断。"
                      label="启用发布自愈"
                      onChange={(value) => update('enabled', value)}
                    />
                    <PolicyToggle
                      checked={draft.dry_run}
                      disabled={!canManage || loading}
                      helper="演练模式会记录命中结果，但不会调用真实回滚。"
                      label="演练模式"
                      onChange={(value) => update('dry_run', value)}
                    />
                    <PolicyToggle
                      checked={draft.auto_rollback_enabled}
                      disabled={!canManage || loading}
                      helper="开启且关闭演练模式后，命中条件会回滚到最近稳定配置。"
                      label="允许自动回滚"
                      onChange={(value) => update('auto_rollback_enabled', value)}
                    />
                  </div>

                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <NumberField disabled={!canManage || loading} label="最大错误请求" max={100000} min={0} onChange={(value) => update('max_error_requests', value)} suffix="次" value={draft.max_error_requests} />
                    <NumberField disabled={!canManage || loading} label="最低放行率" max={100} min={0} onChange={(value) => update('min_allowed_rate', value)} suffix="%" value={draft.min_allowed_rate} />
                    <NumberField disabled={!canManage || loading} label="观测窗口" max={168} min={1} onChange={(value) => update('observation_window_hours', value)} suffix="小时" value={draft.observation_window_hours} />
                    <NumberField disabled={!canManage || loading} label="自愈冷却" max={1440} min={1} onChange={(value) => update('cooldown_minutes', value)} suffix="分钟" value={draft.cooldown_minutes} />
                  </div>
                </Card>

                <Card className="border-slate-200/80 p-4">
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold">自愈评估</h3>
                      <p className="mt-1 text-sm text-muted-foreground">读取最近自动推进、当前批次和发布控制回滚点。</p>
                    </div>
                    <StatusBadge tone={evaluation ? releaseSelfHealingDecisionTone(evaluation.decision) : 'planned'}>
                      {evaluation ? releaseSelfHealingDecisionLabel(evaluation.decision) : '无结论'}
                    </StatusBadge>
                  </div>

                  {!evaluation ? (
                    <EmptyState className="rounded-md border bg-slate-50/60 p-6" description="选择渠道后会显示自愈评估。" title="暂无评估" />
                  ) : (
                    <div className="grid gap-4">
                      <div className="grid gap-3 text-sm md:grid-cols-2">
                        <InfoRow label="当前批次" value={evaluation.current_batch?.title ?? '无批次'} />
                        <InfoRow label="建议回滚" value={evaluation.rollback_recommended ? '建议回滚' : '暂不回滚'} />
                        <InfoRow label="回滚点" value={evaluation.rollback_available ? '可回滚' : '不可用'} />
                        <InfoRow label="评估时间" value={formatChannelDateTime(evaluation.evaluated_at)} />
                        <InfoRow label="最近推进" value={evaluation.last_automation_run ? releaseAutomationDecisionLabel(evaluation.last_automation_run.decision) : '无'} />
                        <InfoRow label="下次允许" value={formatChannelDateTime(overview?.next_allowed_at ?? null)} />
                        <InfoRow label="工作流模式" value={overview?.workflow_mode ? releaseWorkflowModeLabel(overview.workflow_mode) : 'local'} />
                        <InfoRow label="执行后端" value={overview?.workflow_backend ? releaseWorkflowBackendLabel(overview.workflow_backend) : '本地'} />
                      </div>

                      <div className="rounded-md border bg-slate-50/70 px-4 py-3 text-sm leading-6 text-muted-foreground">
                        {evaluation.reason}
                      </div>

                      {lastRun ? (
                        <div className="grid gap-3 rounded-md border bg-white/80 p-3 text-sm md:grid-cols-2">
                          <DetailRow label="运行 ID" value={lastRun.run_id} />
                          <DetailRow label="工作流 ID" value={lastRun.workflow_id ?? '无'} />
                          <DetailRow label="工作流后端" value={lastRun.workflow_backend ? releaseWorkflowBackendLabel(lastRun.workflow_backend) : '无'} />
                          <DetailRow label="批次" value={lastRun.batch_id ?? '无'} />
                          <DetailRow label="结果" value={releaseSelfHealingDecisionLabel(lastRun.decision)} />
                          <DetailRow label="回滚" value={lastRun.rolled_back ? '已回滚' : '未回滚'} />
                          <DetailRow label="开始" value={formatChannelDateTime(lastRun.started_at)} />
                          <DetailRow label="完成" value={formatChannelDateTime(lastRun.finished_at)} />
                        </div>
                      ) : (
                        <EmptyState className="rounded-md border bg-slate-50/60 p-6" description="执行一次后会显示最近自愈结果。" title="暂无运行结果" />
                      )}
                    </div>
                  )}
                </Card>
              </div>

              <Card className="border-slate-200/80 p-4">
                <div className="mb-4">
                  <h3 className="text-sm font-semibold">最近自愈事件</h3>
                  <p className="mt-1 text-sm text-muted-foreground">策略更新、建议回滚、演练和真实回滚都会写入平台事件。</p>
                </div>
                <div className="grid gap-3">
                  {(overview?.recent_events ?? []).length === 0 ? (
                    <EmptyState className="rounded-md border bg-slate-50/60 p-6" description="保存策略或执行一次后会生成自愈事件。" title="暂无自愈事件" />
                  ) : (
                    (overview?.recent_events ?? []).map((event) => (
                      <div className="rounded-md border bg-white/80 p-3" key={event.id}>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="truncate text-sm font-medium">{event.summary ?? event.event_type}</span>
                          <StatusBadge tone={event.status === 'FAILED' ? 'unavailable' : 'healthy'}>{event.status}</StatusBadge>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                          <span>{event.event_type}</span>
                          <span>{formatChannelDateTime(event.occurred_at)}</span>
                          {event.trace_id ? <span>Trace：{event.trace_id}</span> : null}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Card>

              {!canManage || !canDeploy ? (
                <div className="rounded-md border bg-slate-50/80 px-4 py-3 text-sm text-muted-foreground">
                  当前账号需要 channel:publish:manage 保存自愈策略，需要 channel:publish:deploy 执行一次自愈。
                </div>
              ) : null}
            </>
          )}
        </div>
      </Card>
    </section>
  );
}

function RolloutProgress({ label, tone, value }: { label: string; tone: string; value: number }) {
  const normalized = Math.max(0, Math.min(100, value));

  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground">{normalized}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div className={cn('h-full rounded-full transition-all', tone)} style={{ width: `${normalized}%` }} />
      </div>
    </div>
  );
}

function PolicyToggle({
  checked,
  disabled,
  helper,
  label,
  onChange,
}: {
  checked: boolean;
  disabled: boolean;
  helper: string;
  label: string;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="grid gap-2 rounded-md border bg-white/80 p-3 text-sm">
      <span className="flex items-center justify-between gap-3">
        <span className="font-medium">{label}</span>
        <input
          checked={checked}
          className="size-4"
          disabled={disabled}
          onChange={(event) => onChange(event.target.checked)}
          type="checkbox"
        />
      </span>
      <span className="text-xs leading-5 text-muted-foreground">{helper}</span>
    </label>
  );
}

function NumberField({
  disabled,
  label,
  max,
  min,
  onChange,
  suffix,
  value,
}: {
  disabled: boolean;
  label: string;
  max: number;
  min: number;
  onChange: (value: number) => void;
  suffix: string;
  value: number;
}) {
  return (
    <label className="grid gap-1.5 text-sm">
      <span className="font-medium">{label}</span>
      <div className="flex items-center rounded-md border bg-background/80 focus-within:ring-2 focus-within:ring-ring">
        <input
          className="h-10 min-w-0 flex-1 bg-transparent px-3 text-sm outline-none disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-70"
          disabled={disabled}
          max={max}
          min={min}
          onChange={(event) => onChange(Number(event.target.value))}
          type="number"
          value={value}
        />
        <span className="border-l px-3 text-xs text-muted-foreground">{suffix}</span>
      </div>
    </label>
  );
}

function SenderTaskPanel({
  canManage,
  error,
  isRunningAutoRetry,
  isRunningCleanup,
  loading,
  onRefresh,
  onRunAutoRetry,
  onRunCleanup,
  overview,
}: {
  canManage: boolean;
  error: string | null;
  isRunningAutoRetry: boolean;
  isRunningCleanup: boolean;
  loading: boolean;
  onRefresh: () => void;
  onRunAutoRetry: () => void;
  onRunCleanup: () => void;
  overview: ChannelSenderTaskOverview | null;
}) {
  const metrics = [
    {
      helper: '满足策略且到达退避时间',
      label: '待自动重试',
      value: formatNumber(overview?.summary.pending_auto_retry_count ?? 0),
    },
    {
      helper: '超过渠道保留天数',
      label: '可清理记录',
      value: formatNumber(overview?.summary.expired_delivery_count ?? 0),
    },
    {
      helper: '已开启 auto_retry',
      label: '自动重试渠道',
      value: formatNumber(overview?.summary.auto_retry_enabled_channel_count ?? 0),
    },
    {
      helper: '当前租户失败投递',
      label: '失败投递',
      value: formatNumber(overview?.summary.failed_delivery_count ?? 0),
    },
  ];
  const hasWork = (overview?.summary.pending_auto_retry_count ?? 0) > 0 || (overview?.summary.expired_delivery_count ?? 0) > 0;

  return (
    <section className="grid gap-4">
      <Card className="overflow-hidden border-slate-200/80 bg-white/85 shadow-sm backdrop-blur">
        <div className="border-b p-4">
          <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge tone="ready">M63-11</StatusBadge>
                <StatusBadge tone={overview?.scheduler_enabled ? 'healthy' : 'planned'}>
                  {overview?.scheduler_enabled ? '任务已启用' : '任务未启用'}
                </StatusBadge>
                <StatusBadge tone={overview?.running ? 'loading' : 'mock'}>
                  {overview?.running ? '执行中' : '空闲'}
                </StatusBadge>
                {overview?.generated_at ? <StatusBadge tone="loading">生成 {formatChannelDateTime(overview.generated_at)}</StatusBadge> : null}
              </div>
              <h2 className="mt-3 text-base font-semibold">渠道投递后台任务</h2>
              <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">
                按渠道投递策略自动扫描失败投递，并按保留天数清理旧记录；手动触发会复用同一套后端策略边界。
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button disabled={loading} onClick={onRefresh} type="button" variant="outline">
                <RefreshCw className={cn('size-4', loading && 'animate-spin')} />
                刷新任务
              </Button>
              <Button disabled={!canManage || loading || isRunningAutoRetry} onClick={onRunAutoRetry} type="button" variant="outline">
                <ListRestart className={cn('size-4', isRunningAutoRetry && 'animate-spin')} />
                立即扫描重试
              </Button>
              <Button disabled={!canManage || loading || isRunningCleanup} onClick={onRunCleanup} type="button" variant="outline">
                <Trash2 className={cn('size-4', isRunningCleanup && 'animate-pulse')} />
                立即清理
              </Button>
            </div>
          </div>
        </div>

        <div className="grid gap-4 p-4">
          {error ? (
            <div className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {loading
              ? Array.from({ length: 4 }).map((_, index) => <div className="h-24 rounded-md border bg-slate-50" key={index} />)
              : metrics.map((metric) => (
                  <MetricCard helper={metric.helper} key={metric.label} label={metric.label} value={metric.value} />
                ))}
          </div>

          {!loading && !hasWork ? (
            <EmptyState
              className="rounded-md border bg-slate-50/60 p-6"
              description="当前没有到达退避时间的失败投递，也没有超过保留天数的历史记录。"
              title="后台任务暂无待处理项"
            />
          ) : null}

          <div className="grid gap-4 xl:grid-cols-[0.85fr_1.15fr]">
            <Card className="border-slate-200/80 p-4">
              <div className="mb-4">
                <h3 className="text-sm font-semibold">调度状态</h3>
                <p className="mt-1 text-sm text-muted-foreground">应用内轻量任务调度，不依赖额外中间件。</p>
              </div>
              <div className="grid gap-3 text-sm">
                <InfoRow label="任务开关" value={overview?.scheduler_enabled ? '已启用' : '未启用'} />
                <InfoRow label="运行状态" value={overview?.running ? '执行中' : '空闲'} />
                <InfoRow label="最近扫描" value={formatChannelDateTime(overview?.last_tick_at ?? null)} />
                <InfoRow
                  label="扫描间隔"
                  value={overview?.next_tick_after_seconds ? `${overview.next_tick_after_seconds} 秒` : '未配置'}
                />
                <InfoRow label="最早失败" value={formatChannelDateTime(overview?.summary.oldest_failed_at ?? null)} />
              </div>
            </Card>

            <Card className="border-slate-200/80 p-4">
              <div className="mb-4">
                <h3 className="text-sm font-semibold">最近执行结果</h3>
                <p className="mt-1 text-sm text-muted-foreground">展示最近一次自动重试和投递清理任务结果。</p>
              </div>
              <div className="grid gap-3 lg:grid-cols-2">
                <TaskResultCard result={overview?.last_auto_retry_result ?? null} title="自动重试" />
                <TaskResultCard result={overview?.last_cleanup_result ?? null} title="投递清理" />
              </div>
            </Card>
          </div>

          {!canManage ? (
            <div className="rounded-md border bg-slate-50/80 px-4 py-3 text-sm text-muted-foreground">
              当前账号缺少 channel:publish:manage 权限，只能查看任务状态，不能手动触发后台任务。
            </div>
          ) : null}
        </div>
      </Card>
    </section>
  );
}

function TaskResultCard({ result, title }: { result: ChannelSenderTaskRunResult | null; title: string }) {
  if (!result) {
    return (
      <div className="rounded-md border bg-white/80 p-4">
        <div className="mb-2 flex items-center justify-between gap-3">
          <span className="text-sm font-semibold">{title}</span>
          <StatusBadge tone="planned">暂无结果</StatusBadge>
        </div>
        <p className="text-sm leading-6 text-muted-foreground">任务启动后会显示最近一次执行摘要。</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border bg-white/80 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="text-sm font-semibold">{title}</span>
        <StatusBadge tone={taskResultTone(result.status)}>{taskResultLabel(result.status)}</StatusBadge>
      </div>
      <div className="grid gap-2 text-xs">
        <DetailRow label="扫描" value={`${result.scanned_count}`} />
        <DetailRow label="重试" value={`${result.retried_count}`} />
        <DetailRow label="成功" value={`${result.success_count}`} />
        <DetailRow label="失败" value={`${result.failed_count}`} />
        <DetailRow label="跳过" value={`${result.skipped_count}`} />
        <DetailRow label="删除" value={`${result.deleted_count}`} />
        <DetailRow label="完成" value={formatDateTime(result.finished_at)} />
      </div>
      {result.error_message ? <div className="mt-3 line-clamp-2 text-xs text-destructive">{result.error_message}</div> : null}
    </div>
  );
}

function ReleaseSchedulerPanel({
  canDeploy,
  error,
  isRunning,
  loading,
  onRefresh,
  onRun,
  overview,
}: {
  canDeploy: boolean;
  error: string | null;
  isRunning: boolean;
  loading: boolean;
  onRefresh: () => void;
  onRun: () => void;
  overview: ChannelReleaseSchedulerOverview | null;
}) {
  const lastRun = overview?.last_run ?? null;
  const metrics = [
    {
      helper: '当前租户发布渠道',
      label: '扫描范围',
      value: formatNumber(overview?.summary.total_channels ?? 0),
    },
    {
      helper: '启用自动推进策略',
      label: '推进候选',
      value: formatNumber(overview?.summary.automation_enabled_channel_count ?? 0),
    },
    {
      helper: '启用发布自愈策略',
      label: '自愈候选',
      value: formatNumber(overview?.summary.self_healing_enabled_channel_count ?? 0),
    },
    {
      helper: lastRun ? `失败 ${lastRun.failed_count} 个` : '等待首次巡检',
      label: '最近派发',
      value: formatNumber(lastRun?.dispatched_count ?? 0),
    },
  ];
  const hasCandidates = (overview?.summary.automation_enabled_channel_count ?? 0) > 0
    || (overview?.summary.self_healing_enabled_channel_count ?? 0) > 0;

  return (
    <section className="grid gap-4">
      <Card className="overflow-hidden border-slate-200/80 bg-white/85 shadow-sm backdrop-blur">
        <div className="border-b p-4">
          <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge tone="ready">M63-20</StatusBadge>
                <StatusBadge tone={overview?.scheduler_enabled ? 'healthy' : 'planned'}>
                  {overview?.scheduler_enabled ? '巡检已启用' : '巡检未启用'}
                </StatusBadge>
                <StatusBadge tone={overview?.running || isRunning ? 'loading' : 'mock'}>
                  {overview?.running || isRunning ? '执行中' : '空闲'}
                </StatusBadge>
                {lastRun ? <StatusBadge tone={schedulerStatusTone(lastRun.status)}>{schedulerStatusLabel(lastRun.status)}</StatusBadge> : null}
                {overview?.generated_at ? <StatusBadge tone="loading">生成 {formatChannelDateTime(overview.generated_at)}</StatusBadge> : null}
              </div>
              <h2 className="mt-3 text-base font-semibold">渠道发布巡检调度器</h2>
              <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">
                定时扫描已启用自动推进和发布自愈的渠道，并派发到现有 Runtime workflow 边界；调度器只负责触发，不复制发布和回滚逻辑。
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button disabled={loading} onClick={onRefresh} type="button" variant="outline">
                <RefreshCw className={cn('size-4', loading && 'animate-spin')} />
                刷新巡检
              </Button>
              <Button disabled={!canDeploy || loading || isRunning || overview?.running} onClick={onRun} type="button" variant="outline">
                <RadioTower className={cn('size-4', isRunning && 'animate-pulse')} />
                立即巡检
              </Button>
            </div>
          </div>
        </div>

        <div className="grid gap-4 p-4">
          {error ? (
            <div className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {loading
              ? Array.from({ length: 4 }).map((_, index) => <div className="h-24 rounded-md border bg-slate-50" key={index} />)
              : metrics.map((metric) => (
                  <MetricCard helper={metric.helper} key={metric.label} label={metric.label} value={metric.value} />
                ))}
          </div>

          {!loading && !hasCandidates ? (
            <EmptyState
              className="rounded-md border bg-slate-50/60 p-6"
              description="开启渠道自动推进或发布自愈策略后，巡检器会把对应渠道纳入候选队列。"
              title="暂无发布巡检候选"
            />
          ) : null}

          <div className="grid gap-4 xl:grid-cols-[0.85fr_1.15fr]">
            <Card className="border-slate-200/80 p-4">
              <div className="mb-4">
                <h3 className="text-sm font-semibold">调度状态</h3>
                <p className="mt-1 text-sm text-muted-foreground">默认关闭，开启后由 Control API 内置定时器扫描。</p>
              </div>
              <div className="grid gap-3 text-sm">
                <InfoRow label="巡检开关" value={overview?.scheduler_enabled ? '已启用' : '未启用'} />
                <InfoRow label="运行状态" value={overview?.running || isRunning ? '执行中' : '空闲'} />
                <InfoRow label="最近扫描" value={formatChannelDateTime(overview?.last_tick_at ?? null)} />
                <InfoRow label="扫描间隔" value={overview?.next_tick_after_seconds ? `${overview.next_tick_after_seconds} 秒` : '未配置'} />
                <InfoRow label="推进模式" value={overview?.workflow_modes.automation ? releaseWorkflowModeLabel(overview.workflow_modes.automation) : '本地执行'} />
                <InfoRow label="自愈模式" value={overview?.workflow_modes.self_healing ? releaseWorkflowModeLabel(overview.workflow_modes.self_healing) : '本地执行'} />
                <InfoRow label="活跃批次" value={`${overview?.summary.active_batch_channel_count ?? 0}`} />
                <InfoRow label="可回滚渠道" value={`${overview?.summary.rollback_ready_channel_count ?? 0}`} />
              </div>
            </Card>

            <Card className="border-slate-200/80 p-4">
              <div className="mb-4">
                <h3 className="text-sm font-semibold">最近巡检结果</h3>
                <p className="mt-1 text-sm text-muted-foreground">展示最近一次巡检派发到自动推进和发布自愈 workflow 的结果。</p>
              </div>
              {!lastRun ? (
                <EmptyState className="rounded-md border bg-slate-50/60 p-6" description="手动巡检或开启定时器后会生成运行结果。" title="暂无巡检结果" />
              ) : (
                <div className="grid gap-3">
                  <div className="grid gap-3 text-sm md:grid-cols-2">
                    <DetailRow label="运行 ID" value={lastRun.run_id} />
                    <DetailRow label="状态" value={schedulerStatusLabel(lastRun.status)} />
                    <DetailRow label="扫描渠道" value={`${lastRun.scanned_channel_count}`} />
                    <DetailRow label="派发任务" value={`${lastRun.dispatched_count}`} />
                    <DetailRow label="成功" value={`${lastRun.success_count}`} />
                    <DetailRow label="失败" value={`${lastRun.failed_count}`} />
                    <DetailRow label="开始" value={formatChannelDateTime(lastRun.started_at)} />
                    <DetailRow label="完成" value={formatChannelDateTime(lastRun.finished_at)} />
                  </div>
                  <div className="grid gap-2">
                    {lastRun.results.length === 0 ? (
                      <div className="rounded-md border bg-slate-50/70 px-4 py-3 text-sm text-muted-foreground">本次巡检没有需要派发的渠道。</div>
                    ) : (
                      lastRun.results.slice(0, 6).map((item) => (
                        <div className="rounded-md border bg-white/80 p-3" key={`${item.task}-${item.channel_id}`}>
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="text-sm font-medium">{item.channel_name}</span>
                            <StatusBadge tone={schedulerStatusTone(item.status)}>{schedulerStatusLabel(item.status)}</StatusBadge>
                          </div>
                          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                            <span>{item.task === 'AUTOMATION' ? '自动推进' : '发布自愈'}</span>
                            <span>{item.decision ?? '无决策'}</span>
                            <span>{item.workflow_backend ? releaseWorkflowBackendLabel(item.workflow_backend) : '无后端'}</span>
                          </div>
                          {item.error_message ? <div className="mt-2 line-clamp-2 text-xs text-destructive">{item.error_message}</div> : null}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </Card>
          </div>

          {!canDeploy ? (
            <div className="rounded-md border bg-slate-50/80 px-4 py-3 text-sm text-muted-foreground">
              当前账号缺少 channel:publish:deploy 权限，只能查看巡检状态，不能手动触发发布巡检。
            </div>
          ) : null}
        </div>
      </Card>
    </section>
  );
}

function ReleaseReportPanel({
  baseSnapshotId,
  canManage,
  channel,
  compare,
  compareError,
  compareLoading,
  detail,
  error,
  isArchiving,
  loading,
  onArchive,
  onRefresh,
  onSelectBaseSnapshot,
  onSelectSnapshot,
  onSelectTargetSnapshot,
  report,
  selectedSnapshotId,
  snapshotError,
  snapshots,
  snapshotsLoading,
  targetSnapshotId,
}: {
  baseSnapshotId: string | null;
  canManage: boolean;
  channel: PublishChannelListItem | null;
  compare: ChannelReleaseReportSnapshotCompareResult | null;
  compareError: string | null;
  compareLoading: boolean;
  detail: ChannelReleaseReportSnapshotDetail | null;
  error: string | null;
  isArchiving: boolean;
  loading: boolean;
  onArchive: () => void;
  onRefresh: () => void;
  onSelectBaseSnapshot: (snapshotId: string | null) => void;
  onSelectSnapshot: (snapshotId: string | null) => void;
  onSelectTargetSnapshot: (snapshotId: string | null) => void;
  report: ChannelReleaseReport | null;
  selectedSnapshotId: string | null;
  snapshotError: string | null;
  snapshots: ChannelReleaseReportSnapshotOverview | null;
  snapshotsLoading: boolean;
  targetSnapshotId: string | null;
}) {
  const metrics = report?.metrics ?? [];
  const risks = report?.risks ?? [];
  const timeline = report?.timeline ?? [];
  const snapshotItems = snapshots?.items ?? [];
  const baseSnapshot = snapshotItems.find((item) => item.snapshot_id === baseSnapshotId) ?? compare?.base_snapshot ?? null;
  const targetSnapshot = snapshotItems.find((item) => item.snapshot_id === targetSnapshotId) ?? compare?.target_snapshot ?? null;

  return (
    <section className="grid gap-4">
      <Card className="overflow-hidden border-slate-200/80 bg-white/85 shadow-sm backdrop-blur">
        <div className="border-b p-4">
          <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge tone="ready">M63-22</StatusBadge>
                <StatusBadge tone={report ? reportSeverityTone(report.summary.incident_level) : 'planned'}>
                  {report ? reportSeverityLabel(report.summary.incident_level) : '未生成'}
                </StatusBadge>
                <StatusBadge tone="planned">快照 {snapshots?.total ?? 0}</StatusBadge>
                <StatusBadge tone={baseSnapshotId && targetSnapshotId && baseSnapshotId !== targetSnapshotId ? 'ready' : 'planned'}>
                  M63-23 版本对比
                </StatusBadge>
                {report ? <StatusBadge tone="loading">近 {report.report_window_hours} 小时</StatusBadge> : null}
                {report?.generated_at ? <StatusBadge tone="loading">生成 {formatChannelDateTime(report.generated_at)}</StatusBadge> : null}
              </div>
              <h2 className="mt-3 text-base font-semibold">渠道发布复盘与变更报告</h2>
              <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">
                汇总发布批次、审批、灰度、自动推进、自愈、巡检事件和用量信号，形成可审计的中文复盘报告。
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button disabled={loading || !channel} onClick={onRefresh} type="button" variant="outline">
                <RefreshCw className={cn('size-4', loading && 'animate-spin')} />
                刷新报告
              </Button>
              <Button disabled={!canManage || !report || isArchiving || !channel} onClick={onArchive} type="button">
                <Save className={cn('size-4', isArchiving && 'animate-pulse')} />
                归档快照
              </Button>
            </div>
          </div>
        </div>

        <div className="grid gap-4 p-4">
          {!channel ? (
            <EmptyState description="请选择一个发布渠道后查看复盘报告。" title="未选择渠道" />
          ) : (
            <>
              {error ? (
                <div className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                  {error}
                </div>
              ) : null}
              {snapshotError ? (
                <div className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                  {snapshotError}
                </div>
              ) : null}
              {compareError ? (
                <div className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                  {compareError}
                </div>
              ) : null}

              {loading ? (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  {Array.from({ length: 4 }).map((_, index) => <div className="h-24 rounded-md border bg-slate-50" key={index} />)}
                </div>
              ) : !report ? (
                <EmptyState className="rounded-md border bg-slate-50/60 p-6" description="报告生成后会展示复盘结论、风险和时间线。" title="暂无复盘报告" />
              ) : (
                <>
                  <Card className="border-slate-200/80 p-4">
                    <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-start">
                      <div>
                        <h3 className="text-sm font-semibold">复盘结论</h3>
                        <p className="mt-2 max-w-4xl text-sm leading-6 text-muted-foreground">{report.summary.conclusion}</p>
                      </div>
                      <StatusBadge tone={reportSeverityTone(report.summary.incident_level)}>
                        {reportSeverityLabel(report.summary.incident_level)}
                      </StatusBadge>
                    </div>
                    <div className="mt-4 grid gap-3 text-sm md:grid-cols-2 xl:grid-cols-4">
                      <InfoRow label="渠道状态" value={publishChannelStatusLabel(report.summary.publish_status)} />
                      <InfoRow label="健康状态" value={publishChannelHealthLabel(report.summary.health_status)} />
                      <InfoRow label="审批状态" value={publishApprovalStatusLabel(report.summary.approval_status)} />
                      <InfoRow label="灰度状态" value={publishRolloutStatusLabel(report.summary.rollout_status)} />
                      <InfoRow label="当前批次" value={report.summary.current_batch_title ?? '无'} />
                      <InfoRow label="回滚点" value={report.summary.rollback_available ? '可回滚' : '不可用'} />
                      <InfoRow label="最近推进" value={report.summary.last_automation_decision ? releaseAutomationDecisionLabel(report.summary.last_automation_decision) : '无'} />
                      <InfoRow label="最近自愈" value={report.summary.last_self_healing_decision ? releaseSelfHealingDecisionLabel(report.summary.last_self_healing_decision) : '无'} />
                    </div>
                  </Card>

                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {metrics.map((metric) => (
                      <MetricCard helper={metric.helper} key={metric.label} label={metric.label} value={metric.value} />
                    ))}
                  </div>

                  <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
                    <Card className="border-slate-200/80 p-4">
                      <div className="mb-4">
                        <h3 className="text-sm font-semibold">风险与建议</h3>
                        <p className="mt-1 text-sm text-muted-foreground">按当前窗口的失败事件、回滚点和自动化结果生成。</p>
                      </div>
                      <div className="grid gap-3">
                        {risks.map((risk) => (
                          <div className="rounded-md border bg-white/80 p-3" key={risk.title}>
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <span className="text-sm font-medium">{risk.title}</span>
                              <StatusBadge tone={reportSeverityTone(risk.severity)}>{reportSeverityLabel(risk.severity)}</StatusBadge>
                            </div>
                            <p className="mt-2 text-sm leading-6 text-muted-foreground">{risk.description}</p>
                            <p className="mt-2 text-sm leading-6 text-foreground">{risk.recommendation}</p>
                          </div>
                        ))}
                      </div>
                  </Card>

                  <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
                    <Card className="border-slate-200/80 p-4">
                      <div className="mb-4">
                        <h3 className="text-sm font-semibold">报告快照归档</h3>
                        <p className="mt-1 text-sm text-muted-foreground">快照保存到平台事件，保留生成时的报告正文和风险结论。</p>
                      </div>
                      {snapshotsLoading && !snapshots ? (
                        <div className="h-28 rounded-md border bg-slate-50" />
                      ) : (snapshots?.items.length ?? 0) === 0 ? (
                        <EmptyState className="rounded-md border bg-slate-50/60 p-6" description="点击归档快照后会在这里显示历史版本。" title="暂无报告快照" />
                      ) : (
                        <div className="grid gap-2">
                          {snapshotItems.slice(0, 8).map((item) => (
                            <div
                              className={cn(
                                'rounded-md border bg-white/80 p-3 text-left transition hover:bg-slate-50',
                                selectedSnapshotId === item.snapshot_id && 'border-primary/50 bg-primary/5',
                                baseSnapshotId === item.snapshot_id && 'ring-1 ring-blue-300',
                                targetSnapshotId === item.snapshot_id && 'ring-1 ring-emerald-300',
                              )}
                              key={item.snapshot_id}
                            >
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <span className="truncate text-sm font-medium">{item.channel_name}</span>
                                <div className="flex flex-wrap items-center gap-2">
                                  {baseSnapshotId === item.snapshot_id ? <StatusBadge tone="loading">基准</StatusBadge> : null}
                                  {targetSnapshotId === item.snapshot_id ? <StatusBadge tone="healthy">对比</StatusBadge> : null}
                                  <StatusBadge tone={reportSeverityTone(item.incident_level)}>{reportSeverityLabel(item.incident_level)}</StatusBadge>
                                </div>
                              </div>
                              <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">{item.conclusion}</p>
                              <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                                <span>{formatChannelDateTime(item.created_at)}</span>
                                <span>{item.snapshot_id}</span>
                              </div>
                              <div className="mt-3 flex flex-wrap gap-2">
                                <Button
                                  onClick={() => onSelectSnapshot(item.snapshot_id)}
                                  size="sm"
                                  type="button"
                                  variant={selectedSnapshotId === item.snapshot_id ? 'default' : 'outline'}
                                >
                                  查看
                                </Button>
                                <Button
                                  onClick={() => onSelectBaseSnapshot(baseSnapshotId === item.snapshot_id ? null : item.snapshot_id)}
                                  size="sm"
                                  type="button"
                                  variant={baseSnapshotId === item.snapshot_id ? 'default' : 'outline'}
                                >
                                  设为基准
                                </Button>
                                <Button
                                  onClick={() => onSelectTargetSnapshot(targetSnapshotId === item.snapshot_id ? null : item.snapshot_id)}
                                  size="sm"
                                  type="button"
                                  variant={targetSnapshotId === item.snapshot_id ? 'default' : 'outline'}
                                >
                                  设为对比
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      {!canManage ? (
                        <div className="mt-3 rounded-md border bg-slate-50/80 px-4 py-3 text-sm text-muted-foreground">
                          当前账号缺少 channel:publish:manage 权限，只能查看快照，不能归档新报告。
                        </div>
                      ) : null}
                    </Card>

                    <Card className="border-slate-200/80 p-4">
                      <div className="mb-4">
                        <h3 className="text-sm font-semibold">快照详情</h3>
                        <p className="mt-1 text-sm text-muted-foreground">查看归档时刻的不可变报告正文。</p>
                      </div>
                      {!selectedSnapshotId ? (
                        <EmptyState className="rounded-md border bg-slate-50/60 p-6" description="选择左侧快照后查看归档正文。" title="未选择快照" />
                      ) : snapshotsLoading && !detail ? (
                        <div className="h-40 rounded-md border bg-slate-50" />
                      ) : detail ? (
                        <div className="grid gap-3">
                          <div className="grid gap-3 text-sm md:grid-cols-2">
                            <DetailRow label="快照 ID" value={detail.snapshot_id} />
                            <DetailRow label="归档时间" value={formatChannelDateTime(detail.created_at)} />
                            <DetailRow label="风险等级" value={reportSeverityLabel(detail.incident_level)} />
                            <DetailRow label="事件 ID" value={detail.event_id} />
                          </div>
                          <pre className="max-h-64 overflow-auto rounded-md border bg-slate-950 p-4 text-xs leading-6 text-slate-100">
                            {detail.report.markdown}
                          </pre>
                        </div>
                      ) : (
                        <EmptyState className="rounded-md border bg-slate-50/60 p-6" description="快照详情暂不可用。" title="快照未加载" />
                      )}
                    </Card>
                  </div>

                  <SnapshotComparePanel
                    baseSnapshot={baseSnapshot}
                    baseSnapshotId={baseSnapshotId}
                    compare={compare}
                    loading={compareLoading}
                    snapshotCount={snapshotItems.length}
                    targetSnapshot={targetSnapshot}
                    targetSnapshotId={targetSnapshotId}
                  />

                  <Card className="border-slate-200/80 p-4">
                      <div className="mb-4">
                        <h3 className="text-sm font-semibold">关键时间线</h3>
                        <p className="mt-1 text-sm text-muted-foreground">按事件发生时间倒序展示渠道发布相关事件。</p>
                      </div>
                      <div className="grid gap-3">
                        {timeline.length === 0 ? (
                          <EmptyState className="rounded-md border bg-slate-50/60 p-6" description="近窗口内暂无发布相关事件。" title="暂无时间线" />
                        ) : (
                          timeline.slice(0, 10).map((item) => (
                            <div className="rounded-md border bg-white/80 p-3" key={item.id}>
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <span className="text-sm font-medium">{item.title}</span>
                                <StatusBadge tone={item.status === 'FAILED' ? 'unavailable' : 'healthy'}>{item.status}</StatusBadge>
                              </div>
                              <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                                <span>{formatChannelDateTime(item.occurred_at)}</span>
                                <span>{item.event_type}</span>
                                {item.trace_id ? <span>Trace：{item.trace_id}</span> : null}
                              </div>
                              {item.summary ? <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.summary}</p> : null}
                            </div>
                          ))
                        )}
                      </div>
                    </Card>
                  </div>

                  <Card className="border-slate-200/80 p-4">
                    <div className="mb-4">
                      <h3 className="text-sm font-semibold">报告正文</h3>
                      <p className="mt-1 text-sm text-muted-foreground">可用于变更评审、事故复盘和审计归档。</p>
                    </div>
                    <pre className="max-h-96 overflow-auto rounded-md border bg-slate-950 p-4 text-xs leading-6 text-slate-100">
                      {report.markdown}
                    </pre>
                  </Card>
                </>
              )}
            </>
          )}
        </div>
      </Card>
    </section>
  );
}

function SnapshotComparePanel({
  baseSnapshot,
  baseSnapshotId,
  compare,
  loading,
  snapshotCount,
  targetSnapshot,
  targetSnapshotId,
}: {
  baseSnapshot: ChannelReleaseReportSnapshotCompareResult['base_snapshot'] | null;
  baseSnapshotId: string | null;
  compare: ChannelReleaseReportSnapshotCompareResult | null;
  loading: boolean;
  snapshotCount: number;
  targetSnapshot: ChannelReleaseReportSnapshotCompareResult['target_snapshot'] | null;
  targetSnapshotId: string | null;
}) {
  const sameSnapshotSelected = Boolean(baseSnapshotId && targetSnapshotId && baseSnapshotId === targetSnapshotId);
  const readyToCompare = Boolean(baseSnapshotId && targetSnapshotId && !sameSnapshotSelected);
  const waitingForResult = readyToCompare && !loading && !compare;
  const totalDiffs = compare
    ? compare.summary_diffs.length + compare.metric_diffs.length + compare.risk_diffs.length + compare.timeline_diffs.length
    : 0;

  return (
    <Card className="border-slate-200/80 p-4">
      <div className="mb-4 flex flex-col justify-between gap-3 lg:flex-row lg:items-start">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge tone="ready">M63-23</StatusBadge>
            <StatusBadge tone={readyToCompare ? 'healthy' : 'planned'}>{readyToCompare ? '已选择版本' : '等待选择'}</StatusBadge>
            {compare?.generated_at ? <StatusBadge tone="loading">对比 {formatChannelDateTime(compare.generated_at)}</StatusBadge> : null}
          </div>
          <h3 className="mt-3 text-sm font-semibold">报告版本对比</h3>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">
            对比两个归档快照中的复盘摘要、关键指标、风险建议和时间线，帮助审计发布风险是否扩大或收敛。
          </p>
        </div>
        <div className="grid min-w-0 gap-2 text-xs text-muted-foreground lg:min-w-80">
          <SnapshotCompareSelection label="基准快照" snapshot={baseSnapshot} snapshotId={baseSnapshotId} />
          <SnapshotCompareSelection label="对比快照" snapshot={targetSnapshot} snapshotId={targetSnapshotId} />
        </div>
      </div>

      {snapshotCount < 2 ? (
        <EmptyState className="rounded-md border bg-slate-50/60 p-6" description="至少需要两个归档快照才能进行版本对比。" title="快照数量不足" />
      ) : !baseSnapshotId ? (
        <EmptyState className="rounded-md border bg-slate-50/60 p-6" description="请在快照列表中选择一个历史版本作为基准快照。" title="未选择基准快照" />
      ) : !targetSnapshotId ? (
        <EmptyState className="rounded-md border bg-slate-50/60 p-6" description="请在快照列表中选择一个目标版本作为对比快照。" title="未选择对比快照" />
      ) : sameSnapshotSelected ? (
        <EmptyState className="rounded-md border bg-slate-50/60 p-6" description="基准快照和对比快照不能是同一个版本。" title="请选择两个不同快照" />
      ) : loading && !compare ? (
        <div className="grid gap-4">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => <div className="h-24 rounded-md border bg-slate-50" key={index} />)}
          </div>
          <div className="h-52 rounded-md border bg-slate-50" />
        </div>
      ) : waitingForResult ? (
        <div className="grid gap-4">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => <div className="h-24 rounded-md border bg-slate-50" key={index} />)}
          </div>
          <div className="h-52 rounded-md border bg-slate-50" />
        </div>
      ) : compare ? (
        <div className="grid gap-4">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard helper="所有字段、指标、建议和事件变化" label="变更" value={`${compare.summary.changed_count}`} />
            <MetricCard helper="目标版本新增内容" label="新增" value={`${compare.summary.added_count}`} />
            <MetricCard helper="目标版本移除内容" label="移除" value={`${compare.summary.removed_count}`} />
            <MetricCard helper="严重等级差异数量" label="严重差异" value={`${compare.summary.critical_change_count}`} />
          </div>

          <div className="rounded-md border bg-slate-50/70 p-3 text-sm leading-6 text-muted-foreground">
            {compare.summary.conclusion}
          </div>

          {totalDiffs === 0 ? (
            <EmptyState className="rounded-md border bg-slate-50/60 p-6" description="两个快照在当前对比范围内没有发现差异。" title="版本无差异" />
          ) : (
            <div className="grid gap-4 xl:grid-cols-2">
              <SnapshotDiffGroup items={compare.summary_diffs} title="摘要差异" />
              <SnapshotDiffGroup items={compare.metric_diffs} title="指标差异" />
              <SnapshotDiffGroup items={compare.risk_diffs} title="风险建议差异" />
              <SnapshotDiffGroup items={compare.timeline_diffs} title="时间线差异" />
            </div>
          )}
        </div>
      ) : null}
    </Card>
  );
}

function SnapshotCompareSelection({
  label,
  snapshot,
  snapshotId,
}: {
  label: string;
  snapshot: ChannelReleaseReportSnapshotCompareResult['base_snapshot'] | null;
  snapshotId: string | null;
}) {
  return (
    <div className="grid grid-cols-[72px_1fr] gap-2 rounded-md border bg-white/75 px-3 py-2">
      <span>{label}</span>
      <span className="min-w-0 truncate font-medium text-foreground">
        {snapshot ? `${formatChannelDateTime(snapshot.created_at)} / ${reportSeverityLabel(snapshot.incident_level)}` : snapshotId ?? '未选择'}
      </span>
    </div>
  );
}

function SnapshotDiffGroup({ items, title }: { items: ChannelReleaseReportSnapshotCompareResult['summary_diffs']; title: string }) {
  return (
    <Card className="border-slate-200/80 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h4 className="text-sm font-semibold">{title}</h4>
          <p className="mt-1 text-xs text-muted-foreground">共 {items.length} 条差异。</p>
        </div>
        <StatusBadge tone={items.length > 0 ? 'loading' : 'healthy'}>{items.length > 0 ? '有变化' : '无变化'}</StatusBadge>
      </div>
      {items.length === 0 ? (
        <EmptyState className="rounded-md border bg-slate-50/60 p-5" description="该分组没有发现变化。" title="无差异" />
      ) : (
        <div className="grid gap-3">
          {items.map((item) => (
            <SnapshotDiffRow item={item} key={`${item.field}-${item.label}`} />
          ))}
        </div>
      )}
    </Card>
  );
}

function SnapshotDiffRow({ item }: { item: ChannelReleaseReportSnapshotCompareResult['summary_diffs'][number] }) {
  return (
    <div
      className={cn(
        'rounded-md border bg-white/80 p-3',
        item.severity === 'CRITICAL' && 'border-red-200 bg-red-50/60',
        item.severity === 'WARN' && 'border-amber-200 bg-amber-50/60',
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate text-sm font-medium">{item.label}</div>
          <div className="mt-1 text-xs text-muted-foreground">{item.field}</div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge tone={diffKindTone(item.kind)}>{diffKindLabel(item.kind)}</StatusBadge>
          <StatusBadge tone={reportSeverityTone(item.severity)}>{reportSeverityLabel(item.severity)}</StatusBadge>
        </div>
      </div>
      <div className="mt-3 grid gap-2 text-xs md:grid-cols-2">
        <div className="rounded-md border bg-white/70 p-2">
          <div className="mb-1 text-muted-foreground">变更前</div>
          <div className="break-words font-medium">{item.before ?? '无'}</div>
        </div>
        <div className="rounded-md border bg-white/70 p-2">
          <div className="mb-1 text-muted-foreground">变更后</div>
          <div className="break-words font-medium">{item.after ?? '无'}</div>
        </div>
      </div>
    </div>
  );
}

function SenderDeliveryCenter({
  allChannels,
  canManage,
  deliveries,
  detail,
  detailLoading,
  error,
  isRetrying,
  loading,
  onAllChannelsChange,
  onProviderChange,
  onRefresh,
  onRetry,
  onSelectDelivery,
  onStatusChange,
  provider,
  selectedChannel,
  selectedDeliveryId,
  status,
  total,
}: {
  allChannels: boolean;
  canManage: boolean;
  deliveries: ChannelSenderDeliveryListItem[];
  detail: ChannelSenderDeliveryDetail | null;
  detailLoading: boolean;
  error: string | null;
  isRetrying: boolean;
  loading: boolean;
  onAllChannelsChange: (value: boolean) => void;
  onProviderChange: (value: string) => void;
  onRefresh: () => void;
  onRetry: (deliveryId: string) => void;
  onSelectDelivery: (deliveryId: string) => void;
  onStatusChange: (value: string) => void;
  provider: string;
  selectedChannel: PublishChannelListItem | null;
  selectedDeliveryId: string | null;
  status: string;
  total: number;
}) {
  const metrics = buildSenderDeliveryMetrics(deliveries, total);

  return (
    <section className="grid gap-4">
      <Card className="overflow-hidden border-slate-200/80 bg-white/85 shadow-sm backdrop-blur">
        <div className="border-b p-4">
          <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge tone="ready">M63-9</StatusBadge>
                <StatusBadge tone="healthy">Sender 投递中心</StatusBadge>
              </div>
              <h2 className="mt-3 text-base font-semibold">主动回复投递</h2>
              <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">
                记录企业微信、钉钉、飞书、Slack 和自定义 Webhook 的主动回复发送结果，支持查看请求响应、Trace 上下文和失败重试。
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button disabled={loading} onClick={onRefresh} type="button" variant="outline">
                <RefreshCw className={cn('size-4', loading && 'animate-spin')} />
                刷新投递
              </Button>
            </div>
          </div>
        </div>

        <div className="grid gap-4 p-4">
          {error ? (
            <div className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {loading
              ? Array.from({ length: 5 }).map((_, index) => <div className="h-24 rounded-md border bg-slate-50" key={index} />)
              : metrics.map((metric) => (
                  <MetricCard helper={metric.helper} key={metric.label} label={metric.label} value={metric.value} />
                ))}
          </div>

          <div className="flex flex-col justify-between gap-3 rounded-md border bg-slate-50/70 p-3 lg:flex-row lg:items-center">
            <div className="flex flex-wrap items-center gap-2">
              <label className="inline-flex items-center gap-2 rounded-md border bg-white px-3 py-2 text-sm">
                <input
                  checked={allChannels}
                  className="size-4"
                  onChange={(event) => onAllChannelsChange(event.target.checked)}
                  type="checkbox"
                />
                查看全部渠道
              </label>
              <SelectFilter
                label="投递状态"
                onChange={onStatusChange}
                value={status}
                values={channelSenderDeliveryStatuses.map((item) => ({
                  label: channelSenderDeliveryLabel(item),
                  value: item,
                }))}
              />
              <SelectFilter
                label="平台"
                onChange={onProviderChange}
                value={provider}
                values={channelSenderProviders.map((item) => ({
                  label: channelProviderLabel(item),
                  value: item,
                }))}
              />
            </div>
            <div className="text-sm text-muted-foreground">
              {allChannels ? '当前显示全部可见渠道' : `当前渠道：${selectedChannel?.name ?? '未选择'}`}，共 {total} 条。
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-[1.08fr_0.92fr]">
            <Card className="overflow-hidden border-slate-200/80">
              <div className="flex items-center justify-between gap-3 border-b p-4">
                <div>
                  <h3 className="text-sm font-semibold">最近投递记录</h3>
                  <p className="mt-1 text-sm text-muted-foreground">点击记录查看请求、响应和重试链路。</p>
                </div>
                <StatusBadge tone="mock">{total} 条</StatusBadge>
              </div>

              <div className="grid gap-3 p-4">
                {loading ? (
                  Array.from({ length: 4 }).map((_, index) => <div className="h-28 rounded-md border bg-muted/30" key={index} />)
                ) : deliveries.length === 0 ? (
                  <EmptyState
                    description="当前筛选条件下没有主动回复投递记录。完成一次异步回复或同步主动发送后，这里会出现审计记录。"
                    title="暂无投递记录"
                  />
                ) : (
                  deliveries.map((item, index) => (
                    <motion.div
                      animate={{ opacity: 1, y: 0 }}
                      initial={{ opacity: 0, y: 8 }}
                      key={item.id}
                      transition={{ delay: index * 0.02, duration: 0.18 }}
                    >
                      <SenderDeliveryRow
                        canManage={canManage}
                        item={item}
                        onCopy={(value) => void copyText(value)}
                        onOpen={() => onSelectDelivery(item.delivery_id)}
                        onRetry={() => onRetry(item.delivery_id)}
                        retrying={isRetrying}
                        selected={selectedDeliveryId === item.delivery_id}
                      />
                    </motion.div>
                  ))
                )}
              </div>
            </Card>

            <Card className="grid gap-4 border-slate-200/80 p-4">
              <div>
                <h3 className="text-sm font-semibold">投递详情</h3>
                <p className="mt-1 text-sm text-muted-foreground">用于排查平台响应、签名头、Trace 和运行链路。</p>
              </div>

              {!selectedDeliveryId ? (
                <EmptyState description="先选择一条投递记录查看详情。" title="未选择投递" />
              ) : detailLoading ? (
                <div className="grid gap-3">
                  <div className="h-24 rounded-md border bg-muted/30" />
                  <div className="h-36 rounded-md border bg-muted/30" />
                  <div className="h-28 rounded-md border bg-muted/30" />
                </div>
              ) : detail ? (
                <SenderDeliveryDetailCard
                  canManage={canManage}
                  item={detail}
                  onCopy={(value) => void copyText(value)}
                  onRetry={() => onRetry(detail.delivery_id)}
                  retrying={isRetrying}
                />
              ) : (
                <EmptyState description="投递详情加载失败或没有权限查看。" title="详情不可用" />
              )}
            </Card>
          </div>
        </div>
      </Card>
    </section>
  );
}

function SenderDeliveryRow({
  canManage,
  item,
  onCopy,
  onOpen,
  onRetry,
  retrying,
  selected,
}: {
  canManage: boolean;
  item: ChannelSenderDeliveryListItem;
  onCopy: (value: string) => void;
  onOpen: () => void;
  onRetry: () => void;
  retrying: boolean;
  selected: boolean;
}) {
  return (
    <div
      className={cn(
        'grid gap-3 rounded-md border bg-background/90 p-4 text-left shadow-sm transition-colors hover:bg-slate-50/80',
        selected && 'border-blue-300 bg-blue-50/60',
      )}
      onClick={onOpen}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onOpen();
        }
      }}
      role="button"
      tabIndex={0}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge tone={channelSenderDeliveryTone(item.status)}>{channelSenderDeliveryLabel(item.status)}</StatusBadge>
            <StatusBadge tone="mock">{channelProviderLabel(item.provider)}</StatusBadge>
            <span className="truncate text-sm font-semibold">{item.channel_name}</span>
            <span className="font-mono text-xs text-muted-foreground">{item.response_status ?? '无响应码'}</span>
          </div>
          <div className="mt-2 grid gap-1 text-xs text-muted-foreground md:grid-cols-2">
            <span className="truncate">Agent：{item.agent_name ?? item.agent_id}</span>
            <span className="truncate">目标：{item.target ?? '未配置目标'}</span>
            <span className="truncate">投递 ID：{item.delivery_id}</span>
            <span className="truncate">父级：{item.parent_delivery_id ?? '无'}</span>
            <span>耗时：{formatLatency(item.latency_ms)}</span>
            <span>时间：{formatDateTime(item.delivered_at ?? item.created_at)}</span>
          </div>
          {item.error_message ? <div className="mt-2 line-clamp-2 text-xs text-destructive">{item.error_message}</div> : null}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <div className="flex flex-wrap justify-end gap-2">
            <StatusBadge tone="mock">重试 {item.retry_count} 次</StatusBadge>
            {item.trace_id ? <StatusBadge tone="loading">Trace</StatusBadge> : null}
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <Button
              onClick={(event) => {
                event.stopPropagation();
                onCopy(item.delivery_id);
              }}
              size="sm"
              type="button"
              variant="outline"
            >
              <Copy className="size-4" />
              复制
            </Button>
            <Button
              disabled={!canManage || item.status !== 'FAILED' || retrying}
              onClick={(event) => {
                event.stopPropagation();
                onRetry();
              }}
              size="sm"
              type="button"
              variant="outline"
            >
              <RotateCcw className={cn('size-4', retrying && 'animate-spin')} />
              重试
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SenderDeliveryDetailCard({
  canManage,
  item,
  onCopy,
  onRetry,
  retrying,
}: {
  canManage: boolean;
  item: ChannelSenderDeliveryDetail;
  onCopy: (value: string) => void;
  onRetry: () => void;
  retrying: boolean;
}) {
  return (
    <div className="grid gap-4">
      <div className="grid gap-2 rounded-md border bg-slate-50/80 p-3 text-xs">
        <DetailRow label="投递 ID" value={item.delivery_id} />
        <DetailRow label="父级投递 ID" value={item.parent_delivery_id ?? '无'} />
        <DetailRow label="渠道" value={`${item.channel_name} / ${publishChannelTypeLabel(item.channel_type)}`} />
        <DetailRow label="Agent" value={item.agent_name ?? item.agent_id} />
        <DetailRow label="平台" value={channelProviderLabel(item.provider)} />
        <DetailRow label="目标" value={item.target ?? '未配置'} />
        <DetailRow label="状态" value={channelSenderDeliveryLabel(item.status)} />
        <DetailRow label="响应状态码" value={item.response_status === null ? '无' : `${item.response_status}`} />
        <DetailRow label="耗时" value={formatLatency(item.latency_ms)} />
        <DetailRow label="重试次数" value={`${item.retry_count}`} />
        <DetailRow label="会话 ID" value={item.conversation_id ?? '无'} />
        <DetailRow label="运行 ID" value={item.run_id ?? '无'} />
        <DetailRow label="Trace ID" value={item.trace_id ?? '无'} />
        <DetailRow label="外部会话" value={item.external_conversation_id ?? '无'} />
        <DetailRow label="外部消息" value={item.external_message_id ?? '无'} />
        <DetailRow label="投递时间" value={formatDateTime(item.delivered_at ?? item.created_at)} />
        <DetailRow label="更新时间" value={formatDateTime(item.updated_at)} />
      </div>

      <div className="grid gap-2">
        <div className="text-sm font-semibold">请求头</div>
        <pre className="max-h-52 overflow-auto rounded-md border bg-slate-950 px-3 py-3 text-xs leading-6 text-slate-100">
{stringifyPretty(item.request_headers)}
        </pre>
      </div>

      <div className="grid gap-2">
        <div className="text-sm font-semibold">请求正文</div>
        <pre className="max-h-72 overflow-auto rounded-md border bg-slate-950 px-3 py-3 text-xs leading-6 text-slate-100">
{stringifyPretty(item.request_body)}
        </pre>
      </div>

      <div className="grid gap-2">
        <div className="text-sm font-semibold">响应正文</div>
        <pre className="max-h-52 overflow-auto rounded-md border bg-slate-950 px-3 py-3 text-xs leading-6 text-slate-100">
{item.response_body ?? '无响应正文'}
        </pre>
      </div>

      {item.error_message ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {item.error_message}
        </div>
      ) : null}

      <div className="flex flex-wrap justify-end gap-2">
        <Button onClick={() => onCopy(item.delivery_id)} type="button" variant="outline">
          <Copy className="size-4" />
          复制投递 ID
        </Button>
        <Button disabled={!canManage || item.status !== 'FAILED' || retrying} onClick={onRetry} type="button" variant="outline">
          <RotateCcw className={cn('size-4', retrying && 'animate-spin')} />
          重试失败投递
        </Button>
      </div>
    </div>
  );
}

function ChannelMixPanel({
  mix,
}: {
  mix: Array<{ channel: PublishChannelType; total: number; active: number; requests_24h: number }>;
}) {
  const maxRequests = Math.max(...mix.map((item) => item.requests_24h), 1);

  return (
    <Card className="p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">渠道类型分布</h2>
          <p className="mt-1 text-sm text-muted-foreground">按类型统计启用数量和 24 小时请求。</p>
        </div>
        <Signal className="size-4 text-muted-foreground" />
      </div>
      {mix.length === 0 ? (
        <EmptyState className="p-5" description="暂无渠道类型分布。" title="无分布数据" />
      ) : (
        <div className="grid gap-3">
          {mix.map((item) => (
            <div className="grid gap-2" key={item.channel}>
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="font-medium">{publishChannelTypeLabel(item.channel)}</span>
                <span className="text-xs text-muted-foreground">
                  {item.active}/{item.total} 启用，{formatNumber(item.requests_24h)} 请求
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-blue-500"
                  style={{ width: `${Math.max(6, (item.requests_24h / maxRequests) * 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function RecentEventsPanel({ events }: { events: PlatformEventListItem[] }) {
  return (
    <Card className="p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">最近渠道事件</h2>
          <p className="mt-1 text-sm text-muted-foreground">保存、启停、健康检查会写入平台事件。</p>
        </div>
        <Activity className="size-4 text-muted-foreground" />
      </div>
      {events.length === 0 ? (
        <EmptyState className="p-5" description="暂无渠道事件。" title="无事件记录" />
      ) : (
        <div className="grid gap-3">
          {events.slice(0, 8).map((event) => (
            <div className="rounded-md border bg-white/70 p-3" key={event.id}>
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="truncate font-medium">{event.summary}</span>
                <StatusBadge tone={event.status === 'FAILED' ? 'unavailable' : 'healthy'}>{event.status}</StatusBadge>
              </div>
              <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <span>{event.event_type}</span>
                <span>{formatDateTime(event.occurred_at)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function ChannelOperationsNav({
  activeModule,
  modules,
  onChange,
}: {
  activeModule: ChannelOperationsModule;
  modules: Array<{ description: string; label: string; value: ChannelOperationsModule }>;
  onChange: (module: ChannelOperationsModule) => void;
}) {
  return (
    <Card className="overflow-hidden p-2">
      <div className="grid gap-2 md:grid-cols-3 xl:grid-cols-9">
        {modules.map((module) => (
          <button
            className={cn(
              'grid min-h-20 content-start gap-1 rounded-md border px-3 py-2 text-left transition-colors',
              activeModule === module.value
                ? 'border-blue-300 bg-blue-50 text-blue-700'
                : 'border-transparent bg-transparent text-muted-foreground hover:border-slate-200 hover:bg-slate-50',
            )}
            key={module.value}
            onClick={() => onChange(module.value)}
            type="button"
          >
            <span className="text-sm font-semibold">{module.label}</span>
            <span className="text-xs leading-5">{module.description}</span>
          </button>
        ))}
      </div>
    </Card>
  );
}

function ChannelOperationsPanel({
  accounts,
  agents,
  allChannels,
  canDisable,
  canManage,
  editMode,
  error,
  formActionLoading,
  items,
  itemActionLoading,
  jobActionLoading,
  jobDetailLoading,
  keyword,
  loading,
  module,
  onAllChannelsChange,
  onCancelJob,
  onCancelOperationsEdit,
  onCreateOperationsItem,
  onDeleteOperationsItem,
  onDisableOperationsItem,
  onEditOperationsItem,
  onEnableOperationsItem,
  onKeywordChange,
  onModuleChange,
  onProviderChange,
  onRefresh,
  onRefreshJob,
  onRetryJob,
  onSelectItem,
  onStatusChange,
  onSubmitAccount,
  onSubmitProvider,
  onSubmitRouteRule,
  onSubmitTemplate,
  overviewItems,
  provider,
  providers,
  providerOptions,
  selectedChannel,
  selectedItem,
  status,
  total,
}: {
  accounts: ChannelAccountItem[];
  agents: AgentListItem[];
  allChannels: boolean;
  canDisable: boolean;
  canManage: boolean;
  editMode: ChannelOperationsEditMode;
  error: boolean;
  formActionLoading: boolean;
  items: ChannelOperationsItem[];
  itemActionLoading: boolean;
  jobActionLoading: boolean;
  jobDetailLoading: boolean;
  keyword: string;
  loading: boolean;
  module: ChannelOperationsModule;
  onAllChannelsChange: (value: boolean) => void;
  onCancelJob: (jobId: string) => void;
  onCancelOperationsEdit: () => void;
  onCreateOperationsItem: () => void;
  onDeleteOperationsItem: () => void;
  onDisableOperationsItem: () => void;
  onEditOperationsItem: () => void;
  onEnableOperationsItem: () => void;
  onKeywordChange: (value: string) => void;
  onModuleChange: (module: ChannelOperationsModule) => void;
  onProviderChange: (value: string) => void;
  onRefresh: () => void;
  onRefreshJob: (jobId: string) => void;
  onRetryJob: (jobId: string) => void;
  onSelectItem: (itemId: string) => void;
  onStatusChange: (value: string) => void;
  onSubmitAccount: (values: ChannelAccountFormValues) => void;
  onSubmitProvider: (values: ChannelProviderFormValues) => void;
  onSubmitRouteRule: (values: ChannelRouteRuleFormValues) => void;
  onSubmitTemplate: (values: ChannelTemplateFormValues) => void;
  overviewItems: ChannelOperationsSummaryItem[];
  provider: string;
  providers: ChannelProviderItem[];
  providerOptions: Array<{ label: string; value: string }>;
  selectedChannel: PublishChannelListItem | null;
  selectedItem: ChannelOperationsItem | null;
  status: string;
  total: number;
}) {
  const config = getOperationsModuleConfig(module);
  const editableModule = getEditableOperationsModule(module);
  const isEditable = editableModule !== null;
  const hasSelectedItem = Boolean(selectedItem);
  const statusValue = selectedItem ? getOperationsItemStatus(selectedItem) : '';

  return (
    <section className="grid gap-4">
      <Card className="overflow-hidden border-slate-200/80 bg-white/85 shadow-sm backdrop-blur">
        <div className="border-b p-4">
          <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge tone="ready">渠道运营</StatusBadge>
                <StatusBadge tone={error ? 'degraded' : 'healthy'}>{error ? '部分接口待接入' : '管理入口'}</StatusBadge>
              </div>
              <h2 className="mt-3 text-base font-semibold">{config.title}</h2>
              <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">{config.description}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {isEditable ? (
                <>
                  <Button disabled={!canManage || formActionLoading} onClick={onCreateOperationsItem} type="button">
                    <Plus className="size-4" />
                    新建
                  </Button>
                  <Button
                    disabled={!canManage || !hasSelectedItem || formActionLoading}
                    onClick={onEditOperationsItem}
                    type="button"
                    variant="outline"
                  >
                    <Edit className="size-4" />
                    编辑
                  </Button>
                  <Button
                    disabled={!canManage || !hasSelectedItem || itemActionLoading || statusValue === 'ACTIVE'}
                    onClick={onEnableOperationsItem}
                    type="button"
                    variant="outline"
                  >
                    <Power className="size-4" />
                    启用
                  </Button>
                  <Button
                    disabled={!canDisable || !hasSelectedItem || itemActionLoading || statusValue === 'DISABLED'}
                    onClick={onDisableOperationsItem}
                    type="button"
                    variant="outline"
                  >
                    <PowerOff className="size-4" />
                    停用
                  </Button>
                  <Button
                    disabled={!canManage || !hasSelectedItem || itemActionLoading}
                    onClick={onDeleteOperationsItem}
                    type="button"
                    variant="outline"
                  >
                    <Trash2 className="size-4" />
                    删除
                  </Button>
                </>
              ) : null}
              <Button disabled={loading} onClick={onRefresh} type="button" variant="outline">
                <RefreshCw className={cn('size-4', loading && 'animate-spin')} />
                刷新运营数据
              </Button>
            </div>
          </div>
        </div>

        <div className="grid gap-4 p-4">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-7">
            {overviewItems.map((item) => (
              <button
                className={cn(
                  'rounded-lg border bg-background/90 p-4 text-left shadow-sm transition-colors hover:bg-slate-50',
                  module === item.module && 'border-blue-300 bg-blue-50/70',
                )}
                key={item.module}
                onClick={() => onModuleChange(item.module)}
                type="button"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-muted-foreground">{item.label}</span>
                  <StatusBadge tone={item.error ? 'degraded' : item.loading ? 'loading' : 'ready'}>
                    {item.error ? '待接入' : item.loading ? '加载中' : '已接入'}
                  </StatusBadge>
                </div>
                <div className="mt-3 text-2xl font-semibold">{item.loading ? '...' : formatNumber(item.total)}</div>
                <div className="mt-1 text-xs text-muted-foreground">{item.helper}</div>
              </button>
            ))}
          </div>

          <div className="flex flex-col justify-between gap-3 rounded-md border bg-slate-50/70 p-3 lg:flex-row lg:items-center">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="w-full pl-9 lg:w-72"
                  onChange={(event) => onKeywordChange(event.target.value)}
                  placeholder="搜索名称、编号、目标或 Trace"
                  value={keyword}
                />
              </div>
              <SelectFilter
                label="状态"
                onChange={onStatusChange}
                value={status}
                values={config.statuses.map((item) => ({ label: channelOperationsStatusLabel(item), value: item }))}
              />
              <SelectFilter label="提供方" onChange={onProviderChange} value={provider} values={providerOptions} />
              <label className="inline-flex items-center gap-2 rounded-md border bg-white px-3 py-2 text-sm">
                <input
                  checked={allChannels}
                  className="size-4"
                  onChange={(event) => onAllChannelsChange(event.target.checked)}
                  type="checkbox"
                />
                全部渠道
              </label>
            </div>
            <div className="text-sm text-muted-foreground">
              {allChannels ? '显示全部可见渠道' : `当前渠道：${selectedChannel?.name ?? '未选择'}`}，共 {total} 条。
            </div>
          </div>

          {error ? (
            <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
              {config.errorMessage}
            </div>
          ) : null}

          {module === 'overview' ? (
            <ChannelOperationsOverview overviewItems={overviewItems} />
          ) : (
            <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
              <Card className="overflow-hidden border-slate-200/80">
                <div className="flex items-center justify-between gap-3 border-b p-4">
                  <div>
                    <h3 className="text-sm font-semibold">{config.listTitle}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{config.listDescription}</p>
                  </div>
                  <StatusBadge tone="mock">{total} 条</StatusBadge>
                </div>
                <div className="grid gap-3 p-4">
                  {loading ? (
                    Array.from({ length: 4 }).map((_, index) => <div className="h-24 rounded-md border bg-muted/30" key={index} />)
                  ) : items.length === 0 ? (
                    <EmptyState description={error ? '后端接口返回错误或尚未上线。' : config.emptyDescription} title="暂无记录" />
                  ) : (
                    items.map((item) => (
                      <ChannelOperationsRow
                        item={item}
                        key={item.id}
                        module={module}
                        onOpen={() => onSelectItem(item.id)}
                        selected={selectedItem?.id === item.id}
                      />
                    ))
                  )}
                </div>
              </Card>

              <Card className="grid gap-4 border-slate-200/80 p-4">
                <div>
                  <h3 className="text-sm font-semibold">{editMode ? getOperationsFormTitle(module, editMode) : '详情面板'}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {editMode ? '维护当前运营对象的基础信息、关联关系和扩展 JSON。' : '核对主字段、关联渠道和原始扩展数据。'}
                  </p>
                </div>
                {loading || jobDetailLoading ? (
                  <div className="grid gap-3">
                    <div className="h-24 rounded-md border bg-muted/30" />
                    <div className="h-44 rounded-md border bg-muted/30" />
                  </div>
                ) : editMode && editableModule === 'providers' ? (
                  <ChannelProviderForm
                    initialValue={editMode === 'edit' ? providerToFormValues(selectedItem as ChannelProviderItem) : null}
                    loading={formActionLoading}
                    onCancel={onCancelOperationsEdit}
                    onSubmit={onSubmitProvider}
                  />
                ) : editMode && editableModule === 'accounts' ? (
                  <ChannelAccountForm
                    initialValue={editMode === 'edit' ? accountToFormValues(selectedItem as ChannelAccountItem) : null}
                    loading={formActionLoading}
                    onCancel={onCancelOperationsEdit}
                    onSubmit={onSubmitAccount}
                    providers={providers}
                  />
                ) : editMode && editableModule === 'templates' ? (
                  <ChannelTemplateForm
                    accounts={accounts}
                    initialValue={editMode === 'edit' ? templateToFormValues(selectedItem as ChannelTemplateItem) : null}
                    loading={formActionLoading}
                    onCancel={onCancelOperationsEdit}
                    onSubmit={onSubmitTemplate}
                    providers={providers}
                  />
                ) : editMode && editableModule === 'route-rules' ? (
                  <ChannelRouteRuleForm
                    accounts={accounts}
                    agents={agents}
                    initialValue={editMode === 'edit' ? routeRuleToFormValues(selectedItem as ChannelRouteRuleItem) : null}
                    loading={formActionLoading}
                    onCancel={onCancelOperationsEdit}
                    onSubmit={onSubmitRouteRule}
                    providers={providers}
                  />
                ) : selectedItem ? (
                  <ChannelOperationsDetail
                    item={selectedItem}
                    jobActionLoading={jobActionLoading}
                    module={module}
                    onCancelJob={onCancelJob}
                    onRefreshJob={onRefreshJob}
                    onRetryJob={onRetryJob}
                  />
                ) : (
                  <EmptyState description="选择左侧记录后查看详情。" title="未选择记录" />
                )}
              </Card>
            </div>
          )}
        </div>
      </Card>
    </section>
  );
}

function ChannelOperationsOverview({ overviewItems }: { overviewItems: ChannelOperationsSummaryItem[] }) {
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_0.72fr]">
      <Card className="border-slate-200/80 p-4">
        <div className="flex items-center gap-2">
          <Network className="size-4 text-blue-600" />
          <h3 className="text-sm font-semibold">运营对象闭环</h3>
        </div>
        <div className="mt-4 grid gap-3">
          {overviewItems.map((item) => (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border bg-white/75 px-3 py-3" key={item.module}>
              <div>
                <div className="text-sm font-medium">{item.label}</div>
                <div className="mt-1 text-xs text-muted-foreground">{item.helper}</div>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge tone={item.error ? 'degraded' : 'ready'}>{item.error ? '待接入' : `${formatNumber(item.total)} 条`}</StatusBadge>
              </div>
            </div>
          ))}
        </div>
      </Card>
      <Card className="border-slate-200/80 p-4">
        <div className="flex items-center gap-2">
          <MessageSquareReply className="size-4 text-blue-600" />
          <h3 className="text-sm font-semibold">接入策略</h3>
        </div>
        <div className="mt-4 grid gap-3 text-sm text-muted-foreground">
          <p className="leading-6">提供方、账号、模板、路由规则已接入创建、编辑、启用、停用和删除闭环。</p>
          <p className="leading-6">投递记录仍保留现有 Sender 投递中心的请求/响应详情与失败重试能力。</p>
          <p className="leading-6">详情面板继续展示 metadata/raw 数据，方便核对第三方平台扩展字段与运行链路。</p>
        </div>
      </Card>
    </div>
  );
}

function ChannelOperationsRow({
  item,
  module,
  onOpen,
  selected,
}: {
  item: ChannelOperationsItem;
  module: ChannelOperationsModule;
  onOpen: () => void;
  selected: boolean;
}) {
  const title = getOperationsItemTitle(module, item);
  const subtitle = getOperationsItemSubtitle(module, item);
  const status = getOperationsItemStatus(item);
  const meta = getOperationsItemMeta(module, item);

  if (module === 'jobs') {
    return <ChannelPublishJobRow item={item as ChannelPublishJobItem} onOpen={onOpen} selected={selected} />;
  }

  return (
    <div
      className={cn(
        'grid cursor-pointer gap-3 rounded-md border bg-background/90 p-4 text-left shadow-sm transition-colors hover:bg-slate-50/80',
        selected && 'border-blue-300 bg-blue-50/60',
      )}
      onClick={onOpen}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onOpen();
        }
      }}
      role="button"
      tabIndex={0}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge tone={channelOperationsStatusTone(status)}>{channelOperationsStatusLabel(status)}</StatusBadge>
            <span className="truncate text-sm font-semibold">{title}</span>
          </div>
          <div className="mt-2 text-xs text-muted-foreground">{subtitle}</div>
        </div>
        <Inbox className="size-4 text-muted-foreground" />
      </div>
      <div className="grid gap-1 text-xs text-muted-foreground md:grid-cols-2">
        {meta.map((entry) => (
          <span className="truncate" key={entry.label}>{entry.label}：{entry.value}</span>
        ))}
      </div>
    </div>
  );
}

function ChannelPublishJobRow({
  item,
  onOpen,
  selected,
}: {
  item: ChannelPublishJobItem;
  onOpen: () => void;
  selected: boolean;
}) {
  const status = getOperationsItemStatus(item);
  const progress = getPublishJobProgress(item);
  const payloadSummary = getPublishJobPayloadSummary(item);
  const resultSummary = getPublishJobResultSummary(item);

  return (
    <motion.div
      className={cn(
        'grid cursor-pointer gap-3 rounded-md border bg-background/90 p-4 text-left shadow-sm transition-colors hover:bg-slate-50/80',
        selected && 'border-blue-300 bg-blue-50/60',
      )}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onOpen}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onOpen();
        }
      }}
      role="button"
      tabIndex={0}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge tone={channelOperationsStatusTone(status)}>{channelOperationsStatusLabel(status)}</StatusBadge>
            <StatusBadge tone="mock">{getPublishJobTypeLabel(getPublishJobType(item))}</StatusBadge>
            <span className="truncate text-sm font-semibold">{getOperationsItemTitle('jobs', item)}</span>
          </div>
          <div className="mt-2 text-xs text-muted-foreground">
            {item.channel_name ?? '未知渠道'} · {item.provider_name ?? '未知提供方'} · {formatChannelDateTime(item.started_at ?? item.scheduled_at ?? item.created_at)}
          </div>
        </div>
        <ClipboardCheck className="size-4 text-muted-foreground" />
      </div>

      <div className="grid gap-2 rounded-md border bg-slate-50/70 p-3">
        <div className="flex items-center justify-between gap-3 text-xs">
          <span className="text-muted-foreground">执行进度</span>
          <span className="font-medium">{progress.label}</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-200">
          <div className="h-full rounded-full bg-blue-600 transition-all" style={{ width: `${progress.percent}%` }} />
        </div>
      </div>

      <div className="grid gap-1 text-xs text-muted-foreground md:grid-cols-2">
        <span className="truncate">账号：{item.account_name ?? '-'}</span>
        <span className="truncate">模板：{item.template_name ?? '-'}</span>
        <span className="truncate">结束：{formatChannelDateTime(item.finished_at)}</span>
        <span className="truncate">错误：{item.error_message ?? '-'}</span>
      </div>
      <div className="grid gap-2 text-xs md:grid-cols-2">
        <div className="rounded-md border bg-white/70 p-2">
          <div className="text-muted-foreground">Payload 摘要</div>
          <div className="mt-1 line-clamp-2 break-words font-medium">{payloadSummary}</div>
        </div>
        <div className="rounded-md border bg-white/70 p-2">
          <div className="text-muted-foreground">Result 摘要</div>
          <div className="mt-1 line-clamp-2 break-words font-medium">{resultSummary}</div>
        </div>
      </div>
    </motion.div>
  );
}

function ChannelOperationsDetail({
  item,
  jobActionLoading,
  module,
  onCancelJob,
  onRefreshJob,
  onRetryJob,
}: {
  item: ChannelOperationsItem;
  jobActionLoading: boolean;
  module: ChannelOperationsModule;
  onCancelJob: (jobId: string) => void;
  onRefreshJob: (jobId: string) => void;
  onRetryJob: (jobId: string) => void;
}) {
  if (module === 'jobs') {
    return (
      <ChannelPublishJobDetail
        actionLoading={jobActionLoading}
        item={item as ChannelPublishJobItem}
        onCancel={onCancelJob}
        onRefresh={onRefreshJob}
        onRetry={onRetryJob}
      />
    );
  }

  const rows = getOperationsDetailRows(module, item);
  const metadata = getOperationsMetadata(item);

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge tone={channelOperationsStatusTone(getOperationsItemStatus(item))}>
          {channelOperationsStatusLabel(getOperationsItemStatus(item))}
        </StatusBadge>
        <StatusBadge tone="mock">{getOperationsModuleConfig(module).label}</StatusBadge>
      </div>

      <div className="grid gap-2 rounded-md border bg-slate-50/80 p-3 text-xs">
        {rows.map((row) => (
          <DetailRow key={row.label} label={row.label} value={row.value} />
        ))}
      </div>

      <div className="grid gap-2">
        <div className="text-sm font-semibold">扩展数据</div>
        <pre className="max-h-72 overflow-auto rounded-md border bg-slate-950 px-3 py-3 text-xs leading-6 text-slate-100">
{stringifyPretty(metadata)}
        </pre>
      </div>
    </div>
  );
}

function ChannelPublishJobDetail({
  actionLoading,
  item,
  onCancel,
  onRefresh,
  onRetry,
}: {
  actionLoading: boolean;
  item: ChannelPublishJobItem;
  onCancel: (jobId: string) => void;
  onRefresh: (jobId: string) => void;
  onRetry: (jobId: string) => void;
}) {
  const status = getOperationsItemStatus(item);
  const progress = getPublishJobProgress(item);
  const rows = getOperationsDetailRows('jobs', item);
  const metadata = getOperationsMetadata(item);
  const payload = getPublishJobPayload(item);
  const result = getPublishJobResult(item);
  const canCancel = ['PENDING', 'RUNNING', 'RETRYING'].includes(status);
  const canRetry = ['FAILED', 'CANCELED'].includes(status);

  return (
    <div className="grid gap-4">
      <div className="flex flex-col justify-between gap-3 rounded-md border bg-slate-50/80 p-3 lg:flex-row lg:items-start">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge tone={channelOperationsStatusTone(status)}>{channelOperationsStatusLabel(status)}</StatusBadge>
            <StatusBadge tone="mock">{getPublishJobTypeLabel(getPublishJobType(item))}</StatusBadge>
            <StatusBadge tone="loading">{progress.label}</StatusBadge>
          </div>
          <h4 className="mt-3 text-sm font-semibold">{getOperationsItemTitle('jobs', item)}</h4>
          <p className="mt-1 text-xs text-muted-foreground">
            {item.channel_name ?? '未知渠道'} · {item.provider_name ?? '未知提供方'} · {item.account_name ?? '未关联账号'} · {item.template_name ?? '未关联模板'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button disabled={actionLoading} onClick={() => onRefresh(item.id)} size="sm" type="button" variant="outline">
            <ClipboardCheck className="size-4" />
            获取
          </Button>
          <Button disabled={!canCancel || actionLoading} onClick={() => onCancel(item.id)} size="sm" type="button" variant="outline">
            <X className="size-4" />
            取消
          </Button>
          <Button disabled={!canRetry || actionLoading} onClick={() => onRetry(item.id)} size="sm" type="button" variant="outline">
            <RotateCcw className="size-4" />
            重试
          </Button>
        </div>
      </div>

      <div className="grid gap-2 rounded-md border bg-white/80 p-3">
        <div className="flex items-center justify-between gap-3 text-xs">
          <span className="text-muted-foreground">执行进度</span>
          <span className="font-medium">{progress.label}</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-200">
          <div className="h-full rounded-full bg-blue-600 transition-all" style={{ width: `${progress.percent}%` }} />
        </div>
      </div>

      <div className="grid gap-2 rounded-md border bg-slate-50/80 p-3 text-xs md:grid-cols-2">
        {rows.map((row) => (
          <DetailRow key={row.label} label={row.label} value={row.value} />
        ))}
      </div>

      {item.error_message ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-3 text-sm text-destructive">
          {item.error_message}
        </div>
      ) : null}

      <div className="grid gap-3 lg:grid-cols-2">
        <JsonSummaryPanel title="Payload 摘要" value={payload} />
        <JsonSummaryPanel title="Result 摘要" value={result} />
      </div>

      <div className="grid gap-2">
        <div className="text-sm font-semibold">扩展数据</div>
        <pre className="max-h-72 overflow-auto rounded-md border bg-slate-950 px-3 py-3 text-xs leading-6 text-slate-100">
{stringifyPretty(metadata)}
        </pre>
      </div>
    </div>
  );
}

function JsonSummaryPanel({ title, value }: { title: string; value: unknown }) {
  return (
    <div className="grid gap-2">
      <div className="text-sm font-semibold">{title}</div>
      <pre className="max-h-48 overflow-auto rounded-md border bg-slate-950 px-3 py-3 text-xs leading-6 text-slate-100">
{stringifyPretty(value ?? '暂无数据')}
      </pre>
    </div>
  );
}

function SelectFilter({
  label,
  onChange,
  value,
  values,
}: {
  label: string;
  onChange: (value: string) => void;
  value: string;
  values: Array<{ label: string; value: string }>;
}) {
  return (
    <select
      aria-label={label}
      className="h-10 rounded-md border bg-background/80 px-3 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring"
      onChange={(event) => onChange(event.target.value)}
      value={value}
    >
      <option value="">{label}</option>
      {values.map((item) => (
        <option key={item.value} value={item.value}>
          {item.label}
        </option>
      ))}
    </select>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 rounded-md border bg-white/70 p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="break-words font-medium">{value}</div>
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-white/70 p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-lg font-semibold">{value}</div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[88px_1fr] gap-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="break-words font-medium">{value}</span>
    </div>
  );
}

function getCallbackAdapterInfo(channel: PublishChannelListItem) {
  const supportedTypes = new Set<PublishChannelType>(['WECHAT_WORK', 'DINGTALK', 'FEISHU', 'SLACK', 'CUSTOM_WEBHOOK']);
  const supported = supportedTypes.has(channel.channel);
  const statusLabel = !supported ? '暂不支持入站' : channel.status === 'ACTIVE' ? '可接收入站' : '待启用';
  const parserLabels: Record<PublishChannelType, string> = {
    WEB_WIDGET: '不适用',
    OPEN_API: '不适用',
    WECHAT_WORK: '文本 JSON/XML',
    DINGTALK: '机器人文本',
    FEISHU: '事件文本',
    SLACK: '事件文本',
    CUSTOM_WEBHOOK: 'message/text/content',
  };
  const descriptions: Record<PublishChannelType, string> = {
    WEB_WIDGET: 'Web 组件使用前端会话入口，不走企业 IM 回调适配。',
    OPEN_API: '开放 API 使用 API Key 调用入口，不走企业 IM 回调适配。',
    WECHAT_WORK: '支持企业微信文本回调的明文 JSON/XML 解析，生产加密验签保留适配边界。',
    DINGTALK: '支持钉钉机器人文本消息回调，返回钉钉 text 同步响应。',
    FEISHU: '支持飞书事件订阅 URL 校验与文本消息回调，返回飞书 text 同步响应。',
    SLACK: '支持 Slack URL 校验与文本事件回调，返回 Slack 文本响应。',
    CUSTOM_WEBHOOK: '支持自定义 JSON Webhook，并可通过 x-aiaget-signature 进行 HMAC 校验。',
  };
  const config = channel.config ?? {};
  const skipSignature = config.skip_signature_check === true;
  const requireSignature = channel.channel === 'CUSTOM_WEBHOOK' || config.require_aiaget_signature === true;
  const asyncReply = config.reply_mode === 'ASYNC' || config.ack_immediately === true;
  const senderDisabled = config.sender_disabled === true;
  const hasSenderTarget = Boolean(
    channel.callback_url
      || config.sender_webhook_url
      || config.webhook_url
      || config.wechat_work_access_token
      || config.wechat_work_corp_id
      || config.feishu_tenant_access_token
      || config.feishu_bot_access_token
      || config.slack_bot_token,
  );
  const signatureLabel = requireSignature
    ? channel.secret_masked
      ? skipSignature
        ? '已配置密钥，当前跳过'
        : '已启用 HMAC'
      : '缺少密钥'
    : '平台原生验签边界';
  const parserLabel = asyncReply ? `${parserLabels[channel.channel]} / 快速 ACK` : parserLabels[channel.channel];

  return {
    supported,
    statusLabel,
    parserLabel,
    signatureLabel,
    senderLabel: senderDisabled ? '已停用' : hasSenderTarget ? '已配置' : asyncReply ? '待配置' : '可选',
    replyModeLabel: asyncReply ? '异步主动回复' : '同步响应',
    description: descriptions[channel.channel],
  };
}

function matchesChannelKeyword(channel: PublishChannelListItem, keyword: string) {
  const normalized = keyword.trim().toLowerCase();
  if (!normalized) return true;

  return [
    channel.name,
    channel.description,
    channel.channel,
    publishChannelTypeLabel(channel.channel),
    channel.agent?.name,
    channel.agent?.code,
    channel.endpoint_url,
    channel.callback_url,
    channel.health_message,
  ].some((value) => value?.toLowerCase().includes(normalized));
}

function buildSenderDeliveryMetrics(items: ChannelSenderDeliveryListItem[], total: number) {
  const success = items.filter((item) => item.status === 'SUCCESS').length;
  const failed = items.filter((item) => item.status === 'FAILED').length;
  const skipped = items.filter((item) => item.status === 'SKIPPED').length;
  const retrying = items.filter((item) => item.status === 'RETRYING' || item.retry_count > 0).length;
  const latencyItems = items.filter((item) => typeof item.latency_ms === 'number');
  const averageLatency = latencyItems.length === 0
    ? null
    : Math.round(latencyItems.reduce((totalLatency, item) => totalLatency + (item.latency_ms ?? 0), 0) / latencyItems.length);

  return [
    { label: '投递总数', value: formatNumber(total), helper: '当前筛选范围' },
    { label: '成功投递', value: formatNumber(success), helper: '最近列表样本' },
    { label: '失败投递', value: formatNumber(failed), helper: '可执行重试' },
    { label: '跳过发送', value: formatNumber(skipped), helper: '配置或内容原因' },
    { label: '平均耗时', value: averageLatency === null ? '-' : `${averageLatency}ms`, helper: `重试链路 ${retrying} 条` },
  ];
}

function channelSenderDeliveryTone(status: ChannelSenderDeliveryStatus) {
  if (status === 'SUCCESS') return 'healthy';
  if (status === 'FAILED') return 'unavailable';
  if (status === 'SKIPPED') return 'planned';
  if (status === 'RETRYING') return 'degraded';
  return 'loading';
}

function channelSenderDeliveryLabel(status: ChannelSenderDeliveryStatus) {
  const labels: Record<ChannelSenderDeliveryStatus, string> = {
    PENDING: '待投递',
    SUCCESS: '成功',
    FAILED: '失败',
    SKIPPED: '已跳过',
    RETRYING: '重试中',
  };

  return labels[status] ?? status;
}

function channelProviderLabel(provider: ChannelCallbackProvider) {
  const labels: Record<ChannelCallbackProvider, string> = {
    WECHAT_WORK: '企业微信',
    DINGTALK: '钉钉',
    FEISHU: '飞书',
    SLACK: 'Slack',
    CUSTOM_WEBHOOK: '自定义 Webhook',
  };

  return labels[provider] ?? provider;
}

function taskResultTone(status: ChannelSenderTaskRunResult['status']) {
  if (status === 'SUCCESS') return 'healthy';
  if (status === 'FAILED') return 'unavailable';

  return 'planned';
}

function taskResultLabel(status: ChannelSenderTaskRunResult['status']) {
  const labels: Record<ChannelSenderTaskRunResult['status'], string> = {
    SUCCESS: '成功',
    FAILED: '失败',
    SKIPPED: '已跳过',
  };

  return labels[status] ?? status;
}

function schedulerStatusTone(status: ChannelReleaseSchedulerRunResult['status']) {
  if (status === 'SUCCESS') return 'healthy';
  if (status === 'PARTIAL') return 'degraded';
  if (status === 'FAILED') return 'unavailable';

  return 'planned';
}

function schedulerStatusLabel(status: ChannelReleaseSchedulerRunResult['status']) {
  const labels: Record<ChannelReleaseSchedulerRunResult['status'], string> = {
    SUCCESS: '成功',
    PARTIAL: '部分成功',
    FAILED: '失败',
    SKIPPED: '已跳过',
  };

  return labels[status] ?? status;
}

interface ChannelOperationsSummaryItem {
  error: boolean;
  helper: string;
  label: string;
  loading: boolean;
  module: ChannelOperationsModule;
  total: number;
}

interface ChannelOperationsModuleConfig {
  description: string;
  emptyDescription: string;
  errorMessage: string;
  label: string;
  listDescription: string;
  listTitle: string;
  statuses: string[];
  title: string;
}

function buildOperationsSummaryItem(
  module: Exclude<ChannelOperationsModule, 'overview' | 'publish'>,
  label: string,
  result: ChannelOperationsListResult<ChannelOperationsItem> | undefined,
  loading: boolean,
  error: boolean,
  helper: string,
): ChannelOperationsSummaryItem {
  return {
    error,
    helper,
    label,
    loading,
    module,
    total: result?.total ?? result?.items.length ?? 0,
  };
}

function getOperationsResult(
  module: ChannelOperationsModule,
  queries: {
    accounts?: ChannelOperationsListResult<ChannelAccountItem>;
    deliveries?: ChannelOperationsListResult<ChannelDeliveryItem>;
    jobs?: ChannelOperationsListResult<ChannelPublishJobItem>;
    providers?: ChannelOperationsListResult<ChannelProviderItem>;
    replies?: ChannelOperationsListResult<ChannelReplyItem>;
    routeRules?: ChannelOperationsListResult<ChannelRouteRuleItem>;
    templates?: ChannelOperationsListResult<ChannelTemplateItem>;
  },
): ChannelOperationsListResult<ChannelOperationsItem> | undefined {
  if (module === 'providers') return queries.providers;
  if (module === 'accounts') return queries.accounts;
  if (module === 'templates') return queries.templates;
  if (module === 'route-rules') return queries.routeRules;
  if (module === 'jobs') return queries.jobs;
  if (module === 'deliveries') return queries.deliveries;
  if (module === 'replies') return queries.replies;

  return undefined;
}

function getOperationsLoading(
  module: ChannelOperationsModule,
  queries: {
    accounts: boolean;
    deliveries: boolean;
    jobs: boolean;
    providers: boolean;
    replies: boolean;
    routeRules: boolean;
    templates: boolean;
  },
) {
  if (module === 'overview') return Object.values(queries).some(Boolean);
  if (module === 'providers') return queries.providers;
  if (module === 'accounts') return queries.accounts;
  if (module === 'templates') return queries.templates;
  if (module === 'route-rules') return queries.routeRules;
  if (module === 'jobs') return queries.jobs;
  if (module === 'deliveries') return queries.deliveries;
  if (module === 'replies') return queries.replies;

  return false;
}

function getOperationsError(
  module: ChannelOperationsModule,
  queries: {
    accounts: boolean;
    deliveries: boolean;
    jobs: boolean;
    providers: boolean;
    replies: boolean;
    routeRules: boolean;
    templates: boolean;
  },
) {
  if (module === 'overview') return Object.values(queries).some(Boolean);
  if (module === 'providers') return queries.providers;
  if (module === 'accounts') return queries.accounts;
  if (module === 'templates') return queries.templates;
  if (module === 'route-rules') return queries.routeRules;
  if (module === 'jobs') return queries.jobs;
  if (module === 'deliveries') return queries.deliveries;
  if (module === 'replies') return queries.replies;

  return false;
}

function getOperationsModuleConfig(module: ChannelOperationsModule): ChannelOperationsModuleConfig {
  const configs: Record<ChannelOperationsModule, ChannelOperationsModuleConfig> = {
    overview: {
      description: '汇总 provider、账号、模板、路由、任务、投递和回复接口的接入状态，适合运营巡检。',
      emptyDescription: '暂无运营数据。',
      errorMessage: '部分渠道运营接口尚未上线或返回错误，已保留现有发布渠道能力。',
      label: '总览',
      listDescription: '查看各运营对象数量与接入状态。',
      listTitle: '运营对象',
      statuses: ['ACTIVE', 'DISABLED', 'ERROR'],
      title: '渠道运营总览',
    },
    publish: {
      description: '已发布 Agent 的渠道入口仍由下方现有发布渠道清单管理。',
      emptyDescription: '暂无发布渠道。',
      errorMessage: '发布渠道概览加载失败。',
      label: '发布渠道',
      listDescription: '使用下方发布渠道清单管理。',
      listTitle: '发布渠道',
      statuses: publishChannelStatuses,
      title: '发布渠道',
    },
    providers: {
      description: '统一查看企业微信、钉钉、飞书、Slack、自定义 Webhook 等渠道提供方及健康状态。',
      emptyDescription: '暂无渠道提供方。',
      errorMessage: '/channels/providers 接口暂不可用，请等待后端 provider 子任务上线。',
      label: '渠道提供方',
      listDescription: '平台适配、健康检查和关联对象统计。',
      listTitle: '提供方清单',
      statuses: ['ACTIVE', 'DISABLED', 'ERROR', 'DRAFT'],
      title: '渠道提供方',
    },
    accounts: {
      description: '统一查看渠道账号、凭证环境、归属和最近使用时间。',
      emptyDescription: '暂无渠道账号。',
      errorMessage: '/channels/accounts 接口暂不可用，请等待后端 account 子任务上线。',
      label: '账号',
      listDescription: '账号凭证、环境与关联渠道。',
      listTitle: '账号清单',
      statuses: ['ACTIVE', 'DISABLED', 'ERROR', 'EXPIRED'],
      title: '渠道账号',
    },
    templates: {
      description: '管理消息模板、版本、语言和审核状态的只读入口。',
      emptyDescription: '暂无消息模板。',
      errorMessage: '/channels/templates 接口暂不可用，请等待后端 template 子任务上线。',
      label: '模板',
      listDescription: '模板编号、版本、语言和状态。',
      listTitle: '模板清单',
      statuses: ['DRAFT', 'ACTIVE', 'DISABLED', 'ERROR', 'APPROVED', 'REJECTED'],
      title: '渠道模板',
    },
    'route-rules': {
      description: '查看入站或出站消息如何按优先级匹配到渠道、账号、模板或兜底目标。',
      emptyDescription: '暂无路由规则。',
      errorMessage: '/channels/route-rules 接口暂不可用，请等待后端 route-rule 子任务上线。',
      label: '路由规则',
      listDescription: '规则优先级、匹配条件和目标。',
      listTitle: '路由规则',
      statuses: ['ACTIVE', 'DISABLED', 'ERROR', 'DRAFT'],
      title: '路由规则',
    },
    jobs: {
      description: '查看渠道发布、群发或同步任务的执行状态和错误摘要。',
      emptyDescription: '暂无发布任务。',
      errorMessage: '/channels/publish-jobs 接口暂不可用，请等待后端 job 子任务上线。',
      label: '发布任务',
      listDescription: '任务编号、渠道、账号、模板和执行时间。',
      listTitle: '发布任务',
      statuses: ['PENDING', 'RUNNING', 'SUCCESS', 'FAILED', 'SKIPPED', 'CANCELED'],
      title: '发布任务',
    },
    deliveries: {
      description: '统一投递流水入口，用于承接新后端 delivery 模型；现有 Sender 投递中心仍提供完整详情与重试。',
      emptyDescription: '暂无投递记录。',
      errorMessage: '/channels/deliveries 接口暂不可用，请等待后端 delivery 子任务上线。',
      label: '投递记录',
      listDescription: '统一发送状态、响应码、耗时和 Trace。',
      listTitle: '投递记录',
      statuses: ['PENDING', 'SUCCESS', 'FAILED', 'SKIPPED', 'RETRYING'],
      title: '投递记录',
    },
    replies: {
      description: '查看外部会话、消息、回复类型与投递链路，辅助排查入站回复闭环。',
      emptyDescription: '暂无回复记录。',
      errorMessage: '/channels/replies 接口暂不可用，请等待后端 reply 子任务上线。',
      label: '回复记录',
      listDescription: '外部会话、消息、Trace 和回复状态。',
      listTitle: '回复记录',
      statuses: ['PENDING', 'SUCCESS', 'FAILED', 'SKIPPED'],
      title: '回复记录',
    },
  };

  return configs[module];
}

function buildProviderFilterOptions(items: ChannelProviderItem[]) {
  return items.map((item) => ({
    label: item.name || item.code,
    value: item.code || item.id,
  }));
}

function getEditableOperationsModule(module: ChannelOperationsModule): ChannelOperationsEditableModule | null {
  if (module === 'providers' || module === 'accounts' || module === 'templates' || module === 'route-rules') {
    return module;
  }

  return null;
}

function getOperationsEditableModuleLabel(module: ChannelOperationsEditableModule) {
  const labels: Record<ChannelOperationsEditableModule, string> = {
    accounts: '渠道账号',
    providers: '渠道提供方',
    'route-rules': '路由规则',
    templates: '渠道模板',
  };

  return labels[module];
}

function getOperationsFormTitle(module: ChannelOperationsModule, editMode: Exclude<ChannelOperationsEditMode, null>) {
  const editableModule = getEditableOperationsModule(module);
  if (!editableModule) return '维护运营对象';

  return `${editMode === 'edit' ? '编辑' : '新建'}${getOperationsEditableModuleLabel(editableModule)}`;
}

function runOperationsStatusAction(module: ChannelOperationsEditableModule, itemId: string, action: 'enable' | 'disable') {
  if (module === 'providers') return action === 'enable' ? enableChannelProvider(itemId) : disableChannelProvider(itemId);
  if (module === 'accounts') return action === 'enable' ? enableChannelAccount(itemId) : disableChannelAccount(itemId);
  if (module === 'templates') return action === 'enable' ? enableChannelTemplate(itemId) : disableChannelTemplate(itemId);

  return action === 'enable' ? enableChannelRouteRule(itemId) : disableChannelRouteRule(itemId);
}

function runOperationsDeleteAction(module: ChannelOperationsEditableModule, itemId: string) {
  if (module === 'providers') return deleteChannelProvider(itemId);
  if (module === 'accounts') return deleteChannelAccount(itemId);
  if (module === 'templates') return deleteChannelTemplate(itemId);

  return deleteChannelRouteRule(itemId);
}

function normalizeProviderFormValues(values: ChannelProviderFormValues): CreateChannelProviderInput {
  return {
    auth_type: normalizeNullableString(values.auth_type),
    callback_url: normalizeNullableString(values.callback_url),
    capabilities: values.capabilities ?? [],
    code: values.code.trim(),
    config: values.config ?? null,
    description: normalizeNullableString(values.description),
    endpoint_url: normalizeNullableString(values.endpoint_url),
    name: values.name.trim(),
    provider_type: values.provider_type?.trim() || undefined,
    status: values.status as CreateChannelProviderInput['status'],
  };
}

function toUpdateChannelProviderInput(input: CreateChannelProviderInput): UpdateChannelProviderInput {
  return {
    auth_type: input.auth_type,
    callback_url: input.callback_url,
    capabilities: input.capabilities,
    config: input.config,
    description: input.description,
    endpoint_url: input.endpoint_url,
    name: input.name,
    provider_type: input.provider_type,
    status: input.status,
  };
}

function normalizeAccountFormValues(values: ChannelAccountFormValues): CreateChannelAccountInput {
  return {
    code: values.code.trim(),
    config: values.config ?? null,
    description: normalizeNullableString(values.description),
    external_account_id: normalizeNullableString(values.external_account_id),
    name: values.name.trim(),
    provider_id: values.provider_id,
    secret: normalizeNullableString(values.secret),
    status: values.status as CreateChannelAccountInput['status'],
  };
}

function toUpdateChannelAccountInput(input: CreateChannelAccountInput): UpdateChannelAccountInput {
  return {
    config: input.config,
    description: input.description,
    external_account_id: input.external_account_id,
    name: input.name,
    secret: input.secret,
    status: input.status,
  };
}

function normalizeTemplateFormValues(values: ChannelTemplateFormValues): CreateChannelTemplateInput {
  return {
    account_id: normalizeNullableString(values.account_id),
    body: normalizeNullableString(values.body),
    code: values.code.trim(),
    content_schema: values.content_schema ?? null,
    external_template_id: normalizeNullableString(values.external_template_id),
    locale: normalizeNullableString(values.locale),
    name: values.name.trim(),
    provider_id: normalizeNullableString(values.provider_id),
    status: values.status,
    subject: normalizeNullableString(values.subject),
    template_type: values.template_type?.trim() || undefined,
    variables: values.variables ?? null,
    version: values.version,
  };
}

function toUpdateChannelTemplateInput(input: CreateChannelTemplateInput): UpdateChannelTemplateInput {
  return {
    account_id: input.account_id,
    body: input.body,
    content_schema: input.content_schema,
    external_template_id: input.external_template_id,
    locale: input.locale,
    name: input.name,
    provider_id: input.provider_id,
    status: input.status,
    subject: input.subject,
    template_type: input.template_type,
    variables: input.variables,
  };
}

function normalizeRouteRuleFormValues(values: ChannelRouteRuleFormValues): CreateChannelRouteRuleInput & Pick<UpdateChannelRouteRuleInput, 'clear_agent'> {
  return {
    account_id: normalizeNullableString(values.account_id),
    agent_id: values.clear_agent ? null : normalizeNullableString(values.agent_id),
    clear_agent: values.clear_agent,
    code: values.code.trim(),
    direction: values.direction,
    match_config: values.match_config ?? null,
    match_type: values.match_type?.trim() || undefined,
    name: values.name.trim(),
    priority: values.priority,
    provider_id: normalizeNullableString(values.provider_id),
    status: values.status,
    target_config: values.target_config ?? null,
    target_type: values.target_type?.trim() || undefined,
  };
}

function toUpdateChannelRouteRuleInput(input: CreateChannelRouteRuleInput & Pick<UpdateChannelRouteRuleInput, 'clear_agent'>): UpdateChannelRouteRuleInput {
  return {
    account_id: input.account_id,
    agent_id: input.agent_id,
    clear_agent: input.clear_agent,
    direction: input.direction,
    match_config: input.match_config,
    match_type: input.match_type,
    name: input.name,
    priority: input.priority,
    provider_id: input.provider_id,
    status: input.status,
    target_config: input.target_config,
    target_type: input.target_type,
  };
}

function providerToFormValues(item: ChannelProviderItem): Partial<ChannelProviderFormValues> {
  const metadata = getOperationsMetadataRecord(item);
  return {
    auth_type: getMetadataString(metadata, 'auth_type'),
    callback_url: getMetadataString(metadata, 'callback_url'),
    capabilities: getMetadataStringArray(metadata, 'capabilities'),
    code: item.code,
    config: getMetadataRecord(metadata, 'config'),
    description: getMetadataString(metadata, 'description'),
    endpoint_url: getMetadataString(metadata, 'endpoint_url'),
    name: item.name,
    provider_type: getMetadataString(metadata, 'provider_type') ?? item.type,
    status: item.status as ChannelProviderFormValues['status'],
  };
}

function accountToFormValues(item: ChannelAccountItem): Partial<ChannelAccountFormValues> {
  const metadata = getOperationsMetadataRecord(item);
  return {
    code: item.account_key ?? getMetadataString(metadata, 'code') ?? '',
    config: getMetadataRecord(metadata, 'config'),
    description: getMetadataString(metadata, 'description'),
    external_account_id: getMetadataString(metadata, 'external_account_id'),
    name: item.account_name,
    provider_id: item.provider_id ?? '',
    secret: '',
    status: item.status as ChannelAccountFormValues['status'],
  };
}

function templateToFormValues(item: ChannelTemplateItem): Partial<ChannelTemplateFormValues> {
  const metadata = getOperationsMetadataRecord(item);
  return {
    account_id: getMetadataString(metadata, 'account_id'),
    body: getMetadataString(metadata, 'body'),
    code: item.template_code ?? '',
    content_schema: getMetadataRecord(metadata, 'content_schema'),
    external_template_id: getMetadataString(metadata, 'external_template_id'),
    locale: item.language,
    name: item.name,
    provider_id: item.provider_id,
    status: item.status as ChannelTemplateFormValues['status'],
    subject: getMetadataString(metadata, 'subject'),
    template_type: item.template_type ?? undefined,
    variables: getMetadataRecord(metadata, 'variables'),
    version: normalizeVersionNumber(item.version),
  };
}

function routeRuleToFormValues(item: ChannelRouteRuleItem): Partial<ChannelRouteRuleFormValues> {
  const metadata = getOperationsMetadataRecord(item);
  return {
    account_id: getMetadataString(metadata, 'account_id'),
    agent_id: getMetadataString(metadata, 'agent_id'),
    clear_agent: false,
    code: getMetadataString(metadata, 'code') ?? '',
    direction: getMetadataString(metadata, 'direction') as ChannelRouteRuleFormValues['direction'],
    match_config: getMetadataRecord(metadata, 'match_config'),
    match_type: item.match_type ?? undefined,
    name: item.name,
    priority: item.priority ?? 100,
    provider_id: item.provider_id,
    status: item.status as ChannelRouteRuleFormValues['status'],
    target_config: getMetadataRecord(metadata, 'target_config'),
    target_type: item.target_type ?? undefined,
  };
}

function getOperationsItemTitle(module: ChannelOperationsModule, item: ChannelOperationsItem) {
  if (module === 'providers') return (item as ChannelProviderItem).name || (item as ChannelProviderItem).code;
  if (module === 'accounts') return (item as ChannelAccountItem).account_name;
  if (module === 'templates') return (item as ChannelTemplateItem).name;
  if (module === 'route-rules') return (item as ChannelRouteRuleItem).name;
  if (module === 'jobs') return (item as ChannelPublishJobItem).title || (item as ChannelPublishJobItem).job_no || item.id;
  if (module === 'deliveries') return (item as ChannelDeliveryItem).delivery_id || item.id;
  if (module === 'replies') return (item as ChannelReplyItem).reply_id || (item as ChannelReplyItem).external_message_id || item.id;

  return item.id;
}

function getOperationsItemSubtitle(module: ChannelOperationsModule, item: ChannelOperationsItem) {
  if (module === 'providers') {
    const provider = item as ChannelProviderItem;
    return `${provider.type} · ${provider.health_status ?? '未检查'} · ${formatChannelDateTime(provider.last_checked_at)}`;
  }
  if (module === 'accounts') {
    const account = item as ChannelAccountItem;
    return `${account.provider_name ?? account.provider_code ?? '未知提供方'} · ${account.environment ?? '默认环境'} · 最近 ${formatChannelDateTime(account.last_used_at)}`;
  }
  if (module === 'templates') {
    const template = item as ChannelTemplateItem;
    return `${template.provider_name ?? template.provider_code ?? '未知提供方'} · ${template.template_type ?? '默认类型'} · v${template.version ?? '-'}`;
  }
  if (module === 'route-rules') {
    const rule = item as ChannelRouteRuleItem;
    return `${rule.match_type ?? '匹配'}=${rule.match_value ?? '-'} -> ${rule.target_type ?? '目标'}:${rule.target_id ?? '-'}`;
  }
  if (module === 'jobs') {
    const job = item as ChannelPublishJobItem;
    return `${job.channel_name ?? '未知渠道'} · ${formatChannelDateTime(job.started_at ?? job.scheduled_at ?? job.created_at)}`;
  }
  if (module === 'deliveries') {
    const delivery = item as ChannelDeliveryItem;
    return `${delivery.channel_name ?? '未知渠道'} · ${delivery.target ?? '未配置目标'} · ${formatLatency(delivery.latency_ms ?? null)}`;
  }
  if (module === 'replies') {
    const reply = item as ChannelReplyItem;
    return `${reply.channel_name ?? '未知渠道'} · 外部会话 ${reply.external_conversation_id ?? '-'} · ${formatChannelDateTime(reply.replied_at ?? reply.created_at)}`;
  }

  return '';
}

function getOperationsItemMeta(module: ChannelOperationsModule, item: ChannelOperationsItem) {
  if (module === 'providers') {
    const provider = item as ChannelProviderItem;
    return [
      { label: '账号', value: formatNumber(provider.account_count ?? 0) },
      { label: '模板', value: formatNumber(provider.template_count ?? 0) },
      { label: '规则', value: formatNumber(provider.route_rule_count ?? 0) },
      { label: '24h 投递', value: formatNumber(provider.delivery_count_24h ?? 0) },
    ];
  }
  if (module === 'accounts') {
    const account = item as ChannelAccountItem;
    return [
      { label: '提供方', value: account.provider_name ?? account.provider_code ?? '-' },
      { label: '渠道', value: account.channel_name ?? '-' },
      { label: '归属', value: account.owner ?? '-' },
      { label: '环境', value: account.environment ?? '-' },
    ];
  }
  if (module === 'templates') {
    const template = item as ChannelTemplateItem;
    return [
      { label: '编号', value: template.template_code ?? '-' },
      { label: '语言', value: template.language ?? '-' },
      { label: '版本', value: `${template.version ?? '-'}` },
      { label: '更新', value: formatChannelDateTime(template.updated_at) },
    ];
  }
  if (module === 'route-rules') {
    const rule = item as ChannelRouteRuleItem;
    return [
      { label: '优先级', value: `${rule.priority ?? '-'}` },
      { label: '渠道', value: rule.channel_name ?? '-' },
      { label: '目标', value: `${rule.target_type ?? '-'}:${rule.target_id ?? '-'}` },
      { label: '兜底', value: rule.fallback_target ?? '-' },
    ];
  }
  if (module === 'jobs') {
    const job = item as ChannelPublishJobItem;
    return [
      { label: '任务类型', value: getPublishJobTypeLabel(getPublishJobType(job)) },
      { label: '任务号', value: job.job_no ?? '-' },
      { label: '渠道', value: job.channel_name ?? job.channel_id ?? '-' },
      { label: '提供方', value: job.provider_name ?? job.provider_id ?? '-' },
      { label: '账号', value: job.account_name ?? '-' },
      { label: '模板', value: job.template_name ?? '-' },
      { label: '进度', value: getPublishJobProgress(job).label },
      { label: '开始', value: formatChannelDateTime(job.started_at ?? job.scheduled_at) },
      { label: '结束', value: formatChannelDateTime(job.finished_at) },
    ];
  }
  if (module === 'deliveries') {
    const delivery = item as ChannelDeliveryItem;
    return [
      { label: '响应码', value: delivery.response_status === null || delivery.response_status === undefined ? '-' : `${delivery.response_status}` },
      { label: '重试', value: `${delivery.retry_count ?? 0}` },
      { label: 'Trace', value: delivery.trace_id ?? '-' },
      { label: '时间', value: formatChannelDateTime(delivery.delivered_at ?? delivery.created_at) },
    ];
  }

  const reply = item as ChannelReplyItem;
  return [
    { label: '投递', value: reply.delivery_id ?? '-' },
    { label: '外部消息', value: reply.external_message_id ?? '-' },
    { label: 'Trace', value: reply.trace_id ?? '-' },
    { label: '时间', value: formatChannelDateTime(reply.replied_at ?? reply.created_at) },
  ];
}

function getOperationsDetailRows(module: ChannelOperationsModule, item: ChannelOperationsItem) {
  return [
    { label: 'ID', value: item.id },
    { label: '状态', value: channelOperationsStatusLabel(getOperationsItemStatus(item)) },
    { label: '名称', value: getOperationsItemTitle(module, item) },
    ...getOperationsItemMeta(module, item),
    { label: '创建', value: formatChannelDateTime(getOptionalString(item, 'created_at')) },
    { label: '更新', value: formatChannelDateTime(getOptionalString(item, 'updated_at')) },
  ];
}

function getOperationsMetadata(item: ChannelOperationsItem) {
  return item.metadata ?? item;
}

function getOperationsMetadataRecord(item: ChannelOperationsItem) {
  const metadata = getOperationsMetadata(item);

  return isRecord(metadata) ? metadata : {};
}

function getMetadataString(metadata: Record<string, unknown>, key: string) {
  const value = metadata[key];

  return typeof value === 'string' ? value : null;
}

function getMetadataRecord(metadata: Record<string, unknown>, key: string) {
  const value = metadata[key];

  return isRecord(value) ? value : null;
}

function getMetadataStringArray(metadata: Record<string, unknown>, key: string) {
  const value = metadata[key];
  if (!Array.isArray(value)) return [];

  return value.filter((item): item is string => typeof item === 'string');
}

function normalizeVersionNumber(value: string | number | null | undefined) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number.parseInt(value, 10);
    if (Number.isFinite(parsed)) return parsed;
  }

  return 1;
}

function getPublishJobMetadata(item: ChannelPublishJobItem): Record<string, unknown> {
  return {
    ...(item.metadata ?? {}),
    ...(item.job_type ? { job_type: item.job_type } : {}),
    ...(typeof item.progress === 'number' ? { progress_percent: item.progress } : {}),
    ...(typeof item.progress_percent === 'number' ? { progress_percent: item.progress_percent } : {}),
    ...(typeof item.completed_count === 'number' ? { completed_count: item.completed_count } : {}),
    ...(typeof item.total_count === 'number' ? { total_count: item.total_count } : {}),
    ...(item.payload !== undefined ? { payload: item.payload } : {}),
    ...(item.result !== undefined ? { result: item.result } : {}),
  };
}

function getPublishJobMetadataRecord(item: ChannelPublishJobItem, key: string) {
  const value = getPublishJobMetadata(item)[key];

  return isRecord(value) ? value : null;
}

function getPublishJobMetadataString(item: ChannelPublishJobItem, key: string) {
  const value = getPublishJobMetadata(item)[key];

  return typeof value === 'string' ? value : null;
}

function getPublishJobMetadataNumber(item: ChannelPublishJobItem, key: string) {
  const value = getPublishJobMetadata(item)[key];

  return typeof value === 'number' ? value : null;
}

function getPublishJobType(item: ChannelPublishJobItem) {
  return getPublishJobMetadataString(item, 'job_type') ?? getPublishJobMetadataString(item, 'type') ?? 'PUBLISH';
}

function getPublishJobTypeLabel(type: string) {
  const labels: Record<string, string> = {
    BROADCAST: '群发任务',
    PUBLISH: '发布任务',
    RETRY: '重试任务',
    SYNC: '同步任务',
  };

  return labels[type] ?? type;
}

function getPublishJobProgress(item: ChannelPublishJobItem) {
  const explicitPercent = getPublishJobMetadataNumber(item, 'progress_percent');
  const total = getPublishJobMetadataNumber(item, 'total_count') ?? getPublishJobMetadataNumber(item, 'total');
  const completed = getPublishJobMetadataNumber(item, 'completed_count') ?? getPublishJobMetadataNumber(item, 'completed');
  const status = getOperationsItemStatus(item);
  let percent = explicitPercent ?? null;

  if (percent === null && total && total > 0 && completed !== null) {
    percent = Math.round((completed / total) * 100);
  }
  if (percent === null) {
    percent = getPublishJobFallbackProgress(status);
  }

  const safePercent = clampNumber(percent, 0, 100);
  const countLabel = total && total > 0 && completed !== null ? ` · ${formatNumber(completed)}/${formatNumber(total)}` : '';

  return {
    label: `${safePercent}%${countLabel}`,
    percent: safePercent,
  };
}

function getPublishJobFallbackProgress(status: string) {
  if (status === 'SUCCESS') return 100;
  if (status === 'FAILED' || status === 'CANCELED' || status === 'SKIPPED') return 100;
  if (status === 'RUNNING' || status === 'RETRYING') return 50;

  return 0;
}

function getPublishJobPayload(item: ChannelPublishJobItem) {
  return getPublishJobMetadataRecord(item, 'payload') ?? getPublishJobMetadataRecord(item, 'request_payload') ?? null;
}

function getPublishJobResult(item: ChannelPublishJobItem) {
  return getPublishJobMetadataRecord(item, 'result') ?? getPublishJobMetadataRecord(item, 'response_result') ?? null;
}

function getPublishJobPayloadSummary(item: ChannelPublishJobItem) {
  return getRecordSummary(getPublishJobPayload(item));
}

function getPublishJobResultSummary(item: ChannelPublishJobItem) {
  return getRecordSummary(getPublishJobResult(item));
}

function getOperationsItemStatus(item: ChannelOperationsItem) {
  return getOptionalString(item, 'status') ?? 'UNKNOWN';
}

function getOptionalString(item: ChannelOperationsItem, key: string) {
  const value = (item as unknown as Record<string, unknown>)[key];
  return typeof value === 'string' ? value : null;
}

function channelOperationsStatusLabel(status: string) {
  const labels: Record<string, string> = {
    ACTIVE: '启用',
    APPROVED: '已通过',
    CANCELED: '已取消',
    DISABLED: '停用',
    DRAFT: '草稿',
    ERROR: '异常',
    EXPIRED: '已过期',
    FAILED: '失败',
    PENDING: '待处理',
    REJECTED: '已拒绝',
    RETRYING: '重试中',
    RUNNING: '运行中',
    SKIPPED: '已跳过',
    SUCCESS: '成功',
    UNKNOWN: '未知',
  };

  return labels[status] ?? status;
}

function channelOperationsStatusTone(status: string) {
  if (status === 'ACTIVE' || status === 'SUCCESS' || status === 'APPROVED') return 'healthy' as const;
  if (status === 'FAILED' || status === 'ERROR' || status === 'EXPIRED') return 'unavailable' as const;
  if (status === 'PENDING' || status === 'RUNNING' || status === 'RETRYING') return 'degraded' as const;
  if (status === 'DRAFT') return 'mock' as const;

  return 'planned' as const;
}

function reportSeverityTone(status: ChannelReleaseReport['summary']['incident_level']) {
  if (status === 'CRITICAL') return 'unavailable';
  if (status === 'WARN') return 'degraded';

  return 'healthy';
}

function reportSeverityLabel(status: ChannelReleaseReport['summary']['incident_level']) {
  const labels: Record<ChannelReleaseReport['summary']['incident_level'], string> = {
    INFO: '正常',
    WARN: '需关注',
    CRITICAL: '严重',
  };

  return labels[status] ?? status;
}

function diffKindLabel(status: ChannelReleaseReportSnapshotCompareResult['summary_diffs'][number]['kind']) {
  const labels: Record<ChannelReleaseReportSnapshotCompareResult['summary_diffs'][number]['kind'], string> = {
    ADDED: '新增',
    REMOVED: '移除',
    CHANGED: '变更',
    UNCHANGED: '未变',
  };

  return labels[status] ?? status;
}

function diffKindTone(status: ChannelReleaseReportSnapshotCompareResult['summary_diffs'][number]['kind']) {
  if (status === 'ADDED') return 'healthy';
  if (status === 'REMOVED') return 'degraded';
  if (status === 'CHANGED') return 'loading';

  return 'planned';
}

function publishApprovalStatusLabel(status: ChannelPublishApprovalStatus) {
  const labels: Record<ChannelPublishApprovalStatus, string> = {
    NOT_REQUIRED: '免审批',
    PENDING: '待审批',
    APPROVED: '已通过',
    REJECTED: '已拒绝',
  };

  return labels[status] ?? status;
}

function publishApprovalStatusTone(status: ChannelPublishApprovalStatus) {
  if (status === 'APPROVED') return 'healthy';
  if (status === 'PENDING') return 'degraded';
  if (status === 'REJECTED') return 'unavailable';

  return 'planned';
}

function publishRolloutStatusLabel(status: ChannelPublishRolloutStatus) {
  const labels: Record<ChannelPublishRolloutStatus, string> = {
    CLOSED: '未灰度',
    GRAY: '灰度中',
    FULL: '全量',
  };

  return labels[status] ?? status;
}

function publishRolloutStatusTone(status: ChannelPublishRolloutStatus) {
  if (status === 'FULL') return 'healthy';
  if (status === 'GRAY') return 'degraded';

  return 'planned';
}

function channelRolloutGateStatusLabel(status: ChannelRolloutGateStatus) {
  const labels: Record<ChannelRolloutGateStatus, string> = {
    CLOSED: '灰度关闭',
    GRAY: '灰度执行中',
    FULL: '全量放行',
    BLOCKING: '门控阻断',
  };

  return labels[status] ?? status;
}

function channelRolloutGateStatusTone(status: ChannelRolloutGateStatus) {
  if (status === 'FULL') return 'healthy';
  if (status === 'GRAY') return 'degraded';
  if (status === 'BLOCKING') return 'unavailable';

  return 'planned';
}

function channelRolloutDecisionReasonLabel(reason: ChannelRolloutGateDecisionReason) {
  const labels: Record<ChannelRolloutGateDecisionReason, string> = {
    rollout_closed: '灰度关闭，直接放行',
    rollout_full: '全量发布，直接放行',
    rollout_bucket_allowed: '命中灰度桶位',
    rollout_bucket_blocked: '未命中灰度桶位',
    approval_pending: '发布审批未通过',
    channel_unavailable: '渠道不可用',
  };

  return labels[reason] ?? reason;
}

function channelRolloutSourceLabel(source: string) {
  const labels: Record<string, string> = {
    external_channel_chat: '渠道同步调用',
    external_channel_stream: '渠道流式调用',
    external_channel_conversation: '渠道会话续聊',
    external_channel_conversation_stream: '渠道流式续聊',
    channel_callback: '企业 IM / Webhook 回调',
  };

  return labels[source] ?? source;
}

function channelReleaseBatchStatusLabel(status: ChannelReleaseBatchStatus) {
  const labels: Record<ChannelReleaseBatchStatus, string> = {
    IDLE: '空闲',
    PENDING_APPROVAL: '待审批',
    APPROVED: '已审批',
    GRAY: '灰度中',
    FULL: '已全量',
    ROLLED_BACK: '已回滚',
    ABORTED: '已终止',
  };

  return labels[status] ?? status;
}

function channelReleaseBatchStatusTone(status: ChannelReleaseBatchStatus) {
  if (status === 'FULL' || status === 'APPROVED') return 'healthy';
  if (status === 'GRAY' || status === 'PENDING_APPROVAL') return 'degraded';
  if (status === 'ABORTED') return 'unavailable';
  if (status === 'ROLLED_BACK') return 'mock';

  return 'planned';
}

function isReleaseBatchClosedClient(status: ChannelReleaseBatchStatus) {
  return status === 'FULL' || status === 'ROLLED_BACK' || status === 'ABORTED';
}

function releaseStepStatusLabel(status: ChannelReleasePipelineStepStatus) {
  const labels: Record<ChannelReleasePipelineStepStatus, string> = {
    WAITING: '等待',
    CURRENT: '进行中',
    DONE: '完成',
    FAILED: '失败',
    SKIPPED: '跳过',
  };

  return labels[status] ?? status;
}

function releaseStepStatusTone(status: ChannelReleasePipelineStepStatus) {
  if (status === 'DONE') return 'healthy';
  if (status === 'CURRENT') return 'degraded';
  if (status === 'FAILED') return 'unavailable';
  if (status === 'SKIPPED') return 'mock';

  return 'planned';
}

function releaseStepCircleClass(status: ChannelReleasePipelineStepStatus) {
  if (status === 'DONE') return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  if (status === 'CURRENT') return 'border-amber-200 bg-amber-50 text-amber-700';
  if (status === 'FAILED') return 'border-red-200 bg-red-50 text-red-700';
  if (status === 'SKIPPED') return 'border-blue-200 bg-blue-50 text-blue-700';

  return 'border-slate-200 bg-slate-50 text-slate-500';
}

function releaseGateDecisionLabel(status: ChannelReleaseGateDecision) {
  const labels: Record<ChannelReleaseGateDecision, string> = {
    PROMOTE_READY: '可推进全量',
    OBSERVE: '继续观察',
    BLOCKED: '建议阻断',
    DISABLED: '门禁关闭',
    NO_BATCH: '无批次',
  };

  return labels[status] ?? status;
}

function releaseGateDecisionTone(status: ChannelReleaseGateDecision) {
  if (status === 'PROMOTE_READY') return 'healthy';
  if (status === 'OBSERVE') return 'degraded';
  if (status === 'BLOCKED') return 'unavailable';
  if (status === 'DISABLED') return 'mock';

  return 'planned';
}

function defaultReleaseGatePolicy(): ChannelReleaseGatePolicy {
  return {
    enabled: true,
    min_evaluated_count: 50,
    min_allowed_rate: 80,
    max_blocked_count: 20,
    auto_promote_enabled: false,
    observation_window_hours: 24,
    updated_at: null,
  };
}

function releaseAutomationDecisionLabel(status: ChannelReleaseAutomationDecision) {
  const labels: Record<ChannelReleaseAutomationDecision, string> = {
    PROMOTED: '已推进',
    SKIPPED: '已跳过',
    BLOCKED: '已阻断',
    DISABLED: '未启用',
    FAILED: '失败',
  };

  return labels[status] ?? status;
}

function releaseAutomationDecisionTone(status: ChannelReleaseAutomationDecision) {
  if (status === 'PROMOTED') return 'healthy';
  if (status === 'SKIPPED' || status === 'DISABLED') return 'planned';
  if (status === 'BLOCKED') return 'degraded';

  return 'unavailable';
}

function defaultReleaseAutomationPolicy(): ChannelReleaseAutomationPolicy {
  return {
    enabled: false,
    require_auto_promote_policy: true,
    min_interval_minutes: 30,
    max_runs_per_day: 5,
    dry_run: true,
    updated_at: null,
  };
}

function releaseWorkflowModeLabel(status: NonNullable<ChannelReleaseAutomationOverview['workflow_mode']>) {
  const labels: Record<NonNullable<ChannelReleaseAutomationOverview['workflow_mode']>, string> = {
    local: '本地执行',
    temporal_first: 'Temporal 优先',
    temporal: '强制 Temporal',
  };

  return labels[status] ?? status;
}

function releaseWorkflowBackendLabel(status: NonNullable<ChannelReleaseAutomationOverview['workflow_backend']>) {
  const labels: Record<NonNullable<ChannelReleaseAutomationOverview['workflow_backend']>, string> = {
    LOCAL: '本地',
    LOCAL_FALLBACK: '本地兜底',
    TEMPORAL: 'Temporal',
  };

  return labels[status] ?? status;
}

function releaseSelfHealingDecisionLabel(status: ChannelReleaseSelfHealingDecision) {
  const labels: Record<ChannelReleaseSelfHealingDecision, string> = {
    HEALTHY: '健康',
    OBSERVE: '继续观察',
    ROLLBACK_RECOMMENDED: '建议回滚',
    ROLLED_BACK: '已回滚',
    SKIPPED: '已跳过',
    DISABLED: '自愈关闭',
    FAILED: '失败',
  };

  return labels[status] ?? status;
}

function releaseSelfHealingDecisionTone(status: ChannelReleaseSelfHealingDecision) {
  if (status === 'HEALTHY' || status === 'ROLLED_BACK') return 'healthy';
  if (status === 'OBSERVE' || status === 'ROLLBACK_RECOMMENDED') return 'degraded';
  if (status === 'FAILED') return 'unavailable';
  if (status === 'DISABLED' || status === 'SKIPPED') return 'planned';

  return 'planned';
}

function defaultReleaseSelfHealingPolicy(): ChannelReleaseSelfHealingPolicy {
  return {
    enabled: false,
    dry_run: true,
    auto_rollback_enabled: false,
    max_error_requests: 10,
    min_allowed_rate: 90,
    observation_window_hours: 24,
    cooldown_minutes: 30,
    updated_at: null,
  };
}

interface SenderPolicyFormState {
  auto_retry_enabled: boolean;
  manual_retry_enabled: boolean;
  max_retry_count: number;
  retry_backoff_seconds: number;
  retry_on_statuses_text: string;
  alert_on_failure: boolean;
  retention_days: number;
}

function defaultSenderPolicy(): ChannelSenderPolicy {
  return {
    auto_retry_enabled: false,
    manual_retry_enabled: true,
    max_retry_count: 3,
    retry_backoff_seconds: 60,
    retry_on_statuses: [408, 429, 500, 502, 503, 504],
    alert_on_failure: true,
    retention_days: 30,
    updated_at: null,
  };
}

function policyToFormState(policy: ChannelSenderPolicy): SenderPolicyFormState {
  return {
    auto_retry_enabled: policy.auto_retry_enabled,
    manual_retry_enabled: policy.manual_retry_enabled,
    max_retry_count: policy.max_retry_count,
    retry_backoff_seconds: policy.retry_backoff_seconds,
    retry_on_statuses_text: policy.retry_on_statuses.join(','),
    alert_on_failure: policy.alert_on_failure,
    retention_days: policy.retention_days,
  };
}

function parseStatusCodes(value: string): { ok: true; value: number[] } | { ok: false; message: string } {
  const parts = value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  if (parts.length === 0) {
    return {
      ok: true,
      value: [],
    };
  }

  const codes = parts.map((item) => Number(item));
  if (codes.some((code) => !Number.isInteger(code) || code < 400 || code > 599)) {
    return {
      ok: false,
      message: '允许重试的响应码必须是 400-599 之间的整数，并使用英文逗号分隔。',
    };
  }

  return {
    ok: true,
    value: Array.from(new Set(codes)).slice(0, 20),
  };
}

function clampNumber(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min;

  return Math.min(Math.max(Math.trunc(value), min), max);
}

function formatLatency(value: number | null) {
  if (value === null) return '无耗时';
  if (value < 1000) return `${value}ms`;

  return `${(value / 1000).toFixed(1)}s`;
}

function stringifyPretty(value: unknown) {
  if (value === null || value === undefined) return 'null';
  if (typeof value === 'string') return value;

  return JSON.stringify(value, null, 2);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function getRecordSummary(value: Record<string, unknown> | null) {
  if (!value) return '暂无数据';

  const entries = Object.entries(value)
    .filter(([, entryValue]) => entryValue !== null && entryValue !== undefined && typeof entryValue !== 'object')
    .slice(0, 3)
    .map(([key, entryValue]) => `${key}: ${String(entryValue)}`);

  if (entries.length > 0) return entries.join(' · ');

  const keys = Object.keys(value).slice(0, 4);

  return keys.length > 0 ? `包含字段：${keys.join('、')}` : '暂无数据';
}

async function copyText(value: string) {
  try {
    await navigator.clipboard.writeText(value);
  } catch {
    // Clipboard permission can be unavailable in embedded browsers.
  }
}

function toNullable(value: string) {
  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : null;
}

function normalizeNullableString(value: string | null | undefined) {
  const trimmed = value?.trim() ?? '';

  return trimmed.length > 0 ? trimmed : null;
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('zh-CN').format(value);
}
