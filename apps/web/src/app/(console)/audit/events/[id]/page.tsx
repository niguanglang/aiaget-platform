import { AuditEventDetailContent } from '@/components/audit/audit-event-detail-content';

export default async function AuditEventDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ keyword?: string; window?: string }>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);

  return <AuditEventDetailContent eventId={id} keyword={query.keyword} windowValue={query.window} />;
}
