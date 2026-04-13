import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { analyzeStock } from '@/lib/claude';
import type { IdeaStock } from '@/types';

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('idea_stocks')
    .select('*')
    .eq('user_id', user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const stocks = (data ?? []) as IdeaStock[];
  const results: { id: string; title: string; status: 'ok' | 'error'; error?: string }[] = [];

  for (const stock of stocks) {
    try {
      const analysis = await analyzeStock({
        title: stock.title,
        source_platform: stock.source_platform,
        raw_text: stock.raw_text,
        human_note: stock.human_note ?? undefined,
      });

      const { error: updateError } = await supabase
        .from('idea_stocks')
        .update(analysis)
        .eq('id', stock.id)
        .eq('user_id', user.id);

      if (updateError) throw new Error(updateError.message);

      results.push({ id: stock.id, title: stock.title, status: 'ok' });
    } catch (err) {
      results.push({
        id: stock.id,
        title: stock.title,
        status: 'error',
        error: err instanceof Error ? err.message : String(err),
      });
    }

    // Rate limit: 1 req/sec to avoid Anthropic throttling
    await new Promise((r) => setTimeout(r, 1000));
  }

  const succeeded = results.filter((r) => r.status === 'ok').length;
  const failed = results.filter((r) => r.status === 'error').length;

  return NextResponse.json({ total: stocks.length, succeeded, failed, results });
}
