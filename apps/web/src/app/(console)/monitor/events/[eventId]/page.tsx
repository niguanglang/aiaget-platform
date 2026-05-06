import { MonitorEventDetailContent } from '@/components/monitor/monitor-event-detail-content';

export default async function MonitorEventDetailPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;

  return <MonitorEventDetailContent eventId={eventId} />;
}
