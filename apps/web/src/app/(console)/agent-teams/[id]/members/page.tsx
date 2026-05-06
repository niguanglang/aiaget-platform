import { AgentTeamMembersContent } from '@/components/agent-teams/agent-team-members-content';

export default async function AgentTeamMembersPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return <AgentTeamMembersContent teamId={id} />;
}

