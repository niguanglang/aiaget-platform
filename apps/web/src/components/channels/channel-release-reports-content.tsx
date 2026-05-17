'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeftRight, Camera, CircleCheck, Scale, Search } from 'lucide-react';

import { ChannelActionConfirmDialog, ChannelAlert, DetailGrid, formatOptionalDateTime, useChannelOperationPermissions } from '@/components/channels/channel-operations-pages';
import { ChannelReleaseHeader, PanelTitle, ReleaseChannelEmpty, ReleaseChannelPicker } from '@/components/channels/channel-release-shared';
import { publishChannelHealthLabel, publishChannelStatusLabel } from '@/components/channels/channel-status';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  compareChannelReleaseReportSnapshots,
  createChannelReleaseReportSnapshot,
  getChannelReleaseReport,
  getChannelReleaseReportSnapshot,
  getPublishChannelOverview,
  listChannelReleaseReportSnapshots,
  type ApiClientError,
} from '@/lib/api-client';

export function ChannelReleaseReportsContent() {
  const queryClient = useQueryClient();
  const permissions = useChannelOperationPermissions();
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  const [releaseReportActionTarget, setReleaseReportActionTarget] = useState<{ channelId: string; channelName: string } | null>(null);
  const [selectedBaseSnapshotId, setSelectedBaseSnapshotId] = useState<string | null>(null);
  const [selectedTargetSnapshotId, setSelectedTargetSnapshotId] = useState<string | null>(null);
  const [snapshotLookupId, setSnapshotLookupId] = useState('');
  const [notice, setNotice] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const overviewQuery = useQuery({ enabled: permissions.canView, queryKey: ['channel-release-reports-channels'], queryFn: getPublishChannelOverview });
  const channels = overviewQuery.data?.channels ?? [];
  const selectedChannel = useMemo(() => channels.find((item) => item.id === selectedChannelId) ?? channels[0] ?? null, [channels, selectedChannelId]);

  const reportQuery = useQuery({
    enabled: permissions.canView && Boolean(selectedChannel),
    queryKey: ['channel-release-report-page', selectedChannel?.id],
    queryFn: () => getChannelReleaseReport(selectedChannel?.id ?? ''),
  });
  const snapshotsQuery = useQuery({
    enabled: permissions.canView && Boolean(selectedChannel),
    queryKey: ['channel-release-report-snapshots-page', selectedChannel?.id],
    queryFn: () => listChannelReleaseReportSnapshots(selectedChannel?.id ?? ''),
  });
  const snapshotDetailQuery = useQuery({
    enabled: permissions.canView && Boolean(selectedChannel && snapshotLookupId.trim()),
    queryKey: ['channel-release-report-snapshot-detail-page', selectedChannel?.id, snapshotLookupId],
    queryFn: () => getChannelReleaseReportSnapshot(selectedChannel?.id ?? '', snapshotLookupId.trim()),
  });
  const compareQuery = useQuery({
    enabled:
      permissions.canView &&
      Boolean(selectedChannel && selectedBaseSnapshotId && selectedTargetSnapshotId && selectedBaseSnapshotId !== selectedTargetSnapshotId),
    queryKey: ['channel-release-report-snapshot-compare-page', selectedChannel?.id, selectedBaseSnapshotId, selectedTargetSnapshotId],
    queryFn: () => compareChannelReleaseReportSnapshots(selectedChannel?.id ?? '', selectedBaseSnapshotId ?? '', selectedTargetSnapshotId ?? ''),
  });
  const snapshotMutation = useMutation({
    mutationFn: createChannelReleaseReportSnapshot,
    onSuccess: async (_result, channelId) => {
      setNotice('复盘快照已创建。');
      setActionError(null);
      setReleaseReportActionTarget(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['channel-release-report-snapshots-page', channelId] }),
        queryClient.invalidateQueries({ queryKey: ['channel-release-report-page', channelId] }),
      ]);
    },
    onError: (error: ApiClientError) => {
      setNotice(null);
      setActionError(error.message);
    },
  });

  const report = reportQuery.data ?? null;
  const snapshots = snapshotsQuery.data?.items ?? [];
  const snapshotDetail = snapshotDetailQuery.data ?? null;
  const compareResult = compareQuery.data ?? null;

  useEffect(() => {
    if (snapshots.length === 0) {
      setSelectedBaseSnapshotId(null);
      setSelectedTargetSnapshotId(null);
      setSnapshotLookupId('');
      return;
    }
    if (!selectedBaseSnapshotId || !snapshots.some((item) => item.snapshot_id === selectedBaseSnapshotId)) {
      setSelectedBaseSnapshotId(snapshots[0]?.snapshot_id ?? null);
    }
    if (!selectedTargetSnapshotId || !snapshots.some((item) => item.snapshot_id === selectedTargetSnapshotId)) {
      setSelectedTargetSnapshotId(snapshots[1]?.snapshot_id ?? snapshots[0]?.snapshot_id ?? null);
    }
  }, [selectedBaseSnapshotId, selectedTargetSnapshotId, snapshots]);

  return (
    <main className="mx-auto grid max-w-[1680px] gap-5 rounded-xl border border-slate-200/80 bg-white/[0.9] px-4 py-5 shadow-sm lg:px-6">
      <ChannelReleaseHeader
        badge="发布复盘报告"
        refreshing={overviewQuery.isFetching || reportQuery.isFetching || snapshotsQuery.isFetching || snapshotMutation.isPending}
        title="发布复盘报告"
        onRefresh={() => {
          void overviewQuery.refetch();
          void reportQuery.refetch();
          void snapshotsQuery.refetch();
          void snapshotDetailQuery.refetch();
          void compareQuery.refetch();
        }}
      />
      <ChannelAlert message={notice} tone="ready" />
      <ChannelAlert message={actionError ?? (overviewQuery.isError || reportQuery.isError || snapshotsQuery.isError ? '发布复盘报告加载失败。' : null)} tone="error" />
      <ReleaseChannelPicker channels={channels} selectedChannel={selectedChannel} onSelect={setSelectedChannelId} />
      {!selectedChannel ? (
        <ReleaseChannelEmpty />
      ) : !report ? (
        <Card className="p-5">
          <EmptyState title="暂无复盘报告" />
        </Card>
      ) : (
        <>
          <Card className="grid gap-4 p-5">
            <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
              <PanelTitle title="报告摘要" />
              <Button
                disabled={!permissions.canManage || snapshotMutation.isPending}
                onClick={() => setReleaseReportActionTarget({ channelId: selectedChannel.id, channelName: selectedChannel.name })}
                type="button"
                variant="outline"
              >
                <Camera className="size-4" />
                创建快照
              </Button>
            </div>
            <DetailGrid
              items={[
                { label: '渠道', value: report.channel_name },
                { label: '结论', value: report.summary.conclusion },
                { label: '事件等级', value: report.summary.incident_level },
                { label: '健康状态', value: publishChannelHealthLabel(report.summary.health_status) },
                { label: '发布状态', value: publishChannelStatusLabel(report.summary.publish_status) },
                { label: '窗口', value: `${report.report_window_hours} 小时` },
              ]}
            />
            <div className="grid gap-3">
              <div className="text-sm font-semibold">报告正文</div>
              <pre className="max-h-96 overflow-auto rounded-md border bg-slate-950 px-3 py-3 text-xs leading-6 text-slate-100">
                {report.markdown}
              </pre>
            </div>
          </Card>
          <Card className="grid gap-4 p-5">
            <PanelTitle title="风险建议" />
            {report.risks.length === 0 ? (
              <EmptyState title="暂无风险建议" />
            ) : (
              <div className="grid gap-2">
                {report.risks.map((risk) => (
                  <div className="rounded-md border bg-muted/20 p-3" key={risk.title}>
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-medium">{risk.title}</div>
                      <StatusBadge tone={risk.severity === 'CRITICAL' ? 'unavailable' : risk.severity === 'WARN' ? 'degraded' : 'ready'}>{risk.severity}</StatusBadge>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{risk.recommendation}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>
          <Card className="grid gap-4 p-5">
            <PanelTitle title="复盘快照" />
            {snapshots.length === 0 ? (
              <EmptyState title="暂无复盘快照" />
            ) : (
              <div className="grid gap-2">
                {snapshots.map((snapshot) => (
                  <div className="grid gap-3 rounded-md border bg-muted/20 p-3" key={snapshot.snapshot_id}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <div className="text-sm font-medium">{snapshot.conclusion}</div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          {formatOptionalDateTime(snapshot.created_at)} · {snapshot.snapshot_id}
                        </div>
                      </div>
                      <StatusBadge tone={snapshot.incident_level === 'CRITICAL' ? 'unavailable' : snapshot.incident_level === 'WARN' ? 'degraded' : 'ready'}>
                        {snapshot.incident_level}
                      </StatusBadge>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button onClick={() => setSnapshotLookupId(snapshot.snapshot_id)} size="sm" type="button" variant="outline">
                        <Search className="size-4" />
                        查看快照
                      </Button>
                      <Button
                        onClick={() => setSelectedBaseSnapshotId(snapshot.snapshot_id)}
                        size="sm"
                        type="button"
                        variant={selectedBaseSnapshotId === snapshot.snapshot_id ? 'default' : 'outline'}
                      >
                        <CircleCheck className="size-4" />
                        设为基准
                      </Button>
                      <Button
                        onClick={() => setSelectedTargetSnapshotId(snapshot.snapshot_id)}
                        size="sm"
                        type="button"
                        variant={selectedTargetSnapshotId === snapshot.snapshot_id ? 'default' : 'outline'}
                      >
                        <ArrowLeftRight className="size-4" />
                        设为对比
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
          <section className="grid gap-4 xl:grid-cols-2">
            <Card className="grid gap-4 p-5">
              <div className="flex items-center justify-between gap-2">
                <PanelTitle title="快照详情" />
                <StatusBadge tone="mock">{snapshotLookupId.trim() || '未选择'}</StatusBadge>
              </div>
              <div className="flex flex-wrap gap-2">
                <Input
                  className="max-w-sm"
                  onChange={(event) => setSnapshotLookupId(event.target.value)}
                  placeholder="输入快照 ID"
                  value={snapshotLookupId}
                />
                <Button disabled={!snapshotLookupId.trim()} onClick={() => setSnapshotLookupId((current) => current.trim())} type="button" variant="outline">
                  <Search className="size-4" />
                  查看快照
                </Button>
              </div>
              {snapshotDetailQuery.isLoading ? (
                <EmptyState title="加载中" />
              ) : snapshotDetailQuery.isError ? (
                <EmptyState title="快照详情不可用" />
              ) : !snapshotDetail ? (
                <EmptyState title="暂无快照详情" />
              ) : (
                <div className="grid gap-4">
                  <DetailGrid
                    items={[
                      { label: '快照 ID', value: snapshotDetail.snapshot_id },
                      { label: '渠道', value: snapshotDetail.channel_name },
                      { label: '结论', value: snapshotDetail.conclusion },
                      { label: '事件等级', value: snapshotDetail.incident_level },
                      { label: '创建时间', value: formatOptionalDateTime(snapshotDetail.created_at) },
                      { label: '创建人', value: snapshotDetail.created_by ?? '系统' },
                      { label: 'Trace ID', value: snapshotDetail.trace_id ?? '未记录' },
                      { label: '来源事件', value: snapshotDetail.event_id },
                    ]}
                  />
                  <div className="grid gap-2">
                    <div className="text-sm font-semibold">归档报告正文</div>
                    <pre className="max-h-80 overflow-auto rounded-md border bg-slate-950 px-3 py-3 text-xs leading-6 text-slate-100">
                      {snapshotDetail.report.markdown}
                    </pre>
                  </div>
                  <div className="grid gap-2">
                    <div className="text-sm font-semibold">来源事件</div>
                    <DetailGrid
                      items={[
                        { label: '事件类型', value: snapshotDetail.source_event.event_type },
                        { label: '事件状态', value: snapshotDetail.source_event.status },
                        { label: '事件摘要', value: snapshotDetail.source_event.summary },
                        { label: '来源系统', value: snapshotDetail.source_event.source_system },
                      ]}
                    />
                  </div>
                </div>
              )}
            </Card>
            <Card className="grid gap-4 p-5">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <PanelTitle title="报告版本对比" />
                <StatusBadge tone={compareResult ? 'ready' : 'planned'}>{compareResult ? '已对比' : '待选择快照'}</StatusBadge>
              </div>
              <div className="grid gap-3">
                <DetailGrid
                  items={[
                    { label: '基准快照', value: selectedBaseSnapshotId ?? '未选择' },
                    { label: '对比快照', value: selectedTargetSnapshotId ?? '未选择' },
                  ]}
                />
                <div className="flex flex-wrap gap-2">
                  <Button
                    disabled={!selectedBaseSnapshotId || !selectedTargetSnapshotId || selectedBaseSnapshotId === selectedTargetSnapshotId}
                    onClick={() => {
                      setSelectedBaseSnapshotId((current) => current?.trim() || null);
                      setSelectedTargetSnapshotId((current) => current?.trim() || null);
                    }}
                    type="button"
                    variant="outline"
                  >
                    <Scale className="size-4" />
                    开始对比
                  </Button>
                  <Button
                    onClick={() => {
                      if (snapshots[0]?.snapshot_id) setSelectedBaseSnapshotId(snapshots[0].snapshot_id);
                      if (snapshots[1]?.snapshot_id) setSelectedTargetSnapshotId(snapshots[1].snapshot_id);
                    }}
                    type="button"
                    variant="ghost"
                  >
                    自动选前两项
                  </Button>
                </div>
              </div>
              {compareQuery.isLoading ? (
                <EmptyState title="对比加载中" />
              ) : compareQuery.isError ? (
                <EmptyState title="报告版本对比不可用" />
              ) : !compareResult ? (
                <EmptyState title="暂无对比结果" />
              ) : (
                <div className="grid gap-4">
                  <DetailGrid
                    items={[
                      { label: '变化数', value: String(compareResult.summary.changed_count) },
                      { label: '新增数', value: String(compareResult.summary.added_count) },
                      { label: '移除数', value: String(compareResult.summary.removed_count) },
                      { label: '严重差异', value: String(compareResult.summary.critical_change_count) },
                      { label: '结论', value: compareResult.summary.conclusion },
                    ]}
                  />
                  <DiffSection title="摘要差异" items={compareResult.summary_diffs} />
                  <DiffSection title="指标差异" items={compareResult.metric_diffs} />
                  <DiffSection title="风险差异" items={compareResult.risk_diffs} />
                  <DiffSection title="时间线差异" items={compareResult.timeline_diffs} />
                </div>
              )}
            </Card>
          </section>
        </>
      )}
      {releaseReportActionTarget ? (
        <ChannelActionConfirmDialog
          body={`确认为发布渠道“${releaseReportActionTarget.channelName}”创建复盘快照？系统会把当前发布复盘结论、风险建议和窗口指标写入快照留痕，影响范围仅限此渠道。`}
          confirmLabel="确认创建"
          onCancel={() => setReleaseReportActionTarget(null)}
          onConfirm={() => snapshotMutation.mutate(releaseReportActionTarget.channelId)}
          pending={snapshotMutation.isPending}
          title="确认创建复盘快照"
        />
      ) : null}
    </main>
  );
}

function DiffSection({
  items,
  title,
}: {
  items: Array<{
    after: string | null;
    before: string | null;
    field: string;
    kind: 'ADDED' | 'REMOVED' | 'CHANGED' | 'UNCHANGED';
    label: string;
    severity: 'INFO' | 'WARN' | 'CRITICAL';
  }>;
  title: string;
}) {
  return (
    <div className="grid gap-2">
      <div className="text-sm font-semibold">{title}</div>
      {items.length === 0 ? (
        <EmptyState title="无差异" />
      ) : (
        <div className="grid gap-2">
          {items.map((item) => (
            <div className="grid gap-2 rounded-md border bg-muted/20 p-3" key={item.field}>
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge tone={item.severity === 'CRITICAL' ? 'unavailable' : item.severity === 'WARN' ? 'degraded' : 'ready'}>
                  {item.kind}
                </StatusBadge>
                <div className="text-sm font-medium">{item.label}</div>
              </div>
              <div className="grid gap-2 text-xs text-muted-foreground md:grid-cols-2">
                <div>
                  <div className="font-medium text-foreground">变更前</div>
                  <div className="mt-1 break-words">{item.before ?? '无'}</div>
                </div>
                <div>
                  <div className="font-medium text-foreground">变更后</div>
                  <div className="mt-1 break-words">{item.after ?? '无'}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
