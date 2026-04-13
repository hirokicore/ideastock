import NewPlanForm from './NewPlanForm';

type SearchParams = {
  source_idea_id?: string;
  title?: string;
  summary?: string;
  tags?: string;
  idea_list?: string;
  recommend_score?: string;
};

export default async function NewPlanPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;

  const ideaContext = params.source_idea_id
    ? {
        source_idea_id: params.source_idea_id,
        title: params.title ?? '',
        summary: params.summary ?? '',
        tags: safeParseArray(params.tags),
        idea_list: safeParseArray(params.idea_list),
        recommend_score: params.recommend_score ? Number(params.recommend_score) : null,
      }
    : null;

  return <NewPlanForm ideaContext={ideaContext} />;
}

function safeParseArray(json?: string): string[] {
  if (!json) return [];
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
