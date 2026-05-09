import { SkillDetailContent } from '@/components/skills/skill-detail-content';

export default async function SkillDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return <SkillDetailContent skillId={id} />;
}
