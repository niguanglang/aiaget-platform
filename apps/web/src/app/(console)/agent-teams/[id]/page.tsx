import { AgentTeamDetailContent } from '@/components/agent-teams/agent-team-detail-content';

export default async function AgentTeamDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return <AgentTeamDetailContent teamId={id} />;
}

