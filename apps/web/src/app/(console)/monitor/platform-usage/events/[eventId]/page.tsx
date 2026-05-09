import { PlatformEventDetailContent } from '@/components/platform-event-usage/platform-event-detail-content';

export default async function PlatformEventDetailPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;

  return <PlatformEventDetailContent eventId={eventId} />;
}
