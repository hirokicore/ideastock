import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { analyzeStock } from '@/lib/claude';
import type { IdeaStock } from '@/types';

/** GET /api/admin/reanalyze — 処理対象の ID 一覧を返す */
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });

  const { data, error } = await supabase
    .from('idea_stocks')
    .select('id, title')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const ids = (data ?? []).map((s) => s.id);
  return NextResponse.json({ total: ids.length, ids });
}

/** POST /api/admin/reanalyze — { id: string } を受け取り 1 件だけ再分析 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });

  let body: { id: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'リクエストデータが不正です' }, { status: 400 });
  }

  const { id } = body;
  if (!id) return NextResponse.json({ error: 'id が必要です' }, { status: 400 });

  const { data, error: fetchError } = await supabase
    .from('idea_stocks')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (fetchError || !data) {
    return NextResponse.json({ error: 'ストックが見つかりません' }, { status: 404 });
  }

  const stock = data as IdeaStock;

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
      .eq('id', id)
      .eq('user_id', user.id);

    if (updateError) throw new Error(updateError.message);

    return NextResponse.json({ ok: true, id, title: stock.title });
  } catch (err) {
    return NextResponse.json(
      { ok: false, id, title: stock.title, error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
