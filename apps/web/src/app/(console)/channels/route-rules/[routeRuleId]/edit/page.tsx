import { ChannelRouteRuleEditContent } from '@/components/channels/channel-route-rule-edit-content';

export default async function ChannelRouteRuleEditPage({ params }: { params: Promise<{ routeRuleId: string }> }) {
  const { routeRuleId } = await params;

  return <ChannelRouteRuleEditContent routeRuleId={routeRuleId} />;
}
