import { ApprovalAuditEventDetailContent } from '@/components/approval-audits/approval-audit-event-detail-content';

export default async function ApprovalAuditEventDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ eventId: string }>;
  searchParams: Promise<{ keyword?: string; window?: string }>;
}) {
  const [{ eventId }, query] = await Promise.all([params, searchParams]);

  return <ApprovalAuditEventDetailContent eventId={eventId} keyword={query.keyword} windowValue={query.window} />;
}
