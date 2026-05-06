import { AgentEditContent } from '@/components/agents/agent-edit-content';

export default async function AgentEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return <AgentEditContent agentId={id} />;
}
