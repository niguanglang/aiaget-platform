import { SecurityEventDetailContent } from '@/components/security/security-event-detail-content';

export default async function SecurityEventDetailPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;

  return <SecurityEventDetailContent eventId={eventId} />;
}
