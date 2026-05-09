import { AgentTeamRunDetailContent } from '@/components/agent-teams/agent-team-run-detail-content';

export default async function AgentTeamRunDetailPage({
  params,
}: {
  params: Promise<{ id: string; runId: string }>;
}) {
  const { id, runId } = await params;

  return <AgentTeamRunDetailContent runId={runId} teamId={id} />;
}
