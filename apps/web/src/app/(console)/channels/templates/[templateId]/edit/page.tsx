import { ChannelTemplateEditContent } from '@/components/channels/channel-template-edit-content';

export default async function ChannelTemplateEditPage({ params }: { params: Promise<{ templateId: string }> }) {
  const { templateId } = await params;

  return <ChannelTemplateEditContent templateId={templateId} />;
}
