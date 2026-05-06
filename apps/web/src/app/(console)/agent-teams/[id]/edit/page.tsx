import { AgentTeamEditContent } from '@/components/agent-teams/agent-team-edit-content';

export default async function AgentTeamEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return <AgentTeamEditContent teamId={id} />;
}

