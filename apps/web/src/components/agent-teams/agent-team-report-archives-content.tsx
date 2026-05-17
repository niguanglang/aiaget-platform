'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { hasPermission, type AgentTeamRunReportArchiveApprovalItem, type AgentTeamRunReportArchiveItem } from '@aiaget/shared-types';
import {
  ArrowLeft,
  CheckCircle2,
  Download,
  FileArchive,
  FileSpreadsheet,
  FileText,
  FolderArchive,
  PanelRight,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  UploadCloud,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';

import { AgentTeamConfirmDialog } from '@/components/agent-teams/agent-team-confirm-dialog';
import {
  archiveApprovalStatusLabel,
  archiveApprovalStatusTone,
  formatBytes,
  formatDateTime,
  formatInteger,
  nullableText,
} from '@/components/agent-teams/agent-teams-shared';
import { useAuth } from '@/components/auth/auth-provider';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  approveAgentTeamRunReportArchiveApproval,
  deleteAgentTeamRunReportArchive,
  getAgentTeamRunReportArchiveDownloadUrl,
  listAgentTeams,
  listAgentTeamRunReportArchiveApprovals,
  listAgentTeamRunReportArchives,
  rejectAgentTeamRunReportArchiveApproval,
  uploadAgentTeamRunReportArchive,
  type ApiClientError,
} from '@/lib/api-client';

type ArchiveDeleteTarget = {
  id: string;
  fileName: string;
};

type ApprovalDecisionTarget = {
  id: string;
  fileName: string;
  decision: 'APPROVE' | 'REJECT';
};

type UploadTarget = {
  fileName: string;
  fileSize: number;
  teamId: string;
};

type UploadFormState = {
  teamId: string;
  runId: string;
  reportType: 'ACCEPTANCE' | 'OPERATION' | 'ANALYSIS' | 'CUSTOM';
  archiveReason: string;
};

const layoutRootClassName = 'mx-auto grid max-w-[1536px] gap-5 px-4 py-5 lg:px-7 xl:grid-cols-[minmax(0,1fr)_360px] 2xl:grid-cols-[minmax(0,1fr)_400px]';
const sidePanelClassName = 'rounded-xl border border-slate-200/80 bg-white/[0.9] shadow-[0_18px_55px_rgba(15,23,42,0.06)] backdrop-blur-xl';
const cardClassName = 'rounded-xl border border-slate-200/80 bg-white/[0.86] shadow-[0_16px_45px_rgba(15,23,42,0.06)] backdrop-blur-xl';

const fileTypeOptions = ['PDF', 'CSV', 'XLSX', 'DOCX', 'PPTX'] as const;
const reportTypeOptions = [
  { label: '验收报告', value: 'ACCEPTANCE' },
  { label: '运营报告', value: 'OPERATION' },
  { label: '分析报告', value: 'ANALYSIS' },
  { label: '其他', value: 'CUSTOM' },
] as const;

