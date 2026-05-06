import { AgentTeamRunsContent } from '@/components/agent-teams/agent-team-runs-content';

export default async function AgentTeamRunsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return <AgentTeamRunsContent teamId={id} />;
}

