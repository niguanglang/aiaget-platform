import { AgentTeamRunStepDetailContent } from '@/components/agent-teams/agent-team-run-step-detail-content';

export default async function AgentTeamRunStepDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; runId: string; stepId: string }>;
  searchParams: Promise<{ eventType?: string; eventId?: string }>;
}) {
  const { id, runId, stepId } = await params;
  const { eventType, eventId } = await searchParams;

  return (
    <AgentTeamRunStepDetailContent
      runId={runId}
      selectedEventId={eventId}
      selectedEventType={eventType}
      stepId={stepId}
      teamId={id}
    />
  );
}
