import { RoleScenarioDetailContent } from '@/components/role-scenarios/role-scenario-detail-content';

export default async function RoleScenarioDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return <RoleScenarioDetailContent scenarioId={id} />;
}
