import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });

  const { link_id } = await request.json() as { link_id: string };
  if (!link_id) return NextResponse.json({ error: 'link_id is required' }, { status: 400 });

  // Fetch current related_ids
  const { data: stock, error: fetchError } = await supabase
    .from('idea_stocks')
    .select('related_ids')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (fetchError || !stock) {
    return NextResponse.json({ error: 'ストックが見つかりません' }, { status: 404 });
  }

  const current: string[] = stock.related_ids ?? [];
  if (!current.includes(link_id)) {
    current.push(link_id);
  }

  const { error: updateError } = await supabase
    .from('idea_stocks')
    .update({ related_ids: current })
    .eq('id', id)
    .eq('user_id', user.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
