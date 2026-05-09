import { SkillEditContent } from '@/components/skills/skill-edit-content';

export default async function SkillEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return <SkillEditContent skillId={id} />;
}
