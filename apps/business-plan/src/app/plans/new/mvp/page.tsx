import MvpPlanForm from './MvpPlanForm';

export default async function MvpPlanPage({
  searchParams,
}: {
  searchParams: Promise<{ source_idea_id?: string }>;
}) {
  const { source_idea_id } = await searchParams;
  return <MvpPlanForm sourceIdeaId={source_idea_id ?? null} />;
}
