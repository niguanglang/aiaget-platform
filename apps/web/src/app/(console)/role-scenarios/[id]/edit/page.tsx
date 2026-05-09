import { RoleScenarioEditContent } from '@/components/role-scenarios/role-scenario-edit-content';

export default async function RoleScenarioEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return <RoleScenarioEditContent scenarioId={id} />;
}