export function AgentTeamReportArchivesContent() {
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();
  const [keyword, setKeyword] = useState('');
  const [teamKeyword, setTeamKeyword] = useState('');
  const [fileType, setFileType] = useState('');
  const [approvalStatus, setApprovalStatus] = useState('');
  const [decisionNote, setDecisionNote] = useState('');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadForm, setUploadForm] = useState<UploadFormState>({
    archiveReason: '',
    reportType: 'OPERATION',
    runId: '',
    teamId: '',
  });
  const [uploadTarget, setUploadTarget] = useState<UploadTarget | null>(null);
  const [archiveDeleteTarget, setArchiveDeleteTarget] = useState<ArchiveDeleteTarget | null>(null);
  const [approvalDecisionTarget, setApprovalDecisionTarget] = useState<ApprovalDecisionTarget | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const permissions = currentUser?.user.permissions ?? [];
  const isTenantAdmin = Boolean(currentUser?.user.roles.some((role) => role.code === 'tenant_admin'));
  const canReview = isTenantAdmin || hasPermission(permissions, 'security:approval:handle');

  const archivesQuery = useQuery({
    queryKey: ['agent-team-run-report-archives'],
    queryFn: listAgentTeamRunReportArchives,
  });
  const teamsQuery = useQuery({
    queryKey: ['agent-team-report-archive-upload-teams'],
    queryFn: () => listAgentTeams({ page: 1, page_size: 100 }),
  });
  const approvalsQuery = useQuery({
    queryKey: ['agent-team-run-report-archive-approvals'],
    queryFn: listAgentTeamRunReportArchiveApprovals,
  });

  const downloadMutation = useMutation({
    mutationFn: getAgentTeamRunReportArchiveDownloadUrl,
    onSuccess: (result) => {
      window.location.href = result.url;
      setActionError(null);
    },
    onError: (error: ApiClientError) => setActionError(error.message),
  });
  const deleteMutation = useMutation({
    mutationFn: deleteAgentTeamRunReportArchive,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['agent-team-run-report-archives'] }),
        queryClient.invalidateQueries({ queryKey: ['agent-team-run-report-archive-approvals'] }),
      ]);
      setArchiveDeleteTarget(null);
      setActionError(null);
    },
    onError: (error: ApiClientError) => setActionError(error.message),
  });
  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!selectedFile) {
        throw new Error('请选择报告文件。');
      }
      if (!uploadForm.teamId) {
        throw new Error('请选择所属团队。');
      }

      return uploadAgentTeamRunReportArchive(uploadForm.teamId, {
        archive_reason: nullableText(uploadForm.archiveReason),
        content_base64: await fileToBase64(selectedFile),
        content_type: selectedFile.type || reportArchiveContentType(selectedFile.name),
        file_name: selectedFile.name,
        report_type: uploadForm.reportType,
        run_id: nullableText(uploadForm.runId),
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['agent-team-run-report-archives'] });
      setSelectedFile(null);
      setUploadTarget(null);
      setIsUploadOpen(false);
      setUploadForm((current) => ({ ...current, archiveReason: '', runId: '' }));
      setActionError(null);
    },
    onError: (error: ApiClientError | Error) => setActionError(error.message),
  });
  const approveMutation = useMutation({
    mutationFn: (approvalId: string) => approveAgentTeamRunReportArchiveApproval(approvalId, { decision_note: nullableText(decisionNote) }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['agent-team-run-report-archives'] }),
        queryClient.invalidateQueries({ queryKey: ['agent-team-run-report-archive-approvals'] }),
      ]);
      setDecisionNote('');
      setApprovalDecisionTarget(null);
      setActionError(null);
    },
    onError: (error: ApiClientError) => setActionError(error.message),
  });
  const rejectMutation = useMutation({
    mutationFn: (approvalId: string) => rejectAgentTeamRunReportArchiveApproval(approvalId, { decision_note: nullableText(decisionNote) }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['agent-team-run-report-archive-approvals'] });
      setDecisionNote('');
      setApprovalDecisionTarget(null);
      setActionError(null);
    },
    onError: (error: ApiClientError) => setActionError(error.message),
  });

  const archives = archivesQuery.data?.items ?? [];
  const teams = teamsQuery.data?.items ?? [];
  const approvals = approvalsQuery.data ?? [];
  const pendingApprovals = approvals.filter((item) => item.status === 'PENDING');
  const activeApproval = pendingApprovals[0] ?? approvals[0] ?? null;

  const filteredArchives = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();
    const normalizedTeamKeyword = teamKeyword.trim().toLowerCase();

    return archives.filter((archive) => {
      const fileName = archive.file_name.toLowerCase();
      const key = archive.key.toLowerCase();
      const teamName = (archive.team_name ?? '').toLowerCase();
      const runObjective = (archive.run_objective ?? '').toLowerCase();
      const matchesKeyword = !normalizedKeyword || fileName.includes(normalizedKeyword) || key.includes(normalizedKeyword) || runObjective.includes(normalizedKeyword);
      const matchesTeam = !normalizedTeamKeyword || teamName.includes(normalizedTeamKeyword) || (archive.team_id ?? '').toLowerCase().includes(normalizedTeamKeyword);
      const matchesFileType = !fileType || archiveFileType(archive) === fileType;

      return matchesKeyword && matchesTeam && matchesFileType;
    });
  }, [archives, fileType, keyword, teamKeyword]);

  const filteredApprovals = useMemo(
    () => approvals.filter((approval) => !approvalStatus || approval.status === approvalStatus),
    [approvalStatus, approvals],
  );

  const metrics = useMemo(
    () => [
      {
        helper: `显示 ${formatInteger(filteredArchives.length)} 条`,
        icon: FolderArchive,
        iconClassName: 'bg-blue-100 text-blue-700',
        label: '归档文件',
        value: formatInteger(archivesQuery.data?.summary.archive_count ?? archives.length),
      },
      {
        helper: `${formatInteger(archives.length)} 个文件`,
        icon: FileArchive,
        iconClassName: 'bg-emerald-100 text-emerald-700',
        label: '归档容量',
        value: formatBytes(archivesQuery.data?.summary.total_size_bytes ?? 0),
      },
      {
        helper: '删除审批',
        icon: PanelRight,
        iconClassName: 'bg-amber-100 text-amber-700',
        label: '待审批',
        value: formatInteger(pendingApprovals.length),
      },
    ],
    [archives.length, archivesQuery.data?.summary.archive_count, archivesQuery.data?.summary.total_size_bytes, filteredArchives.length, pendingApprovals.length],
  );

  function confirmApprovalDecision() {
    if (!approvalDecisionTarget) return;

    if (approvalDecisionTarget.decision === 'APPROVE') {
      approveMutation.mutate(approvalDecisionTarget.id);
      return;
    }

    rejectMutation.mutate(approvalDecisionTarget.id);
  }

  function refreshData() {
    void queryClient.invalidateQueries({ queryKey: ['agent-team-run-report-archives'] });
    void queryClient.invalidateQueries({ queryKey: ['agent-team-run-report-archive-approvals'] });
  }

  function resetFilters() {
    setKeyword('');
    setTeamKeyword('');
    setFileType('');
    setApprovalStatus('');
  }

  function prepareUpload() {
    if (!selectedFile || !uploadForm.teamId) return;

    setUploadTarget({
      fileName: selectedFile.name,
      fileSize: selectedFile.size,
      teamId: uploadForm.teamId,
    });
  }

  function confirmUpload() {
    uploadMutation.mutate();
  }

  return (
    <main className={layoutRootClassName}>
      <div className="grid min-w-0 gap-5">
        <section className="flex flex-col justify-between gap-4 py-3 md:flex-row md:items-center">
          <div className="flex flex-wrap items-center gap-3">
            <Button asChild className="h-9 border-slate-200 bg-white px-3 text-slate-700 shadow-sm hover:bg-slate-50" variant="outline">
              <Link href="/agent-teams">
                <ArrowLeft className="size-4" />
                返回
              </Link>
            </Button>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-950">Agent 团队报告归档</h1>
            <StatusBadge tone="healthy">报告归档</StatusBadge>
            <StatusBadge tone={canReview ? 'ready' : 'planned'}>{canReview ? '可审批' : '只读'}</StatusBadge>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button className="h-9" onClick={refreshData} type="button" variant="outline">
              <RotateCcw className="size-4" />
              刷新
            </Button>
            <Button asChild className="h-9 bg-blue-600 px-5 shadow-[0_12px_26px_rgba(37,99,235,0.28)] hover:bg-blue-700">
              <Link href="/agent-teams">
                <Plus className="size-4" />
                创建归档
              </Link>
            </Button>
            <Button className="h-9 bg-blue-600 px-5 shadow-[0_12px_26px_rgba(37,99,235,0.28)] hover:bg-blue-700" onClick={() => setIsUploadOpen(true)} type="button">
              <UploadCloud className="size-4" />
              上传报告
            </Button>
          </div>
        </section>

        <section className={cardClassName}>
          <div className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-[minmax(240px,1fr)_220px_180px_180px_150px]">
            <label className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm shadow-sm">
              <Search className="size-4 text-muted-foreground" />
              <input
                className="min-w-0 flex-1 bg-transparent outline-none"
                onChange={(event) => setKeyword(event.target.value)}
                placeholder="请输入报告名称"
                value={keyword}
              />
            </label>
            <label className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm shadow-sm">
              <Search className="size-4 text-muted-foreground" />
              <input
                className="min-w-0 flex-1 bg-transparent outline-none"
                onChange={(event) => setTeamKeyword(event.target.value)}
                placeholder="请输入团队"
                value={teamKeyword}
              />
            </label>
            <select
              className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm shadow-sm outline-none transition-colors hover:border-blue-200"
              onChange={(event) => setFileType(event.target.value)}
              value={fileType}
            >
              <option value="">文件类型</option>
              {fileTypeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <select
              className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm shadow-sm outline-none transition-colors hover:border-blue-200"
              onChange={(event) => setApprovalStatus(event.target.value)}
              value={approvalStatus}
            >
              <option value="">审批状态</option>
              <option value="PENDING">待审批</option>
              <option value="APPROVED">已通过</option>
              <option value="REJECTED">已拒绝</option>
              <option value="APPLIED">已删除</option>
            </select>
            <Button className="h-10" onClick={resetFilters} type="button" variant="outline">
              <RotateCcw className="size-4" />
              重置
            </Button>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {metrics.map((metric) => {
            const Icon = metric.icon;

            return (
              <div className="flex min-h-[124px] items-center gap-5 rounded-xl border border-slate-200/80 bg-white/[0.86] px-6 py-5 shadow-[0_16px_45px_rgba(15,23,42,0.06)] backdrop-blur-xl" key={metric.label}>
                <span className={`grid size-14 shrink-0 place-items-center rounded-full ${metric.iconClassName}`}>
                  <Icon className="size-7" />
                </span>
                <div>
                  <div className="text-sm font-medium text-slate-500">{metric.label}</div>
                  <div className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">{metric.value}</div>
                  <div className="mt-2 text-sm text-muted-foreground">{metric.helper}</div>
                </div>
              </div>
            );
          })}
        </section>

        {actionError ? <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{actionError}</div> : null}

        <section className="overflow-hidden rounded-xl border border-slate-200/80 bg-white/[0.86] shadow-[0_18px_55px_rgba(15,23,42,0.06)] backdrop-blur-xl">
          <div className="flex flex-col justify-between gap-3 border-b border-slate-200/80 px-5 py-4 md:flex-row md:items-center">
            <h2 className="text-lg font-semibold text-slate-950">报告归档列表</h2>
            <div className="text-sm text-muted-foreground">
              显示 {filteredArchives.length} / {archivesQuery.data?.total ?? 0}
            </div>
          </div>
          {archivesQuery.isError ? (
            <div className="p-6 text-sm text-destructive">加载失败。</div>
          ) : archivesQuery.isLoading ? (
            <div className="p-6 text-sm text-muted-foreground">正在加载...</div>
          ) : filteredArchives.length === 0 ? (
            <div className="p-10 text-center">
              <div className="font-medium">暂无数据</div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1120px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200/80 bg-slate-50/70">
                    {['文件名称', '团队', '来源', '类型', '大小', '归档人', '归档时间', '状态', '操作'].map((column) => (
                      <th className="px-5 py-4 font-medium text-slate-500" key={column}>
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredArchives.map((archive) => (
                    <tr className="border-b border-slate-100 transition-colors last:border-0 hover:bg-slate-50/70" key={archive.id}>
                      <td className="px-5 py-4">
                        <div className="flex max-w-[360px] items-center gap-3">
                          <FileTypeIcon archive={archive} />
                          <span className="min-w-0">
                            <span className="block truncate font-medium text-slate-900">{archive.file_name}</span>
                            <span className="mt-1 block truncate text-xs text-muted-foreground">{archive.run_id ?? archive.key}</span>
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-muted-foreground">{archive.team_name ?? archive.team_id ?? '-'}</td>
                      <td className="px-5 py-4">
                        <StatusBadge tone={archive.source === 'MANUAL_UPLOAD' ? 'mock' : 'planned'}>{sourceLabel(archive.source)}</StatusBadge>
                      </td>
                      <td className="px-5 py-4">
                        <FileTypeBadge type={archive.report_type ? reportTypeLabel(archive.report_type) : archiveFileType(archive)} />
                      </td>
                      <td className="px-5 py-4 font-medium text-slate-900">{formatBytes(archive.size_bytes)}</td>
                      <td className="px-5 py-4 text-muted-foreground">{archive.created_by ?? '-'}</td>
                      <td className="px-5 py-4 text-muted-foreground">{formatDateTime(archive.last_modified)}</td>
                      <td className="px-5 py-4">
                        <StatusBadge tone={hasPendingDeleteApproval(archive, approvals) ? 'degraded' : 'healthy'}>
                          {hasPendingDeleteApproval(archive, approvals) ? '待审批' : '已归档'}
                        </StatusBadge>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex gap-2">
                          <Button
                            className="size-9 rounded-lg p-0"
                            disabled={downloadMutation.isPending}
                            onClick={() => downloadMutation.mutate(archive.id)}
                            size="sm"
                            title="下载"
                            variant="outline"
                          >
                            <Download className="size-4" />
                          </Button>
                          <Button
                            className="size-9 rounded-lg p-0 text-orange-600 hover:text-orange-700"
                            disabled={deleteMutation.isPending || hasPendingDeleteApproval(archive, approvals)}
                            onClick={() => setArchiveDeleteTarget({ id: archive.id, fileName: archive.file_name })}
                            size="sm"
                            title="删除申请"
                            variant="outline"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      <aside className={`${sidePanelClassName} h-fit overflow-hidden xl:sticky xl:top-24`}>
        <div className="flex items-center justify-between border-b border-slate-200/80 px-5 py-4">
          <div className="flex items-center gap-2">
            <PanelRight className="size-5 text-slate-500" />
            <h2 className="text-lg font-semibold text-slate-950">删除审批</h2>
          </div>
          <StatusBadge tone="degraded">{formatInteger(pendingApprovals.length)}</StatusBadge>
        </div>

        <div className="grid gap-4 p-5">
          {approvalsQuery.isError ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">加载失败。</div>
          ) : approvalsQuery.isLoading ? (
            <div className="text-sm text-muted-foreground">正在加载...</div>
          ) : filteredApprovals.length === 0 ? (
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">暂无数据</div>
          ) : (
            <>
              <ApprovalSummary approval={activeApproval} />

              <div className="grid gap-2">
                <label className="text-sm font-medium text-slate-900" htmlFor="archive-approval-note">
                  审批意见
                </label>
                <textarea
                  className="min-h-24 w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition-colors placeholder:text-slate-400 focus:border-blue-300"
                  id="archive-approval-note"
                  maxLength={200}
                  onChange={(event) => setDecisionNote(event.target.value)}
                  placeholder="请输入审批意见"
                  value={decisionNote}
                />
                <div className="text-right text-xs text-muted-foreground">{decisionNote.length}/200</div>
              </div>

              <div className="grid gap-3">
                {filteredApprovals.slice(0, 5).map((approval) => (
                  <ApprovalListItem
                    approval={approval}
                    canReview={canReview}
                    key={approval.id}
                    onApprove={() => setApprovalDecisionTarget({ id: approval.id, fileName: approval.archive_file_name, decision: 'APPROVE' })}
                    onReject={() => setApprovalDecisionTarget({ id: approval.id, fileName: approval.archive_file_name, decision: 'REJECT' })}
                    pending={approveMutation.isPending || rejectMutation.isPending}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </aside>

      {isUploadOpen ? (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/30 backdrop-blur-sm">
          <button aria-label="关闭上传报告" className="absolute inset-0 cursor-default" onClick={() => setIsUploadOpen(false)} type="button" />
          <section className="relative grid h-full w-full max-w-[520px] grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">上传报告</h2>
                <div className="mt-1 text-sm text-muted-foreground">人工补录归档</div>
              </div>
              <Button className="size-9 rounded-lg p-0" onClick={() => setIsUploadOpen(false)} type="button" variant="outline">
                <XCircle className="size-4" />
              </Button>
            </div>

            <div className="grid content-start gap-5 overflow-y-auto px-6 py-5">
              <label className="grid gap-2 text-sm">
                <span className="font-medium text-slate-900">所属团队</span>
                <select
                  className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none transition-colors hover:border-blue-200"
                  onChange={(event) => setUploadForm((current) => ({ ...current, teamId: event.target.value }))}
                  value={uploadForm.teamId}
                >
                  <option value="">请选择团队</option>
                  {teams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2 text-sm">
                <span className="font-medium text-slate-900">关联运行</span>
                <input
                  className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none transition-colors placeholder:text-slate-400 hover:border-blue-200"
                  onChange={(event) => setUploadForm((current) => ({ ...current, runId: event.target.value }))}
                  placeholder="运行 ID，可选"
                  value={uploadForm.runId}
                />
              </label>

              <label className="grid gap-2 text-sm">
                <span className="font-medium text-slate-900">报告类型</span>
                <select
                  className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none transition-colors hover:border-blue-200"
                  onChange={(event) => setUploadForm((current) => ({ ...current, reportType: event.target.value as UploadFormState['reportType'] }))}
                  value={uploadForm.reportType}
                >
                  {reportTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2 text-sm" htmlFor="agent-team-report-upload-file">
                <span className="font-medium text-slate-900">报告文件</span>
                <input
                  accept=".pdf,.docx,.xlsx,.pptx,.csv"
                  className="sr-only"
                  id="agent-team-report-upload-file"
                  onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
                  type="file"
                />
                <span className="flex min-h-12 cursor-pointer items-center justify-between gap-3 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 text-sm transition-colors hover:border-blue-300">
                  <span className="min-w-0 truncate text-muted-foreground">{selectedFile ? selectedFile.name : '选择 PDF、DOCX、XLSX、PPTX、CSV 文件'}</span>
                  <span className="shrink-0 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600">浏览</span>
                </span>
              </label>

              {selectedFile ? (
                <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
                  <div className="min-w-0">
                    <div className="truncate font-medium text-slate-900">{selectedFile.name}</div>
                    <div className="mt-1 text-xs text-muted-foreground">{formatBytes(selectedFile.size)} · {selectedFile.type || reportArchiveContentType(selectedFile.name)}</div>
                  </div>
                  <FileArchive className="size-5 text-blue-600" />
                </div>
              ) : null}

              <label className="grid gap-2 text-sm">
                <span className="font-medium text-slate-900">归档说明</span>
                <textarea
                  className="min-h-24 resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition-colors placeholder:text-slate-400 hover:border-blue-200"
                  maxLength={500}
                  onChange={(event) => setUploadForm((current) => ({ ...current, archiveReason: event.target.value }))}
                  placeholder="请输入归档说明，可选"
                  value={uploadForm.archiveReason}
                />
              </label>
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-200 px-6 py-4">
              <Button onClick={() => setIsUploadOpen(false)} type="button" variant="outline">
                取消
              </Button>
              <Button disabled={!selectedFile || !uploadForm.teamId || uploadMutation.isPending} onClick={prepareUpload} type="button">
                <UploadCloud className="size-4" />
                {uploadMutation.isPending ? '上传中' : '上传'}
              </Button>
            </div>
          </section>
        </div>
      ) : null}

      {archiveDeleteTarget ? (
        <AgentTeamConfirmDialog
          body={`确认申请删除报告归档「${archiveDeleteTarget.fileName}」？审批通过后删除文件。`}
          confirmLabel="确认申请"
          onCancel={() => setArchiveDeleteTarget(null)}
          onConfirm={() => deleteMutation.mutate(archiveDeleteTarget.id)}
          pending={deleteMutation.isPending}
          title="删除申请"
        />
      ) : null}

      {approvalDecisionTarget ? (
        <AgentTeamConfirmDialog
          body={
            approvalDecisionTarget.decision === 'APPROVE'
              ? `确认通过「${approvalDecisionTarget.fileName}」的删除申请？`
              : `确认拒绝「${approvalDecisionTarget.fileName}」的删除申请？`
          }
          confirmLabel={approvalDecisionTarget.decision === 'APPROVE' ? '确认通过' : '确认拒绝'}
          onCancel={() => setApprovalDecisionTarget(null)}
          onConfirm={confirmApprovalDecision}
          pending={approvalDecisionTarget.decision === 'APPROVE' ? approveMutation.isPending : rejectMutation.isPending}
          title={approvalDecisionTarget.decision === 'APPROVE' ? '通过审批' : '拒绝审批'}
        />
      ) : null}

      {uploadTarget ? (
        <AgentTeamConfirmDialog
          body={`确认上传「${uploadTarget.fileName}」到报告归档？文件大小 ${formatBytes(uploadTarget.fileSize)}。`}
          confirmLabel="确认上传"
          onCancel={() => setUploadTarget(null)}
          onConfirm={confirmUpload}
          pending={uploadMutation.isPending}
          title="上传报告"
        />
      ) : null}
    </main>
  );
}

function ApprovalSummary({ approval }: { approval: AgentTeamRunReportArchiveApprovalItem | null }) {
  if (!approval) return null;

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="text-sm font-semibold text-slate-950">申请信息</div>
        <StatusBadge tone={archiveApprovalStatusTone(approval.status)}>{archiveApprovalStatusLabel(approval.status)}</StatusBadge>
      </div>
      <div className="grid gap-3 text-sm">
        <InfoRow label="报告名称" value={approval.archive_file_name} />
        <InfoRow label="申请人" value={approval.requested_by?.name ?? '-'} />
        <InfoRow label="申请时间" value={formatDateTime(approval.requested_at)} />
        <InfoRow label="文件大小" value={formatBytes(approval.archive_size_bytes)} />
        <InfoRow label="申请原因" value={approval.reason ?? '-'} />
      </div>
    </div>
  );
}

function ApprovalListItem({
  approval,
  canReview,
  onApprove,
  onReject,
  pending,
}: {
  approval: AgentTeamRunReportArchiveApprovalItem;
  canReview: boolean;
  onApprove: () => void;
  onReject: () => void;
  pending: boolean;
}) {
  const isPending = approval.status === 'PENDING';

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-sm font-medium text-slate-950">{approval.archive_file_name}</div>
          <div className="mt-1 text-xs text-muted-foreground">
            {approval.requested_by?.name ?? '-'} · {formatDateTime(approval.requested_at)}
          </div>
        </div>
        <StatusBadge tone={archiveApprovalStatusTone(approval.status)}>{archiveApprovalStatusLabel(approval.status)}</StatusBadge>
      </div>
      {approval.reason ? <div className="mt-3 rounded-md bg-slate-50 px-3 py-2 text-xs text-slate-600">{approval.reason}</div> : null}
      <div className="mt-4 flex justify-end gap-2">
        <Button className="h-8 px-3 text-emerald-700" disabled={!canReview || !isPending || pending} onClick={onApprove} size="sm" type="button" variant="outline">
          <CheckCircle2 className="size-4" />
          同意
        </Button>
        <Button className="h-8 px-3 text-red-600" disabled={!canReview || !isPending || pending} onClick={onReject} size="sm" type="button" variant="outline">
          <XCircle className="size-4" />
          驳回
        </Button>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[72px_minmax(0,1fr)] gap-3">
      <div className="text-slate-500">{label}</div>
      <div className="min-w-0 break-words font-medium text-slate-800">{value}</div>
    </div>
  );
}

function FileTypeIcon({ archive }: { archive: AgentTeamRunReportArchiveItem }) {
  const type = archiveFileType(archive);
  const iconClassName = fileTypeIconClassName(type);
  const Icon = type === 'XLSX' || type === 'CSV' ? FileSpreadsheet : FileText;

  return (
    <span className={`grid size-10 shrink-0 place-items-center rounded-lg ${iconClassName}`}>
      <Icon className="size-5" />
    </span>
  );
}

function FileTypeBadge({ type }: { type: string }) {
  return <span className={`inline-flex rounded-md px-2 py-1 text-xs font-medium ${fileTypeBadgeClassName(type)}`}>{type}</span>;
}

function sourceLabel(source: AgentTeamRunReportArchiveItem['source']) {
  return source === 'MANUAL_UPLOAD' ? '人工上传' : '系统生成';
}

function reportTypeLabel(type: NonNullable<AgentTeamRunReportArchiveItem['report_type']>) {
  return ({ ACCEPTANCE: '验收报告', OPERATION: '运营报告', ANALYSIS: '分析报告', CUSTOM: '其他' } as const)[type];
}

function archiveFileType(archive: AgentTeamRunReportArchiveItem) {
  const extension = archive.file_name.split('.').pop()?.toUpperCase();
  return extension && extension.length <= 5 ? extension : 'FILE';
}

function reportArchiveContentType(fileName: string) {
  const extension = fileName.split('.').pop()?.toLowerCase();
  if (extension === 'pdf') return 'application/pdf';
  if (extension === 'docx') return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  if (extension === 'xlsx') return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  if (extension === 'pptx') return 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
  if (extension === 'csv') return 'text/csv';
  return 'application/octet-stream';
}

function fileToBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? '').split(',').at(-1) ?? '');
    reader.onerror = () => reject(reader.error ?? new Error('文件读取失败。'));
    reader.readAsDataURL(file);
  });
}

function hasPendingDeleteApproval(archive: AgentTeamRunReportArchiveItem, approvals: AgentTeamRunReportArchiveApprovalItem[]) {
  return approvals.some((approval) => approval.archive_id === archive.id && approval.status === 'PENDING');
}

function fileTypeIconClassName(type: string) {
  if (type === 'PDF') return 'bg-red-50 text-red-600';
  if (type === 'XLSX' || type === 'CSV') return 'bg-emerald-50 text-emerald-600';
  if (type === 'DOCX') return 'bg-blue-50 text-blue-600';
  if (type === 'PPTX') return 'bg-orange-50 text-orange-600';
  return 'bg-slate-100 text-slate-600';
}

function fileTypeBadgeClassName(type: string) {
  if (type === 'PDF') return 'bg-red-50 text-red-600';
  if (type === 'XLSX' || type === 'CSV') return 'bg-emerald-50 text-emerald-600';
  if (type === 'DOCX') return 'bg-blue-50 text-blue-600';
  if (type === 'PPTX') return 'bg-orange-50 text-orange-600';
  return 'bg-slate-100 text-slate-600';
}
