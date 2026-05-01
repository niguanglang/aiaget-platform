import { ConversationDetailContent } from '@/components/conversations/conversation-detail-content';

export default async function ConversationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return <ConversationDetailContent conversationId={id} />;
}
